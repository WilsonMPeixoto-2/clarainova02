import argparse
import io
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36"
)


def slugify_filename_part(value: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9._-]+", "_", value.strip())
    slug = re.sub(r"_+", "_", slug).strip("_")
    return slug or "documento"


def clean_text_blocks(soup: BeautifulSoup) -> list[str]:
    for selector in [
        "script",
        "style",
        "noscript",
        "header",
        "footer",
        "nav",
        "aside",
        ".menu",
        ".nav",
        ".breadcrumbs",
        ".screen-reader-text",
    ]:
        for node in soup.select(selector):
            node.decompose()

    main = (
        soup.select_one("main")
        or soup.select_one("article")
        or soup.select_one('[role="main"]')
        or soup.select_one(".elementor-widget-theme-post-content")
        or soup.select_one(".entry-content")
        or soup.select_one(".post-content")
        or soup.body
    )
    if not main:
        return []

    blocks: list[str] = []
    for node in main.find_all(["h1", "h2", "h3", "h4", "p", "li"], recursive=True):
        text = " ".join(node.get_text(" ", strip=True).split())
        if not text:
            continue
        if len(text) < 2:
            continue
        blocks.append(text)

    deduped: list[str] = []
    last = None
    for block in blocks:
        if block == last:
            continue
        deduped.append(block)
        last = block
    return deduped


def build_pdf_from_text(output_path: Path, title: str, source_url: str, blocks: list[str]) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=14 * mm,
        bottomMargin=14 * mm,
        title=title,
        author="CLARA corpus staging",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CorpusTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        alignment=TA_LEFT,
        spaceAfter=8,
    )
    meta_style = ParagraphStyle(
        "CorpusMeta",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor="#4B5563",
        spaceAfter=5,
    )
    body_style = ParagraphStyle(
        "CorpusBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=14,
        alignment=TA_LEFT,
        spaceAfter=6,
    )

    story = [
        Paragraph(title, title_style),
        Paragraph(f"Origem oficial: {source_url}", meta_style),
        Paragraph(
            f"Capturado em: {datetime.now(timezone.utc).astimezone().isoformat(timespec='seconds')}",
            meta_style,
        ),
        Paragraph(
            "Observacao: PDF gerado localmente a partir do HTML oficial para staging e ingestao controlada.",
            meta_style,
        ),
        Spacer(1, 6),
    ]

    for block in blocks:
        if re.match(r"^[A-Z0-9][A-Z0-9\\s\\-_/]{4,}$", block) or len(block) <= 80 and ":" not in block and block == block.title():
            story.append(Paragraph(f"<b>{block}</b>", body_style))
        else:
            story.append(Paragraph(block, body_style))

    doc.build(story)
    output_path.write_bytes(buffer.getvalue())


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch official source and save as PDF for corpus staging.")
    parser.add_argument("url", help="Official source URL")
    parser.add_argument("output", help="Output PDF path")
    parser.add_argument("--title", help="Override title")
    args = parser.parse_args()

    output_path = Path(args.output)
    response = requests.get(args.url, headers={"User-Agent": USER_AGENT}, timeout=45)
    response.raise_for_status()

    content_type = response.headers.get("content-type", "").lower()
    if args.url.lower().endswith(".pdf") or "application/pdf" in content_type:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(response.content)
        print(f"saved_pdf={output_path}")
        return 0

    soup = BeautifulSoup(response.text, "html.parser")
    title = args.title or (soup.title.get_text(strip=True) if soup.title else urlparse(args.url).path.strip("/"))
    title = re.sub(r"\s+", " ", title).strip()
    if not title:
        title = slugify_filename_part(urlparse(args.url).path)

    blocks = clean_text_blocks(soup)
    if len(blocks) < 3:
        raise RuntimeError("Could not extract enough textual content from HTML source.")

    build_pdf_from_text(output_path, title, args.url, blocks)
    print(f"saved_pdf={output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
