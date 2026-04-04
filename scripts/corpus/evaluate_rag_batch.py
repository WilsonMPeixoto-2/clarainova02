import argparse
import json
import subprocess
import unicodedata
from pathlib import Path

import requests


PROJECT_REF = "jasqctuzeznwdtbcuixn"
SUPABASE_URL = "https://jasqctuzeznwdtbcuixn.supabase.co"
REPO_ROOT = Path(__file__).resolve().parents[2]


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


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate the CLARA chat endpoint with a batch of grounded questions.")
    parser.add_argument("--questions", required=True, help="Path to questions JSON")
    parser.add_argument("--output", required=True, help="Path to output JSON")
    parser.add_argument("--response-mode", default="didatico", choices=["direto", "didatico"])
    args = parser.parse_args()

    questions_path = Path(args.questions)
    output_path = Path(args.output)
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

            record.update(
                {
                    "title": title,
                    "summary": summary,
                    "finalConfidence": analysis.get("finalConfidence"),
                    "answerScopeMatch": analysis.get("answerScopeMatch"),
                    "webFallbackUsed": analysis.get("webFallbackUsed"),
                    "ambiguityInUserQuestion": analysis.get("ambiguityInUserQuestion"),
                    "ambiguityInSources": analysis.get("ambiguityInSources"),
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
    print(json.dumps({"output": str(output_path), "count": len(results)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
