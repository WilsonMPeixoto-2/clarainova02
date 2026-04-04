import argparse
import io
import re
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

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


def fetch_html(url: str) -> str:
    response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=45)
    response.raise_for_status()
    return response.text


def ordered_idpost_links(base_url: str, html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    seen: OrderedDict[str, None] = OrderedDict()
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        if "?idpost=" not in href:
            continue
        absolute = urljoin(base_url, href)
        seen.setdefault(absolute, None)
    return list(seen.keys())


def clean_article_blocks(html: str) -> tuple[str, list[str]]:
    soup = BeautifulSoup(html, "html.parser")

    container = (
        soup.select_one(".conteudo")
        or soup.select_one(".accordion-item")
        or soup.select_one("article")
        or soup.select_one("main")
        or soup.body
    )
    if not container:
        return "", []

    for selector in [
        "script",
        "style",
        "noscript",
        "header",
        "footer",
        "nav",
        "aside",
        ".item-anterior",
        ".item-posterior",
        ".capitulos",
    ]:
        for node in container.select(selector):
            node.decompose()

    title_node = container.find(["h1", "h2"])
    title = " ".join(title_node.get_text(" ", strip=True).split()) if title_node else ""

    blocks: list[str] = []
    for node in container.find_all(["h1", "h2", "h3", "h4", "p", "li"], recursive=True):
        text = " ".join(node.get_text(" ", strip=True).split())
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

    return title, deduped


def build_pdf(output_path: Path, title: str, source_url: str, chapters: list[tuple[str, list[str]]]) -> None:
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
    chapter_style = ParagraphStyle(
        "CorpusChapter",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        spaceBefore=8,
        spaceAfter=4,
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
            "Observacao: PDF consolidado localmente a partir da serie oficial do SEI.Rio para staging e ingestao controlada.",
            meta_style,
        ),
        Spacer(1, 6),
    ]

    for chapter_title, blocks in chapters:
        if chapter_title:
            story.append(Paragraph(chapter_title, chapter_style))
        for block in blocks:
            story.append(Paragraph(block, body_style))
        story.append(Spacer(1, 4))

    doc.build(story)
    output_path.write_bytes(buffer.getvalue())


def main() -> int:
    parser = argparse.ArgumentParser(description="Capture a SEI.Rio guide series with ?idpost chapters into one PDF.")
    parser.add_argument("url", help="Base guide URL")
    parser.add_argument("output", help="Output PDF path")
    parser.add_argument("--title", required=True, help="Final PDF title")
    args = parser.parse_args()

    base_html = fetch_html(args.url)
    chapter_urls = ordered_idpost_links(args.url, base_html)
    if not chapter_urls:
        raise RuntimeError("No ?idpost chapters found on base page.")

    chapters: list[tuple[str, list[str]]] = []
    for chapter_url in chapter_urls:
        chapter_html = fetch_html(chapter_url)
        chapter_title, blocks = clean_article_blocks(chapter_html)
        if not blocks:
            continue
        chapters.append((chapter_title, blocks))

    if not chapters:
        raise RuntimeError("No usable chapter content extracted from guide series.")

    build_pdf(Path(args.output), args.title, args.url, chapters)
    print(f"saved_pdf={args.output}")
    print(f"chapters={len(chapters)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
