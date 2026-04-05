import argparse
import json
import subprocess
import unicodedata
from pathlib import Path

import requests


PROJECT_REF = "jasqctuzeznwdtbcuixn"
SUPABASE_URL = "https://jasqctuzeznwdtbcuixn.supabase.co"
REPO_ROOT = Path(__file__).resolve().parents[2]

GENERIC_COPY_MARKERS = [
    "resposta documental guiada",
    "síntese documental localizada",
    "sintese documental localizada",
    "encontrei respaldo documental em",
    "organizei a resposta como uma leitura guiada",
    "organizei abaixo os pontos mais úteis dos trechos recuperados",
    "mantive a resposta estritamente apoiada nas referências recuperadas",
    "mantive a resposta estritamente apoiada nas referencias recuperadas",
]


def run_supabase_cli_json(*args: str):
    result = subprocess.run(
        ["supabase", *args, "--output", "json"],
        cwd=str(REPO_ROOT),
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def get_anon_key() -> str:
    keys = run_supabase_cli_json("projects", "api-keys", "--project-ref", PROJECT_REF)
    for key in keys:
        if key.get("name") == "anon" or key.get("id") == "anon":
            return key["api_key"]
    raise RuntimeError("Anon key not found via Supabase CLI.")


def normalize(value: str) -> str:
    stripped = unicodedata.normalize("NFD", value or "")
    stripped = "".join(char for char in stripped if unicodedata.category(char) != "Mn")
    return " ".join(stripped.lower().split())


def expected_reference_matched(expected: str, reference_titles: list[str]) -> bool:
    normalized_expected = normalize(expected)
    expected_words = normalized_expected.split()

    for title in reference_titles:
        normalized_title = normalize(title)
        if normalized_title == normalized_expected:
            return True
        if not expected_words:
            continue
        if all(word in normalized_title.split() for word in expected_words):
            if normalized_expected and normalized_expected[-1].isdigit():
                if normalized_title.startswith(normalized_expected) and len(normalized_title) > len(normalized_expected):
                    next_char = normalized_title[len(normalized_expected)]
                    if next_char in ".0123456789":
                        continue
            return True
    return False


def compute_summary(results: list[dict], response_mode: str) -> dict:
    ok_results = [result for result in results if result.get("status") == 200]
    confidence_values = [
        result["finalConfidence"]
        for result in ok_results
        if isinstance(result.get("finalConfidence"), (int, float))
    ]

    categories: dict[str, dict] = {}
    for result in results:
        category = result.get("category") or "uncategorized"
        bucket = categories.setdefault(
            category,
            {
                "total": 0,
                "httpOk": 0,
                "noWebFallback": 0,
                "scopeExact": 0,
                "expectedAllMet": 0,
                "nonGenericText": 0,
            },
        )
        bucket["total"] += 1
        if result.get("status") == 200:
            bucket["httpOk"] += 1
        if result.get("webFallbackUsed") is False:
            bucket["noWebFallback"] += 1
        if result.get("answerScopeMatch") == "exact":
            bucket["scopeExact"] += 1
        if result.get("expectedAllMet") is True:
            bucket["expectedAllMet"] += 1
        if result.get("genericCopyDetected") is False:
            bucket["nonGenericText"] += 1

    avg_final_confidence = None
    if confidence_values:
        avg_final_confidence = round(sum(confidence_values) / len(confidence_values), 4)

    return {
        "responseMode": response_mode,
        "total": len(results),
        "httpOk": sum(1 for result in results if result.get("status") == 200),
        "noWebFallback": sum(1 for result in ok_results if result.get("webFallbackUsed") is False),
        "scopeExact": sum(1 for result in ok_results if result.get("answerScopeMatch") == "exact"),
        "expectedAllMet": sum(1 for result in ok_results if result.get("expectedAllMet") is True),
        "nonGenericText": sum(1 for result in ok_results if result.get("genericCopyDetected") is False),
        "genericCopyDetected": sum(1 for result in ok_results if result.get("genericCopyDetected") is True),
        "clarificationRequested": sum(
            1 for result in ok_results if result.get("clarificationRequested") is True
        ),
        "ambiguityInSources": sum(
            1 for result in ok_results if result.get("ambiguityInSources") is True
        ),
        "avgFinalConfidence": avg_final_confidence,
        "categories": categories,
    }


def evaluate_gate(summary: dict, args: argparse.Namespace) -> list[str]:
    failures: list[str] = []

    gates = [
        ("httpOk", args.min_http_ok, "httpOk"),
        ("noWebFallback", args.min_no_web_fallback, "noWebFallback"),
        ("scopeExact", args.min_scope_exact, "scopeExact"),
        ("expectedAllMet", args.min_expected_all_met, "expectedAllMet"),
    ]

    for key, minimum, label in gates:
        if minimum is None:
            continue
        if summary.get(key, 0) < minimum:
            failures.append(f"{label} abaixo do minimo: {summary.get(key, 0)} < {minimum}")

    avg_final_confidence = summary.get("avgFinalConfidence")
    if args.min_avg_final_confidence is not None:
        if avg_final_confidence is None or avg_final_confidence < args.min_avg_final_confidence:
            failures.append(
                "avgFinalConfidence abaixo do minimo: "
                f"{avg_final_confidence} < {args.min_avg_final_confidence}"
            )

    if args.max_generic_copy_detected is not None:
        generic_copy_detected = summary.get("genericCopyDetected", 0)
        if generic_copy_detected > args.max_generic_copy_detected:
            failures.append(
                "genericCopyDetected acima do maximo: "
                f"{generic_copy_detected} > {args.max_generic_copy_detected}"
            )

    return failures


def has_generic_copy(*values: str | None) -> bool:
    visible_copy = normalize(" ".join(value for value in values if isinstance(value, str)))
    if not visible_copy:
        return False
    return any(marker in visible_copy for marker in GENERIC_COPY_MARKERS)


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate the CLARA chat endpoint with a batch of grounded questions.")
    parser.add_argument("--questions", required=True, help="Path to questions JSON")
    parser.add_argument("--output", required=True, help="Path to output JSON")
    parser.add_argument("--summary-output", help="Optional path to summary JSON")
    parser.add_argument("--response-mode", default="didatico", choices=["direto", "didatico"])
    parser.add_argument("--min-http-ok", type=int)
    parser.add_argument("--min-no-web-fallback", type=int)
    parser.add_argument("--min-scope-exact", type=int)
    parser.add_argument("--min-expected-all-met", type=int)
    parser.add_argument("--min-avg-final-confidence", type=float)
    parser.add_argument("--max-generic-copy-detected", type=int)
    args = parser.parse_args()

    questions_path = Path(args.questions)
    output_path = Path(args.output)
    summary_output_path = Path(args.summary_output) if args.summary_output else None
    anon_key = get_anon_key()

    questions = json.loads(questions_path.read_text(encoding="utf-8"))
    results: list[dict] = []

    session = requests.Session()
    headers = {
        "Authorization": f"Bearer {anon_key}",
        "apikey": anon_key,
        "Content-Type": "application/json",
    }

    for item in questions:
        payload = {
            "messages": [{"role": "user", "content": item["question"]}],
            "responseMode": args.response_mode,
        }
        response = session.post(
            f"{SUPABASE_URL}/functions/v1/chat",
            headers=headers,
            json=payload,
            timeout=120,
        )
        record: dict = {
            "id": item["id"],
            "category": item.get("category"),
            "question": item["question"],
            "status": response.status_code,
            "expectedReferences": item.get("expectedReferences", []),
            "expectedMode": item.get("expectedMode"),
            "note": item.get("note"),
        }

        if response.ok:
            body = response.json()
            structured = body.get("response", {})
            references = structured.get("referenciasFinais") or []
            title = structured.get("tituloCurto")
            summary = structured.get("resumoInicial")
            analysis = structured.get("analiseDaResposta") or {}
            process_states = structured.get("processStates") or []
            plain_text = body.get("plainText", "")

            reference_titles = [ref.get("titulo", "") for ref in references]
            expected_hits = []
            for expected in item.get("expectedReferences", []):
                hit = expected_reference_matched(expected, reference_titles)
                expected_hits.append({"expected": expected, "matched": hit})
            expected_all_met = all(hit["matched"] for hit in expected_hits) if expected_hits else None
            generic_copy_detected = has_generic_copy(title, summary, plain_text)

            record.update(
                {
                    "title": title,
                    "summary": summary,
                    "finalConfidence": analysis.get("finalConfidence"),
                    "answerScopeMatch": analysis.get("answerScopeMatch"),
                    "webFallbackUsed": analysis.get("webFallbackUsed"),
                    "ambiguityInUserQuestion": analysis.get("ambiguityInUserQuestion"),
                    "ambiguityInSources": analysis.get("ambiguityInSources"),
                    "clarificationRequested": analysis.get("clarificationRequested"),
                    "processStates": process_states,
                    "references": [
                        {
                            "id": ref.get("id"),
                            "titulo": ref.get("titulo"),
                            "subtitulo": ref.get("subtitulo"),
                            "paginas": ref.get("paginas"),
                            "tipo": ref.get("tipo"),
                        }
                        for ref in references
                    ],
                    "referenceLabels": reference_titles,
                    "steps": [
                        {
                            "numero": step.get("numero"),
                            "titulo": step.get("titulo"),
                        }
                        for step in structured.get("etapas") or []
                    ],
                    "genericCopyDetected": generic_copy_detected,
                    "expectedReferenceHits": expected_hits,
                    "expectedAllMet": expected_all_met,
                    "plainText": plain_text,
                }
            )
        else:
            record["error"] = response.text

        results.append(record)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    summary = compute_summary(results, args.response_mode)
    failures = evaluate_gate(summary, args)
    summary_payload = {
        "output": str(output_path),
        "summary": summary,
        "failures": failures,
    }

    if summary_output_path:
        summary_output_path.parent.mkdir(parents=True, exist_ok=True)
        summary_output_path.write_text(
            json.dumps(summary_payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    print(json.dumps(summary_payload, ensure_ascii=False))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
