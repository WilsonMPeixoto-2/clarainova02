import argparse
import csv
import json
import pathlib
import ssl
import sys
from dataclasses import dataclass
from datetime import UTC, date, datetime
from email.utils import parsedate_to_datetime
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


REQUEST_TIMEOUT_SECONDS = 20
USER_AGENT = "clarainova02-corpus-freshness/1.0"
DEFAULT_MANIFEST = pathlib.Path("docs/corpus_manifest.csv")
DEFAULT_OUTPUT = pathlib.Path("docs/operational-reports/data/latest-corpus-freshness.json")
DEFAULT_PUBLIC_OUTPUT = pathlib.Path("public/data/latest-corpus-freshness.json")


@dataclass
class RemoteMetadata:
    status_code: int | None
    response_url: str | None
    last_modified: str | None
    etag: str | None
    method_used: str
    error: str | None = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Valida frescor do corpus a partir do manifesto documental.",
    )
    parser.add_argument("--manifest", type=pathlib.Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--output", type=pathlib.Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--public-output", type=pathlib.Path, default=DEFAULT_PUBLIC_OUTPUT)
    return parser.parse_args()


def parse_download_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value.strip())
    except ValueError:
        return None


def parse_last_modified(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        parsed = parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def isoformat_or_none(value: datetime | None) -> str | None:
    return value.isoformat().replace("+00:00", "Z") if value else None


def build_request(url: str, method: str) -> Request:
    return Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/pdf,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        method=method,
    )


def open_request(request: Request, *, allow_insecure_ssl: bool):
    if allow_insecure_ssl:
      return urlopen(
          request,
          timeout=REQUEST_TIMEOUT_SECONDS,
          context=ssl._create_unverified_context(),
      )

    return urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS)


def fetch_remote_metadata(url: str) -> RemoteMetadata:
    last_error: str | None = None

    for method in ("HEAD", "GET"):
        for allow_insecure_ssl in (False, True):
            try:
                with open_request(build_request(url, method), allow_insecure_ssl=allow_insecure_ssl) as response:
                    headers = response.headers
                    return RemoteMetadata(
                        status_code=response.status,
                        response_url=response.geturl(),
                        last_modified=headers.get("Last-Modified"),
                        etag=headers.get("ETag"),
                        method_used=method,
                    )
            except HTTPError as exc:
                last_error = f"HTTP {exc.code}"
                if method == "HEAD" and exc.code in {400, 403, 405, 406, 429, 500, 501, 502, 503}:
                    break

                return RemoteMetadata(
                    status_code=exc.code,
                    response_url=exc.geturl(),
                    last_modified=exc.headers.get("Last-Modified"),
                    etag=exc.headers.get("ETag"),
                    method_used=method,
                    error=last_error,
                )
            except URLError as exc:
                last_error = str(exc.reason)
                if "CERTIFICATE_VERIFY_FAILED" not in last_error or allow_insecure_ssl:
                    continue
            except ssl.SSLError as exc:
                last_error = str(exc)
                if "CERTIFICATE_VERIFY_FAILED" not in last_error or allow_insecure_ssl:
                    continue
            except Exception as exc:  # pragma: no cover - defensive
                last_error = str(exc)
                continue

    return RemoteMetadata(
        status_code=None,
        response_url=None,
        last_modified=None,
        etag=None,
        method_used="GET",
        error=last_error or "request_failed",
    )


def classify_freshness(
    *,
    source_url: str,
    download_date: date | None,
    remote: RemoteMetadata,
) -> tuple[str, str]:
    if not source_url:
        return "missing_url", "Manifesto sem URL de origem."

    if remote.error:
        return "request_failed", f"Falha ao consultar a origem: {remote.error}."

    if remote.status_code and remote.status_code >= 400:
        return "request_failed", f"Origem respondeu HTTP {remote.status_code}."

    remote_last_modified = parse_last_modified(remote.last_modified)
    if remote_last_modified and download_date:
        if remote_last_modified.date() > download_date:
            return "changed", "A origem parece mais recente do que a data registrada no manifesto."
        return "current", "A data remota não supera a data de download registrada no manifesto."

    if remote_last_modified and not download_date:
        return "monitor", "A origem informa Last-Modified, mas o manifesto não registra data_download."

    if remote.etag:
        return "monitor", "A origem informa ETag, mas não há Last-Modified suficiente para comparação direta."

    return "headers_missing", "A origem não expôs Last-Modified nem ETag para conferência simples."


def priority_key(status: str) -> int:
    order = {
        "changed": 0,
        "request_failed": 1,
        "missing_url": 2,
        "headers_missing": 3,
        "monitor": 4,
        "current": 5,
    }
    return order.get(status, 9)


def load_manifest(path: pathlib.Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return [dict(row) for row in reader]


def ensure_parent(path: pathlib.Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_json(path: pathlib.Path, payload: dict[str, Any]) -> None:
    ensure_parent(path)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    args = parse_args()
    rows = load_manifest(args.manifest)
    checked_at = datetime.now(UTC)
    items: list[dict[str, Any]] = []

    for row in rows:
        source_url = (row.get("fonte_url") or "").strip()
        download_date = parse_download_date(row.get("data_download"))
        remote = fetch_remote_metadata(source_url) if source_url else RemoteMetadata(
            status_code=None,
            response_url=None,
            last_modified=None,
            etag=None,
            method_used="HEAD",
        )
        freshness_status, note = classify_freshness(
            source_url=source_url,
            download_date=download_date,
            remote=remote,
        )

        items.append({
            "fileName": (row.get("arquivo") or "").strip(),
            "title": (row.get("titulo_oficial") or "").strip(),
            "sourceUrl": source_url or None,
            "origin": (row.get("origem_institucional") or "").strip() or None,
            "layer": (row.get("camada") or "").strip() or None,
            "priority": (row.get("prioridade") or "").strip() or None,
            "downloadDate": download_date.isoformat() if download_date else None,
            "freshnessStatus": freshness_status,
            "httpStatus": remote.status_code,
            "methodUsed": remote.method_used,
            "responseUrl": remote.response_url,
            "remoteLastModified": isoformat_or_none(parse_last_modified(remote.last_modified)),
            "etag": remote.etag,
            "note": note,
        })

    items.sort(key=lambda item: (
        priority_key(str(item["freshnessStatus"])),
        str(item["fileName"]).lower(),
    ))

    summary = {
        "totalEntries": len(items),
        "checkedEntries": sum(1 for item in items if item["sourceUrl"]),
        "currentCount": sum(1 for item in items if item["freshnessStatus"] == "current"),
        "changedCount": sum(1 for item in items if item["freshnessStatus"] == "changed"),
        "requestFailedCount": sum(1 for item in items if item["freshnessStatus"] == "request_failed"),
        "missingUrlCount": sum(1 for item in items if item["freshnessStatus"] == "missing_url"),
        "headersMissingCount": sum(1 for item in items if item["freshnessStatus"] == "headers_missing"),
        "monitorCount": sum(1 for item in items if item["freshnessStatus"] == "monitor"),
    }

    payload = {
        "checkedAt": checked_at.isoformat().replace("+00:00", "Z"),
        "manifestPath": str(args.manifest).replace("\\", "/"),
        "summary": summary,
        "items": items,
    }

    write_json(args.output, payload)
    write_json(args.public_output, payload)

    print(json.dumps({
        "output": str(args.output),
        "public_output": str(args.public_output),
        "summary": summary,
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
