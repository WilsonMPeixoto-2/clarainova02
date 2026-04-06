import argparse
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import requests

from ingest_manifest_batch import (
    EMBED_BATCH_SIZE,
    SUPABASE_URL,
    api_headers,
    build_chunks,
    extract_pages_from_pdf,
    get_service_role_key,
    inspect_chunk_health,
    invoke_embed_chunks,
    iter_batches,
    rest_select,
    rest_update,
)


REPO_ROOT = Path(__file__).resolve().parents[2]
PRODUCTION_SUPABASE_URL = "https://jasqctuzeznwdtbcuixn.supabase.co"


def is_truthy_env(value: str | None) -> bool:
    return (value or "").strip().lower() in {"1", "true", "yes", "on"}


def ensure_production_opt_in(*, allow_production: bool, supabase_url: str) -> None:
    if supabase_url != PRODUCTION_SUPABASE_URL:
        return

    if allow_production or is_truthy_env(os.getenv("CLARA_ALLOW_PRODUCTION_OPERATIONS")):
        return

    raise RuntimeError(
        "Operação bloqueada: re-embed no ambiente oficial exige --allow-production "
        "ou CLARA_ALLOW_PRODUCTION_OPERATIONS=1."
    )


def download_storage_object(service_role_key: str, storage_path: str, destination: Path) -> None:
    response = requests.get(
        f"{SUPABASE_URL}/storage/v1/object/documents/{storage_path}",
        headers=api_headers(service_role_key),
        timeout=120,
    )
    response.raise_for_status()
    destination.write_bytes(response.content)


def rest_delete(service_role_key: str, table: str, filter_query: str) -> None:
    response = requests.delete(
        f"{SUPABASE_URL}/rest/v1/{table}?{filter_query}",
        headers=api_headers(service_role_key, {"Prefer": "return=minimal"}),
        timeout=120,
    )
    response.raise_for_status()


def load_active_documents(service_role_key: str, limit: int | None, document_id: str | None):
    query = (
        "select=id,name,file_name,file_path,storage_path,status,is_active,metadata_json"
        "&order=created_at.asc"
    )
    if document_id:
        query += f"&id=eq.{document_id}"
    if limit:
        query += f"&limit={limit}"

    documents = rest_select(service_role_key, "documents", query)
    filtered_documents = []

    for document in documents:
      metadata = document.get("metadata_json") if isinstance(document.get("metadata_json"), dict) else {}
      governance_requested = metadata.get("governance_activation_requested")

      if document.get("is_active") is True or governance_requested is True:
        filtered_documents.append(document)

    return filtered_documents


def merge_metadata(existing_metadata: dict | None, *, chunk_count: int, embedded_chunks: int, request_ids: list[str]):
    base = dict(existing_metadata or {})
    status_ready = embedded_chunks == chunk_count

    base.update(
        {
            "expected_chunks": chunk_count,
            "saved_chunks": chunk_count,
            "embedded_chunks": embedded_chunks,
            "missing_embeddings": max(chunk_count - embedded_chunks, 0),
            "grounding_status": "ready" if status_ready else "embeddings_pending",
            "grounding_enabled": status_ready and bool(base.get("governance_activation_requested", True)),
            "readiness_summary": f"{embedded_chunks}/{chunk_count} embeddings prontos",
            "last_embedding_attempt_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "last_embedding_request_ids": request_ids,
            "embedding_rebuild_strategy": "r5a_native_batch_reembed",
        }
    )
    return base


def reembed_document(service_role_key: str, document: dict):
    document_id = document["id"]
    storage_path = document.get("storage_path") or document.get("file_path")
    if not storage_path:
        return {
            "document_id": document_id,
            "name": document.get("name"),
            "result": "missing_storage_path",
        }

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
        temp_path = Path(temp_file.name)

    try:
        download_storage_object(service_role_key, storage_path, temp_path)
        pages = extract_pages_from_pdf(temp_path)
    finally:
        if temp_path.exists():
            temp_path.unlink()

    chunks = build_chunks(pages, document.get("file_name") or document.get("name") or storage_path)
    if not chunks:
        return {
            "document_id": document_id,
            "name": document.get("name"),
            "result": "no_chunks",
        }

    rest_delete(service_role_key, "document_chunks", f"document_id=eq.{document_id}")

    request_ids: list[str] = []
    failed_embeddings = 0
    for start_index, batch in iter_batches(chunks, EMBED_BATCH_SIZE):
        payload = invoke_embed_chunks(service_role_key, document_id, document.get("name") or storage_path, batch, start_index)
        failed_embeddings += int(payload.get("failed_embeddings") or 0)
        request_id = payload.get("request_id")
        if request_id:
            request_ids.append(request_id)

    saved_chunks, embedded_chunks = inspect_chunk_health(service_role_key, document_id)
    final_status = "processed" if embedded_chunks == len(chunks) else "embedding_pending"
    final_metadata = merge_metadata(
        document.get("metadata_json") if isinstance(document.get("metadata_json"), dict) else {},
        chunk_count=len(chunks),
        embedded_chunks=embedded_chunks,
        request_ids=request_ids,
    )

    rest_update(
        service_role_key,
        "documents",
        f"id=eq.{document_id}",
        {
            "status": final_status,
            "is_active": final_status == "processed"
            and bool(final_metadata.get("grounding_enabled"))
            and bool(final_metadata.get("governance_activation_requested", document.get("is_active"))),
            "processed_at": datetime.now(timezone.utc).isoformat(timespec="seconds") if final_status == "processed" else None,
            "failed_at": None if final_status == "processed" else datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "failure_reason": None if final_status == "processed" else "embedding_incomplete",
            "metadata_json": final_metadata,
        },
    )

    return {
        "document_id": document_id,
        "name": document.get("name"),
        "chunks": len(chunks),
        "embedded_chunks": embedded_chunks,
        "failed_embeddings": failed_embeddings,
        "result": final_status,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Re-embed active CLARA corpus documents using the native batch embedding path.")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--document-id", default=None)
    parser.add_argument("--allow-production", action="store_true")
    args = parser.parse_args()

    service_role_key = get_service_role_key()
    ensure_production_opt_in(
        allow_production=args.allow_production,
        supabase_url=SUPABASE_URL,
    )
    documents = load_active_documents(service_role_key, args.limit, args.document_id)

    results = []
    for document in documents:
        result = reembed_document(service_role_key, document)
        results.append(result)
        print(json.dumps(result, ensure_ascii=False))

    print(json.dumps({"processed": len(results)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
