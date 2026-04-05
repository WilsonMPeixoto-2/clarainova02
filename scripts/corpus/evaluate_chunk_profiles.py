import argparse
import json
import os
import statistics
import tempfile
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import requests

from ingest_manifest_batch import (
    EMBED_BATCH_SIZE,
    SUPABASE_URL,
    api_headers,
    extract_pages_from_pdf,
    get_service_role_key,
    rest_select,
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = PROJECT_ROOT / "docs/operational-reports/data/latest-r6a-chunking-experiment.json"
DEFAULT_PUBLIC_OUTPUT = PROJECT_ROOT / "public/data/latest-r6a-chunking-experiment.json"


@dataclass(frozen=True)
class ChunkProfile:
    id: str
    target_chunk_size: int
    max_chunk_size: int
    min_chunk_size: int
    overlap_sentences: int


PROFILES = [
    ChunkProfile("current", 1000, 1400, 150, 1),
    ChunkProfile("balanced_1400", 1400, 1800, 200, 1),
    ChunkProfile("context_1800", 1800, 2200, 250, 2),
]


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_active_documents(service_role_key: str, limit: int | None):
    query = (
        "select=id,name,file_name,file_path,storage_path,status,is_active,metadata_json,page_count,text_char_count"
        "&is_active=eq.true"
        "&order=created_at.asc"
    )
    if limit:
        query += f"&limit={limit}"

    return rest_select(service_role_key, "documents", query)


def download_storage_object(service_role_key: str, storage_path: str, destination: Path) -> None:
    response = requests.get(
        f"{SUPABASE_URL}/storage/v1/object/documents/{storage_path}",
        headers=api_headers(service_role_key),
        timeout=120,
    )
    response.raise_for_status()
    destination.write_bytes(response.content)


def is_section_break(line: str) -> bool:
    trimmed = line.strip()
    if len(trimmed) < 3 or len(trimmed) > 100:
      return False
    return (
        trimmed.startswith("#")
        or any(char.isdigit() for char in trimmed[:3]) and len(trimmed.split()) > 1
        or trimmed.isupper()
    )


def split_into_segments(text: str) -> list[list[str]]:
    sections: list[list[str]] = [[]]
    for line in text.split("\n"):
        if is_section_break(line) and sections[-1]:
            sections.append([])
        sections[-1].append(line)
    return [section for section in sections if any(line.strip() for line in section)]


def split_section_into_paragraphs(lines: list[str]) -> list[str]:
    paragraphs: list[str] = []
    current: list[str] = []
    for line in lines:
        if not line.strip() and current:
            paragraphs.append("\n".join(current).strip())
            current = []
        else:
            current.append(line)
    if current:
        paragraphs.append("\n".join(current).strip())
    return [paragraph for paragraph in paragraphs if paragraph]


def get_last_sentence(text: str) -> str:
    parts = text.replace("\n", " ").split(". ")
    return parts[-1].strip() if parts else ""


def merge_segments_into_chunks(paragraphs: list[str], profile: ChunkProfile) -> list[str]:
    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        if len(paragraph) > profile.max_chunk_size:
            if current.strip():
                chunks.append(current.strip())
                current = ""
            chunks.append(paragraph.strip())
            continue

        proposed = f"{current}\n\n{paragraph}" if current else paragraph
        if len(proposed) > profile.target_chunk_size and current.strip():
            chunks.append(current.strip())
            overlap = get_last_sentence(current) if profile.overlap_sentences > 0 else ""
            current = f"{overlap}\n\n{paragraph}" if overlap else paragraph
        else:
            current = proposed

    if current.strip():
        if len(current.strip()) < profile.min_chunk_size and chunks:
            chunks[-1] = f"{chunks[-1]}\n\n{current.strip()}"
        else:
            chunks.append(current.strip())
    return chunks


def semantic_split(text: str, profile: ChunkProfile) -> list[str]:
    normalized = text.replace("\x00", "").strip()
    if len(normalized) < profile.min_chunk_size:
        return [normalized] if len(normalized) >= 3 else []

    chunks: list[str] = []
    for section in split_into_segments(normalized):
        chunks.extend(merge_segments_into_chunks(split_section_into_paragraphs(section), profile))
    return [chunk for chunk in chunks if len(chunk.strip()) >= 3]


def build_chunks(pages: list[dict[str, Any]], profile: ChunkProfile) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    for page in pages:
        text = (page.get("text") or "").strip()
        if not text:
            continue
        for chunk in semantic_split(text, profile):
            chunks.append({
                "pageNumber": page["pageNumber"],
                "content": chunk,
                "charCount": len(chunk),
            })
    return chunks


def median(values: list[int]) -> float:
    return float(statistics.median(values)) if values else 0.0


def percentile(values: list[int], p: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = int(round((len(ordered) - 1) * p))
    return float(ordered[index])


def load_recent_search_metric_summary(service_role_key: str) -> dict[str, Any]:
    rows = rest_select(
        service_role_key,
        "search_metrics",
        "select=created_at,query_embedding_model&order=created_at.desc&limit=200",
    )
    model_counts: dict[str, int] = {}
    for row in rows:
        label = (row.get("query_embedding_model") or "unknown").strip() or "unknown"
        model_counts[label] = model_counts.get(label, 0) + 1

    semantic_traffic = sum(
        count
        for label, count in model_counts.items()
        if label not in {"keyword_only_no_embedding", "unknown"}
    )
    keyword_only_traffic = model_counts.get("keyword_only_no_embedding", 0)
    return {
        "rows": len(rows),
        "modelCounts": model_counts,
        "semanticTraffic": semantic_traffic,
        "keywordOnlyTraffic": keyword_only_traffic,
        "semanticTrafficPct": round((semantic_traffic / len(rows)) * 100, 2) if rows else 0.0,
    }


def embedding_dimension_smoke(service_role_key: str) -> dict[str, Any]:
    recent_search_metrics = load_recent_search_metric_summary(service_role_key)
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return {
            "status": "blocked_missing_local_key",
            "dimensions": [768, 1536],
            "recentSearchMetrics": recent_search_metrics,
            "note": (
                "GEMINI_API_KEY indisponível neste ambiente local; além disso, a telemetria recente mostra o estado "
                "operacional atual da recuperação semântica, que precisa estar estável antes de promover um teste "
                "de dimensionalidade."
            ),
        }

    return {
        "status": "not_executed",
        "dimensions": [768, 1536],
        "recentSearchMetrics": recent_search_metrics,
        "note": (
            "A trilha de dimensionalidade exige corpus re-embedado e quota estável; nesta rodada o experimento ficou "
            "restrito ao planejamento."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Compara perfis de chunking sobre o corpus ativo da CLARA.")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--public-output", type=Path, default=DEFAULT_PUBLIC_OUTPUT)
    args = parser.parse_args()

    service_role_key = get_service_role_key()
    documents = load_active_documents(service_role_key, args.limit)

    profile_docs: dict[str, list[dict[str, Any]]] = {profile.id: [] for profile in PROFILES}

    for document in documents:
        storage_path = document.get("storage_path") or document.get("file_path")
        if not storage_path:
            continue

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
            temp_path = Path(temp_file.name)

        try:
            download_storage_object(service_role_key, storage_path, temp_path)
            pages = extract_pages_from_pdf(temp_path)
        finally:
            if temp_path.exists():
                temp_path.unlink()

        full_text = "\n\n".join((page.get("text") or "") for page in pages)
        for profile in PROFILES:
            chunks = build_chunks(pages, profile)
            char_counts = [chunk["charCount"] for chunk in chunks]
            profile_docs[profile.id].append({
                "documentId": document["id"],
                "name": document.get("name"),
                "pageCount": len(pages),
                "textCharCount": len(full_text),
                "chunkCount": len(chunks),
                "avgChars": round(sum(char_counts) / len(char_counts), 2) if char_counts else 0,
                "medianChars": round(median(char_counts), 2),
                "p95Chars": round(percentile(char_counts, 0.95), 2),
                "maxChars": max(char_counts) if char_counts else 0,
            })

    profile_summaries: list[dict[str, Any]] = []
    current_total_chunks = 0
    for profile in PROFILES:
        docs = profile_docs[profile.id]
        total_chunks = sum(doc["chunkCount"] for doc in docs)
        all_chunk_counts = [doc["chunkCount"] for doc in docs]
        all_avg_chars = [doc["avgChars"] for doc in docs if doc["avgChars"] > 0]
        summary = {
            "profileId": profile.id,
            "config": {
                "targetChunkSize": profile.target_chunk_size,
                "maxChunkSize": profile.max_chunk_size,
                "minChunkSize": profile.min_chunk_size,
                "overlapSentences": profile.overlap_sentences,
            },
            "documents": len(docs),
            "totalChunks": total_chunks,
            "avgChunksPerDocument": round(sum(all_chunk_counts) / len(all_chunk_counts), 2) if all_chunk_counts else 0,
            "avgChunkChars": round(sum(all_avg_chars) / len(all_avg_chars), 2) if all_avg_chars else 0,
            "docLevelP95ChunkCount": round(percentile(all_chunk_counts, 0.95), 2),
        }
        if profile.id == "current":
            current_total_chunks = total_chunks
            summary["reductionVsCurrentPct"] = 0.0
        else:
            reduction = ((current_total_chunks - total_chunks) / current_total_chunks * 100) if current_total_chunks else 0.0
            summary["reductionVsCurrentPct"] = round(reduction, 2)
        profile_summaries.append(summary)

    best_non_current = max(profile_summaries[1:], key=lambda item: item["reductionVsCurrentPct"], default=None)
    recommendation = {
        "shipRuntimeChange": False,
        "recommendedProfile": "current",
        "reason": (
            "O experimento estrutural foi concluído, mas a trilha de dimensionalidade continua bloqueada e o chunking ainda opera por página; "
            "sem benchmark de retrieval com embeddings estáveis, a recomendação desta rodada é não alterar o runtime."
        ),
    }
    if best_non_current and best_non_current["reductionVsCurrentPct"] >= 25:
        recommendation["recommendedProfile"] = best_non_current["profileId"]
        recommendation["reason"] = (
            "O perfil alternativo reduz bastante a fragmentação, mas continua sem prova de retrieval sob embeddings estáveis. "
            "A mudança deve ficar em staging até o fim do R6A completo."
        )

    payload = {
        "checkedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "corpus": {
            "documents": len(documents),
            "pageBoundaryLocked": True,
            "note": "O chunking atual ainda respeita fronteiras de página, então ganhos de contexto seguem limitados por página.",
        },
        "embeddingDimensionSmoke": embedding_dimension_smoke(service_role_key),
        "profileSummaries": profile_summaries,
        "documentsByProfile": profile_docs,
        "recommendation": recommendation,
    }

    write_json(args.output, payload)
    write_json(args.public_output, payload)

    print(json.dumps({
        "output": str(args.output),
        "public_output": str(args.public_output),
        "profileSummaries": profile_summaries,
        "recommendation": recommendation,
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
