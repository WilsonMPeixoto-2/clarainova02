import argparse
import csv
import hashlib
import json
import re
import subprocess
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import pdfplumber
import requests


PROJECT_REF = "jasqctuzeznwdtbcuixn"
SUPABASE_URL = "https://jasqctuzeznwdtbcuixn.supabase.co"
EMBED_BATCH_SIZE = 10
REPO_ROOT = Path(__file__).resolve().parents[2]
MANIFEST_DEFAULT = REPO_ROOT / "docs" / "corpus_manifest.csv"
STAGING_ROOT = REPO_ROOT / "corpus_staging"


def run_supabase_cli_json(*args: str):
    result = subprocess.run(
        ["supabase", *args, "--output", "json"],
        cwd=str(REPO_ROOT),
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def get_service_role_key() -> str:
    keys = run_supabase_cli_json("projects", "api-keys", "--project-ref", PROJECT_REF)
    for key in keys:
        if key.get("name") == "service_role" or key.get("id") == "service_role":
            return key["api_key"]
    raise RuntimeError("Service role key not found via Supabase CLI.")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sanitize_file_name(name: str) -> str:
    sanitized = re.sub(r"[^A-Za-z0-9._-]+", "_", name.strip())
    sanitized = re.sub(r"_+", "_", sanitized).strip("_")
    return sanitized or "documento.pdf"


SECTION_BREAK_PATTERNS = [
    re.compile(r"^\d+(?:\.\d+)*\s+\S"),
    re.compile(r"^[A-Z][A-Z\sÀ-ɏ]{4,}$"),
    re.compile(r"^#{1,4}\s+"),
]

SECTION_HEADING_PATTERNS = [
    re.compile(r"^(\d+(?:\.\d+)*)\s+(.{3,80})$"),
    re.compile(r"^([A-Z][A-Z\sÀ-ɏ]{4,80})$"),
    re.compile(r"^(#{1,4})\s+(.{3,80})$"),
    re.compile(r"^([A-ZÀ-ɏ][a-zà-ɏ]+(?:\s+[A-Za-zÀ-ɏ]+){0,8})$"),
]

TARGET_CHUNK_SIZE = 1000
MAX_CHUNK_SIZE = 1400
MIN_CHUNK_SIZE = 150
CHUNK_OVERLAP_SENTENCES = 1


def is_section_break(line: str) -> bool:
    trimmed = line.strip()
    if len(trimmed) < 3 or len(trimmed) > 100:
        return False
    return any(pattern.search(trimmed) for pattern in SECTION_BREAK_PATTERNS)


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
    parts = re.split(r"(?<=[.!?])\s+", text)
    return parts[-1] if parts else ""


def merge_segments_into_chunks(paragraphs: list[str]) -> list[str]:
    chunks: list[str] = []
    current = ""
    prev_overlap = ""
    for paragraph in paragraphs:
        if len(paragraph) > MAX_CHUNK_SIZE:
            if current.strip():
                chunks.append(current.strip())
                prev_overlap = get_last_sentence(current) if CHUNK_OVERLAP_SENTENCES > 0 else ""
                current = ""
            chunks.append(paragraph.strip())
            prev_overlap = get_last_sentence(paragraph) if CHUNK_OVERLAP_SENTENCES > 0 else ""
            continue

        proposed = f"{current}\n\n{paragraph}" if current else paragraph
        if len(proposed) > TARGET_CHUNK_SIZE and current.strip():
            chunks.append(current.strip())
            prev_overlap = get_last_sentence(current) if CHUNK_OVERLAP_SENTENCES > 0 else ""
            current = f"{prev_overlap}\n\n{paragraph}" if prev_overlap else paragraph
        else:
            current = proposed

    if current.strip():
        if len(current.strip()) < MIN_CHUNK_SIZE and chunks:
            chunks[-1] = f"{chunks[-1]}\n\n{current.strip()}"
        else:
            chunks.append(current.strip())
    return chunks


def semantic_split(text: str) -> list[str]:
    normalized = text.replace("\x00", "").strip()
    if len(normalized) < MIN_CHUNK_SIZE:
        return [normalized] if len(normalized) >= 3 else []
    sections = split_into_segments(normalized)
    chunks: list[str] = []
    for section in sections:
        chunks.extend(merge_segments_into_chunks(split_section_into_paragraphs(section)))
    return [chunk for chunk in chunks if len(chunk.strip()) >= 3]


def detect_section_title(page_text: str, chunk_content: str) -> str | None:
    sample = chunk_content[:60]
    chunk_start = page_text.find(sample)
    text_before_chunk = page_text[:chunk_start] if chunk_start > 0 else page_text
    lines = [line.strip() for line in text_before_chunk.split("\n") if line.strip()]
    for line in reversed(lines[-5:]):
        if len(line) > 80 or len(line) < 3:
            continue
        for pattern in SECTION_HEADING_PATTERNS:
            match = pattern.match(line)
            if match:
                title = (match.group(2) if len(match.groups()) >= 2 and match.group(2) else match.group(1) or line).strip()
                return title[:80]
    return None


def extract_pages_from_pdf(path: Path) -> list[dict]:
    pages: list[dict] = []
    with pdfplumber.open(str(path)) as pdf:
        for index, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            pages.append({"pageNumber": index, "text": text})
    return pages


def build_chunks(pages: list[dict], source_tag: str) -> list[dict]:
    chunks: list[dict] = []
    for page in pages:
        text = (page["text"] or "").strip()
        if not text:
            continue
        for chunk in semantic_split(text):
            chunks.append(
                {
                    "content": chunk,
                    "pageStart": page["pageNumber"],
                    "pageEnd": page["pageNumber"],
                    "sectionTitle": detect_section_title(text, chunk),
                    "sourceTag": source_tag,
                }
            )
    return chunks


def get_local_path(row: dict[str, str]) -> Path:
    layer = row["camada"].strip().lower()
    folder_map = {
        "nucleo": "01_nucleo_oficial_sei_rio",
        "cobertura": "02_cobertura_pen_compativel",
        "apoio": "03_apoio_complementar_versionado",
        "quarentena": "99_quarentena_ou_arquivo_morto",
    }
    return STAGING_ROOT / folder_map[layer] / row["arquivo"]


def derive_governance(row: dict[str, str], chunk_count: int) -> tuple[dict, dict]:
    camada = row["camada"].strip().lower()
    prioridade = row["prioridade"].strip().upper()
    tipo = row["tipo_documental"].strip().lower()
    escopo = row["escopo_usuario"].strip().lower()
    title_normalized = row["titulo_oficial"].strip().lower()
    module_tags = row.get("module_tags", "").strip().lower()

    authority_level = {
        "nucleo": "official",
        "cobertura": "institutional",
        "apoio": "supporting",
        "quarentena": "internal",
    }.get(camada, "supporting")
    corpus_category = {
        "nucleo": "nucleo_oficial",
        "cobertura": "cobertura_operacional",
        "apoio": "apoio_complementar",
        "quarentena": "interno_excluido",
    }.get(camada, "apoio_complementar")
    ingestion_priority = {
        ("nucleo", "P1"): "alta",
        ("nucleo", "P2"): "alta",
        ("cobertura", "P2"): "media",
        ("apoio", "P3"): "baixa",
    }.get((camada, prioridade), "media")

    if camada == "nucleo":
        topic_scope = {
            "decreto": "sei_rio_norma",
            "resolucao": "sei_rio_norma",
            "guia": "sei_rio_guia",
            "manual": "sei_rio_manual",
            "termo": "sei_rio_termo",
            "faq": "sei_rio_faq",
        }.get(tipo, "material_apoio")
        search_weight = {
            ("nucleo", "P1"): 1.32,
            ("nucleo", "P2"): 1.12,
        }.get((camada, prioridade), 1.08)
    elif camada == "cobertura":
        if tipo in {"guia", "manual"}:
            topic_scope = "pen_manual_compativel"
            search_weight = 0.84
        elif "compat" in title_normalized or "tramita" in module_tags or "modulos_pen" in module_tags:
            topic_scope = "pen_compatibilidade"
            search_weight = 0.76
        else:
            topic_scope = "pen_release_note"
            search_weight = 0.7
    elif camada == "apoio":
        if "interface" in module_tags or tipo == "wiki":
            topic_scope = "interface_update"
            search_weight = 0.6
        else:
            topic_scope = "material_apoio"
            search_weight = 0.56
    else:
        topic_scope = "clara_internal"
        search_weight = 0.0

    document_kind = {
        "decreto": "norma",
        "resolucao": "norma",
        "guia": "guia",
        "manual": "manual",
        "termo": "termo",
        "faq": "faq",
    }.get(tipo, "apoio")
    source_type = {
        "decreto": "normativa",
        "resolucao": "normativa",
        "manual": "manual_oficial",
        "guia": "portal_oficial",
        "faq": "faq",
        "termo": "portal_oficial",
        "nota_tecnica": "manual_oficial",
        "wiki": "apoio_unidade",
    }.get(tipo, "upload")
    source_name = row["origem_institucional"].strip() or "Base documental CLARA"
    version_label = row["versao_sei_referida"].strip() or None
    published_at = f"{row['ano'].strip()}-01-01T00:00:00.000Z" if row["ano"].strip() else None
    is_active = camada != "quarentena"
    grounding_enabled = is_active
    grounding_status = "ready" if is_active else "excluded"
    readiness_summary = f"{chunk_count}/{chunk_count} embeddings prontos"

    metadata = {
        "document_kind": document_kind,
        "authority_level": authority_level,
        "search_weight": search_weight,
        "corpus_category": corpus_category,
        "ingestion_priority": ingestion_priority,
        "grounding_profile": topic_scope,
        "governance_notes": row["observacao_de_conflito"].strip() or None,
        "governance_reason": "corpus_manifest_batch",
        "manifest_record": {
            "camada": row["camada"].strip(),
            "prioridade": prioridade,
            "tipo_documental": tipo,
            "escopo_usuario": escopo,
            "versao_sei_referida": row["versao_sei_referida"].strip() or None,
            "scope_instance": row.get("scope_instance", "").strip() or None,
            "module_tags": row.get("module_tags", "").strip() or None,
        },
        "expected_chunks": chunk_count,
        "saved_chunks": chunk_count,
        "embedded_chunks": 0,
        "missing_embeddings": chunk_count,
        "grounding_status": grounding_status,
        "grounding_enabled": grounding_enabled,
        "governance_activation_requested": is_active,
        "readiness_summary": "Aguardando embeddings",
        "embedding_rebuild_strategy": "manifest_batch_ingestion",
    }

    document = {
        "is_active": is_active,
        "language_code": "pt-BR",
        "jurisdiction_scope": "municipal_rj" if camada == "nucleo" else "federal_br" if camada == "cobertura" else "apoio",
        "topic_scope": topic_scope,
        "source_type": source_type,
        "source_name": source_name,
        "source_url": row["fonte_url"].strip() or None,
        "summary": row["titulo_oficial"].strip() or None,
        "version_label": version_label,
        "published_at": published_at,
        "last_reviewed_at": None,
        "metadata_json": metadata,
    }
    return document, metadata


def api_headers(service_role_key: str, extra: dict | None = None) -> dict[str, str]:
    headers = {
        "Authorization": f"Bearer {service_role_key}",
        "apikey": service_role_key,
    }
    if extra:
        headers.update(extra)
    return headers


def rest_select(service_role_key: str, table: str, query: str):
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}?{query}",
        headers=api_headers(service_role_key, {"Accept": "application/json"}),
        timeout=45,
    )
    response.raise_for_status()
    return response.json()


