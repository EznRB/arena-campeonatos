"""Generate the academic PDF from its Markdown source.

Requires reportlab, pypdf, pypdfium2 and Pillow. Run with the Codex bundled
Python runtime, or an environment containing these packages. All page renders
are written to tmp/pdfs for visual inspection after generation.
"""

from pathlib import Path
import re
from xml.sax.saxutils import escape

from PIL import Image, ImageOps
import pypdfium2 as pdfium
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/QUATRO-PILARES.md"
OUTPUT = ROOT / "output/pdf/Arena-Quatro-Pilares.pdf"
RENDERS = ROOT / "tmp/pdfs"
ACCENT = colors.HexColor("#B54823")
INK = colors.HexColor("#24272F")
LINE = colors.HexColor("#D7CCC6")


def inline(value):
    value = escape(value.strip().replace("\u2011", "-").replace("\u2013", "-").replace("\u2014", "-"))
    value = re.sub(
        r"\[([^\]]+)\]\((https?://[^)]+)\)",
        r'<link href="\2" color="#B54823">\1</link>', value,
    )
    value = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", value)
    return re.sub(r"`([^`]+)`", r'<font face="Courier">\1</font>', value)


def footer(canvas, document):
    canvas.setStrokeColor(LINE)
    canvas.line(48, 38, A4[0] - 48, 38)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(INK)
    canvas.drawString(48, 25, "ARENA | Desenvolvimento Mobile | Quatro pilares")
    canvas.drawRightString(A4[0] - 48, 25, str(document.page))


def main():
    source = SOURCE.read_text(encoding="utf-8")
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="ArenaBody", fontSize=9.5, leading=13, spaceAfter=7, textColor=INK))
    styles.add(ParagraphStyle(name="ArenaCell", fontSize=8, leading=10, textColor=INK))
    for key in ("Title", "Heading1", "Heading2"):
        styles[key].textColor = ACCENT
        styles[key].spaceAfter = 8
        styles[key].spaceBefore = 10
        styles[key].keepWithNext = True
    lines = source.splitlines()
    story = []
    index = 0
    while index < len(lines):
        line = lines[index]
        if not line.strip():
            index += 1
            continue
        if line.startswith("|"):
            rows = []
            while index < len(lines) and lines[index].startswith("|"):
                cells = [cell.strip() for cell in lines[index].strip("|").split("|")]
                if not all(re.fullmatch(r"[: -]+", cell) for cell in cells):
                    rows.append([Paragraph(inline(cell), styles["ArenaCell"]) for cell in cells])
                index += 1
            table = Table(rows, colWidths=[(A4[0] - 96) / len(rows[0])] * len(rows[0]), repeatRows=1)
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F4E9E2")),
                ("GRID", (0, 0), (-1, -1), .35, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            story.extend([table, Spacer(1, 10)])
            continue
        if line.startswith("## "):
            if re.match(r"## [1-4]\. ", line) or line.startswith("## Atualização dos pilares"):
                story.append(PageBreak())
            story.append(Paragraph(inline(line[3:]), styles["Heading1"]))
        elif line.startswith("### "):
            story.append(Paragraph(inline(line[4:]), styles["Heading2"]))
        elif line.startswith("# "):
            story.append(Paragraph(inline(line[2:]), styles["Title"]))
        else:
            story.append(Paragraph(inline(line), styles["ArenaBody"]))
        index += 1
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    SimpleDocTemplate(
        str(OUTPUT), pagesize=A4, leftMargin=48, rightMargin=48,
        topMargin=44, bottomMargin=52, title="Arena - Quatro Pilares",
    ).build(story, onFirstPage=footer, onLaterPages=footer)
    reader = PdfReader(OUTPUT)
    extracted = "\n".join(page.extract_text() for page in reader.pages)
    for required in ("Motivação", "grupo de desenvolvimento", "Benchmarking", "Neon", "SecureStore"):
        assert required in extracted, f"Missing expected content: {required}"
    assert "Não há backend" not in extracted
    RENDERS.mkdir(parents=True, exist_ok=True)
    document = pdfium.PdfDocument(str(OUTPUT))
    thumbnails = []
    for page_index in range(len(document)):
        image = document[page_index].render(scale=1.3).to_pil().convert("RGB")
        image.save(RENDERS / f"arena-page-{page_index + 1:02}.png")
        image.thumbnail((420, 595))
        thumbnails.append(ImageOps.expand(image, border=2, fill="#aaaaaa"))
    width = max(image.width for image in thumbnails)
    height = max(image.height for image in thumbnails)
    sheet = Image.new("RGB", (width * 3, height * ((len(thumbnails) + 2) // 3)), "#dddddd")
    for page_index, image in enumerate(thumbnails):
        sheet.paste(image, ((page_index % 3) * width, (page_index // 3) * height))
    sheet.save(RENDERS / "arena-contact.png")
    print(f"PDF: {len(reader.pages)} pages, {OUTPUT.stat().st_size} bytes; content checks passed")
    print(f"Inspect every page in {RENDERS}")


if __name__ == "__main__":
    main()
