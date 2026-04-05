import argparse
import json
import statistics
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from ingest_manifest_batch import get_service_role_key, rest_select


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = PROJECT_ROOT / "docs/operational-reports/data/latest-r6b-prompt-cache-readiness.json"
DEFAULT_PUBLIC_OUTPUT = PROJECT_ROOT / "public/data/latest-r6b-prompt-cache-readiness.json"
HEAVY_PROMPT_THRESHOLD = 10_000


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = int(round((len(ordered) - 1) * p))
    return float(ordered[index])


def build_model_summary(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        label = row["model_name"] or "unknown"
        grouped.setdefault(label, []).append(row)

    summaries: list[dict[str, Any]] = []
    for label, model_rows in sorted(grouped.items(), key=lambda item: item[0]):
        prompt_values = [row["prompt_tokens"] for row in model_rows if row["prompt_tokens"] > 0]
        cache_values = [row["cached_tokens"] for row in model_rows if row["cached_tokens"] is not None]
        cache_hits = sum(1 for value in cache_values if value and value > 0)
        summaries.append({
            "model": label,
            "rows": len(model_rows),
            "promptAvg": round(statistics.mean(prompt_values), 2) if prompt_values else 0.0,
            "promptP95": round(percentile(prompt_values, 0.95), 2) if prompt_values else 0.0,
            "providerUsageRows": sum(1 for row in model_rows if row["provider_usage_available"]),
            "providerCacheHitRows": cache_hits,
            "providerCacheHitPct": round((cache_hits / len(model_rows)) * 100, 2) if model_rows else 0.0,
            "providerCachedTokensAvg": round(statistics.mean(cache_values), 2) if cache_values else 0.0,
        })
    return summaries


def build_recommendation(rows: list[dict[str, Any]]) -> dict[str, Any]:
    prompt_values = [row["prompt_tokens"] for row in rows if row["prompt_tokens"] > 0]
    cache_values = [row["cached_tokens"] for row in rows if row["cached_tokens"] is not None]
    cache_hits = sum(1 for value in cache_values if value and value > 0)
    provider_usage_rows = sum(1 for row in rows if row["provider_usage_available"])

    if provider_usage_rows == 0:
        return {
            "shipRuntimeChange": False,
            "decision": "collect_more_provider_usage",
            "reason": "A telemetria de uso do provedor ainda não apareceu nas amostras analisadas. É cedo para justificar context caching explícito.",
        }

    if cache_hits > 0:
        return {
            "shipRuntimeChange": False,
            "decision": "keep_implicit_caching_only",
            "reason": "A telemetria já mostra cache hits implícitos do Gemini. Neste estágio, context caching explícito não é prioridade.",
        }

    prompt_p95 = percentile(prompt_values, 0.95) if prompt_values else 0.0
    if prompt_p95 < HEAVY_PROMPT_THRESHOLD:
        return {
            "shipRuntimeChange": False,
            "decision": "keep_current_prompt_path",
            "reason": "Os prompts recentes ficam abaixo do limiar pesado e não mostram pressão suficiente para context caching explícito.",
        }

    return {
        "shipRuntimeChange": False,
        "decision": "revisit_after_more_traffic",
        "reason": "Os prompts são grandes, mas ainda sem evidência suficiente de misses persistentes. Reavaliar após mais tráfego com telemetria do provedor.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Audita a prontidão para context caching explícito na CLARA.")
    parser.add_argument("--limit", type=int, default=200)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--public-output", type=Path, default=DEFAULT_PUBLIC_OUTPUT)
    args = parser.parse_args()

    service_role_key = get_service_role_key()
    rows = rest_select(
        service_role_key,
        "chat_metrics",
        f"select=created_at,model_name,prompt_tokens_estimate,metadata_json&order=created_at.desc&limit={args.limit}",
    )

    normalized_rows: list[dict[str, Any]] = []
    for row in rows:
        metadata = row.get("metadata_json") or {}
        normalized_rows.append({
            "created_at": row.get("created_at"),
            "model_name": row.get("model_name"),
            "prompt_tokens": float(metadata.get("prompt_tokens_total") or row.get("prompt_tokens_estimate") or 0),
            "prompt_over_10k": bool(metadata.get("prompt_over_10k")),
            "provider_usage_available": bool(metadata.get("provider_usage_available")),
            "cached_tokens": metadata.get("provider_cached_content_tokens"),
        })

    prompt_values = [row["prompt_tokens"] for row in normalized_rows if row["prompt_tokens"] > 0]
    cache_values = [float(value) for value in (row["cached_tokens"] for row in normalized_rows) if isinstance(value, (int, float))]
    provider_usage_rows = sum(1 for row in normalized_rows if row["provider_usage_available"])
    cache_hit_rows = sum(1 for value in cache_values if value > 0)

    payload = {
        "checkedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "sample": {
            "rows": len(normalized_rows),
            "limit": args.limit,
        },
        "promptTelemetry": {
            "avgPromptTokens": round(statistics.mean(prompt_values), 2) if prompt_values else 0.0,
            "p95PromptTokens": round(percentile(prompt_values, 0.95), 2) if prompt_values else 0.0,
            "maxPromptTokens": round(max(prompt_values), 2) if prompt_values else 0.0,
            "over10kCount": sum(1 for row in normalized_rows if row["prompt_over_10k"]),
        },
        "providerUsage": {
            "rowsWithUsage": provider_usage_rows,
            "rowsWithUsagePct": round((provider_usage_rows / len(normalized_rows)) * 100, 2) if normalized_rows else 0.0,
            "cacheHitRows": cache_hit_rows,
            "cacheHitPct": round((cache_hit_rows / len(normalized_rows)) * 100, 2) if normalized_rows else 0.0,
            "avgCachedTokens": round(statistics.mean(cache_values), 2) if cache_values else 0.0,
            "maxCachedTokens": round(max(cache_values), 2) if cache_values else 0.0,
        },
        "models": build_model_summary(normalized_rows),
        "recommendation": build_recommendation(normalized_rows),
    }

    write_json(args.output, payload)
    write_json(args.public_output, payload)
    print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
