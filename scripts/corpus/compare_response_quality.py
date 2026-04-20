import argparse
import json
import re
from pathlib import Path
from typing import Any


def sentence_count(value: str) -> int:
    parts = re.split(r"[.!?]+(?:\s+|$)", (value or "").strip())
    return len([part for part in parts if part.strip()])


def is_truncated(value: str) -> bool:
    return bool(re.search(r"(?:\.\.\.|…)\s*$", (value or "").strip()))


def load_records(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload if isinstance(payload, list) else []


def analyze_records(records: list[dict[str, Any]]) -> dict[str, Any]:
    summary: dict[str, Any] = {
      "total": 0,
      "didatico": {"total": 0, "richSummaries": 0, "substantiveProcedural": 0, "conceptualExplained": 0},
      "direto": {"total": 0, "conciseButComplete": 0},
      "truncatedSteps": 0,
      "avgSummaryChars": 0,
      "avgSummarySentences": 0,
      "avgStepChars": 0,
    }

    summary_chars: list[int] = []
    summary_sentences: list[int] = []
    step_lengths: list[int] = []

    for record in records:
        body = record.get("body") or {}
        response = body.get("response") or {}
        if not response:
            continue

        summary["total"] += 1
        mode = record.get("mode")
        summary_text = response.get("resumoInicial") or ""
        steps = response.get("etapas") or []
        observations = response.get("observacoesFinais") or []
        returned_mode = response.get("modoResposta")

        summary_chars.append(len(summary_text.strip()))
        summary_sentences.append(sentence_count(summary_text))

        truncated_here = False
        for step in steps:
            content = (step.get("conteudo") or "").strip()
            if content:
                step_lengths.append(len(content))
            if is_truncated(content):
                truncated_here = True
        if truncated_here:
            summary["truncatedSteps"] += 1

        if mode == "didatico":
            summary["didatico"]["total"] += 1
            if len(summary_text.strip()) >= 170 and sentence_count(summary_text) >= 2:
                summary["didatico"]["richSummaries"] += 1

            question = (record.get("question") or "").lower()
            is_conceptual = "o que é" in question or "o que e" in question
            substantive_steps = [
                step for step in steps
                if len((step.get("conteudo") or "").strip()) >= 140 and sentence_count(step.get("conteudo") or "") >= 2
            ]
            if not is_conceptual and returned_mode == "passo_a_passo" and len(substantive_steps) >= 2 and len(observations) >= 1:
                summary["didatico"]["substantiveProcedural"] += 1
            if is_conceptual and sentence_count(summary_text) >= 2 and (returned_mode == "explicacao" or len(steps) <= 1):
                summary["didatico"]["conceptualExplained"] += 1

        if mode == "direto":
            summary["direto"]["total"] += 1
            substantive_steps = [
                step for step in steps
                if len((step.get("conteudo") or "").strip()) >= 90 and sentence_count(step.get("conteudo") or "") >= 1
            ]
            if sentence_count(summary_text) >= 2 and len(substantive_steps) >= min(2, len(steps) or 0) and not truncated_here:
                summary["direto"]["conciseButComplete"] += 1

    if summary_chars:
        summary["avgSummaryChars"] = round(sum(summary_chars) / len(summary_chars), 2)
    if summary_sentences:
        summary["avgSummarySentences"] = round(sum(summary_sentences) / len(summary_sentences), 2)
    if step_lengths:
        summary["avgStepChars"] = round(sum(step_lengths) / len(step_lengths), 2)

    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare editorial quality metrics of CLARA responses before/after a RAG change.")
    parser.add_argument("--before", type=Path, required=True)
    parser.add_argument("--after", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    before_summary = analyze_records(load_records(args.before))
    after_summary = analyze_records(load_records(args.after))

    payload = {
        "before": before_summary,
        "after": after_summary,
        "delta": {
            "avgSummaryChars": round(after_summary["avgSummaryChars"] - before_summary["avgSummaryChars"], 2),
            "avgSummarySentences": round(after_summary["avgSummarySentences"] - before_summary["avgSummarySentences"], 2),
            "avgStepChars": round(after_summary["avgStepChars"] - before_summary["avgStepChars"], 2),
            "truncatedSteps": after_summary["truncatedSteps"] - before_summary["truncatedSteps"],
            "didaticoRichSummaries": after_summary["didatico"]["richSummaries"] - before_summary["didatico"]["richSummaries"],
            "didaticoSubstantiveProcedural": after_summary["didatico"]["substantiveProcedural"] - before_summary["didatico"]["substantiveProcedural"],
            "didaticoConceptualExplained": after_summary["didatico"]["conceptualExplained"] - before_summary["didatico"]["conceptualExplained"],
            "diretoConciseButComplete": after_summary["direto"]["conciseButComplete"] - before_summary["direto"]["conciseButComplete"],
        },
    }

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