def rest_insert(service_role_key: str, table: str, payload: dict):
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=api_headers(
            service_role_key,
            {
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
        ),
        json=payload,
        timeout=45,
    )
    response.raise_for_status()
    return response.json()


def rest_update(service_role_key: str, table: str, filter_query: str, payload: dict):
    response = requests.patch(
        f"{SUPABASE_URL}/rest/v1/{table}?{filter_query}",
        headers=api_headers(
            service_role_key,
            {
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
        ),
        json=payload,
        timeout=45,
    )
    response.raise_for_status()
    return response.json()


def upload_to_storage(service_role_key: str, bucket_path: str, file_path: Path):
    with file_path.open("rb") as handle:
        response = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/documents/{bucket_path}",
            headers=api_headers(
                service_role_key,
                {
                    "Content-Type": "application/pdf",
                    "x-upsert": "false",
                },
            ),
            data=handle.read(),
            timeout=120,
        )
    response.raise_for_status()
    return response.json()


def inspect_chunk_health(service_role_key: str, document_id: str) -> tuple[int, int]:
    rows = rest_select(service_role_key, "document_chunks", f"select=chunk_index,embedding&document_id=eq.{document_id}")
    saved = len(rows)
    embedded = sum(1 for row in rows if row.get("embedding"))
    return saved, embedded


def invoke_embed_chunks(service_role_key: str, document_id: str, title: str, batch: list[dict], start_index: int):
    response = requests.post(
        f"{SUPABASE_URL}/functions/v1/embed-chunks",
        headers=api_headers(service_role_key, {"Content-Type": "application/json"}),
        json={
            "document_id": document_id,
            "chunks": batch,
            "start_index": start_index,
            "title": title,
        },
        timeout=120,
    )
    response.raise_for_status()
    payload = response.json()
    if payload.get("ok") is False:
        raise RuntimeError(f"embed-chunks returned app error: {payload}")
    return payload


def iter_batches(items: list[dict], size: int) -> Iterable[tuple[int, list[dict]]]:
    for start in range(0, len(items), size):
        yield start, items[start:start + size]


def ingest_row(service_role_key: str, row: dict[str, str]):
    local_path = get_local_path(row)
    if not local_path.exists():
        return {"arquivo": row["arquivo"], "result": "missing_local_file", "document_id": None}

    document_hash = sha256_file(local_path)
    existing = rest_select(service_role_key, "documents", f"select=id,name,status,document_hash&document_hash=eq.{document_hash}&limit=1")
    if existing:
        return {"arquivo": row["arquivo"], "result": "duplicate_document_hash", "document_id": existing[0]["id"]}

    pages = extract_pages_from_pdf(local_path)
    full_text = "\n\n".join(page["text"] for page in pages if page["text"])
    if len(full_text.strip()) < 50:
        return {"arquivo": row["arquivo"], "result": "insufficient_text", "document_id": None}

    chunks = build_chunks(pages, local_path.name)
    if not chunks:
        return {"arquivo": row["arquivo"], "result": "no_chunks", "document_id": None}

    document_payload, metadata = derive_governance(row, len(chunks))
    storage_path = f"{uuid.uuid4()}_{sanitize_file_name(local_path.name)}"
    upload_to_storage(service_role_key, storage_path, local_path)

    inserted = rest_insert(
        service_role_key,
        "documents",
        {
            "name": row["titulo_oficial"].strip() or local_path.name,
            "file_path": storage_path,
            "file_name": local_path.name,
            "mime_type": "application/pdf",
            "storage_path": storage_path,
            "status": "processing",
            "document_hash": document_hash,
            "page_count": len(pages),
            "text_char_count": len(full_text),
            **document_payload,
        },
    )
    document = inserted[0]
    document_id = document["id"]

    request_ids: list[str] = []
    failed_embeddings = 0
    for start_index, batch in iter_batches(chunks, EMBED_BATCH_SIZE):
        payload = invoke_embed_chunks(service_role_key, document_id, row["titulo_oficial"], batch, start_index)
        failed_embeddings += int(payload.get("failed_embeddings") or 0)
        request_id = payload.get("request_id")
        if request_id:
            request_ids.append(request_id)

    saved_chunks, embedded_chunks = inspect_chunk_health(service_role_key, document_id)
    missing_embeddings = max(len(chunks) - embedded_chunks, 0)
    final_status = "processed" if embedded_chunks == len(chunks) else "embedding_pending"
    final_metadata = {
        **metadata,
        "saved_chunks": saved_chunks,
        "embedded_chunks": embedded_chunks,
        "missing_embeddings": missing_embeddings,
        "grounding_status": "ready" if final_status == "processed" and document_payload["is_active"] else "embeddings_pending",
        "grounding_enabled": final_status == "processed" and document_payload["is_active"],
        "readiness_summary": (
            f"{embedded_chunks}/{len(chunks)} embeddings prontos"
            if embedded_chunks != len(chunks)
            else f"{len(chunks)}/{len(chunks)} embeddings prontos"
        ),
        "last_embedding_attempt_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "last_embedding_request_ids": request_ids,
        "embedding_rebuild_strategy": "manifest_batch_ingestion",
    }
    rest_update(
        service_role_key,
        "documents",
        f"id=eq.{document_id}",
        {
            "status": final_status,
            "processed_at": datetime.now(timezone.utc).isoformat(timespec="seconds") if final_status == "processed" else None,
            "failed_at": None if final_status == "processed" else datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "failure_reason": None if final_status == "processed" else "embedding_incomplete",
            "metadata_json": final_metadata,
        },
    )

    return {
        "arquivo": row["arquivo"],
        "result": final_status,
        "document_id": document_id,
        "chunks": len(chunks),
        "embedded_chunks": embedded_chunks,
        "failed_embeddings": failed_embeddings,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Ingest a controlled batch from the corpus manifest into the remote project.")
    parser.add_argument("--manifest", default=str(MANIFEST_DEFAULT))
    parser.add_argument("--limit", type=int, default=3)
    parser.add_argument("--filter-layer", choices=["nucleo", "cobertura", "apoio", "quarentena"], default=None)
    parser.add_argument("--filter-priority", choices=["P1", "P2", "P3"], default=None)
    args = parser.parse_args()

    service_role_key = get_service_role_key()
    manifest_path = Path(args.manifest)
    rows: list[dict[str, str]] = []
    with manifest_path.open("r", encoding="utf-8-sig", newline="") as handle:
      reader = csv.DictReader(handle)
      for row in reader:
        if row["status_ingestao"].strip() not in {"nao_iniciado", "erro", "baixado_nao_ingerido"}:
            continue
        if row["status_download"].strip() == "pendente":
            continue
        if args.filter_layer and row["camada"].strip().lower() != args.filter_layer:
            continue
        if args.filter_priority and row["prioridade"].strip().upper() != args.filter_priority:
            continue
        rows.append(row)

    results = []
    for row in rows[: args.limit]:
        result = ingest_row(service_role_key, row)
        results.append(result)
        print(json.dumps(result, ensure_ascii=False))

    print(json.dumps({"processed": len(results)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
