from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "public"

NAVY_TOP = (22, 40, 63, 255)
NAVY_BOTTOM = (10, 19, 33, 255)
GOLD = (243, 197, 118, 255)
GOLD_SOFT = (227, 190, 121, 128)
CYAN = (92, 217, 232, 255)
MIST = (223, 232, 243, 255)
TEXT_MUTED = (168, 181, 198, 255)


def ensure_public_dir() -> None:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)


def lerp_color(start: tuple[int, int, int, int], end: tuple[int, int, int, int], factor: float) -> tuple[int, int, int, int]:
    return tuple(int(start[index] + (end[index] - start[index]) * factor) for index in range(4))


def pick_font(candidates: Iterable[str], size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def make_vertical_gradient(width: int, height: int, start: tuple[int, int, int, int], end: tuple[int, int, int, int]) -> Image.Image:
    image = Image.new("RGBA", (width, height))
    draw = ImageDraw.Draw(image)

    for y in range(height):
        factor = y / max(height - 1, 1)
        draw.line(((0, y), (width, y)), fill=lerp_color(start, end, factor))

    return image


def add_glow(base: Image.Image, center: tuple[int, int], radius: int, color: tuple[int, int, int, int], blur: int) -> Image.Image:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    x, y = center
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(base, layer)


def draw_icon(size: int, *, transparent_outer: bool, outer_padding: int, radius: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0) if transparent_outer else NAVY_BOTTOM)
    panel = make_vertical_gradient(size, size, NAVY_TOP, NAVY_BOTTOM)
    panel = add_glow(panel, (int(size * 0.76), int(size * 0.24)), int(size * 0.19), (92, 217, 232, 90), int(size * 0.11))
    panel = add_glow(panel, (int(size * 0.3), int(size * 0.78)), int(size * 0.16), (243, 197, 118, 34), int(size * 0.09))

    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(
        (outer_padding, outer_padding, size - outer_padding, size - outer_padding),
        radius=radius,
        fill=255,
    )
    image.paste(panel, (0, 0), mask)

    draw = ImageDraw.Draw(image)
    inner_offset = max(outer_padding + int(size * 0.012), outer_padding + 8)
    draw.rounded_rectangle(
        (inner_offset, inner_offset, size - inner_offset, size - inner_offset),
        radius=max(radius - int(size * 0.012), 0),
        outline=GOLD_SOFT,
        width=max(int(size * 0.022), 2),
    )

    arc_box = (
        outer_padding + int(size * 0.18),
        outer_padding + int(size * 0.18),
        size - outer_padding - int(size * 0.18),
        size - outer_padding - int(size * 0.18),
    )
    draw.arc(
        arc_box,
        start=45,
        end=315,
        fill=GOLD,
        width=max(int(size * 0.098), 6),
    )

    accent_start = (outer_padding + int(size * 0.69), outer_padding + int(size * 0.23))
    accent_end = (outer_padding + int(size * 0.81), outer_padding + int(size * 0.13))
    draw.line((accent_start, accent_end), fill=CYAN, width=max(int(size * 0.05), 3))

    dot_radius = max(int(size * 0.055), 4)
    dot_center = (outer_padding + int(size * 0.74), outer_padding + int(size * 0.64))
    glow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    glow_draw.ellipse(
        (
            dot_center[0] - dot_radius * 2,
            dot_center[1] - dot_radius * 2,
            dot_center[0] + dot_radius * 2,
            dot_center[1] + dot_radius * 2,
        ),
        fill=(92, 217, 232, 70),
    )
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(max(int(size * 0.03), 3)))
    image = Image.alpha_composite(image, glow_layer)
    draw = ImageDraw.Draw(image)
    draw.ellipse(
        (
            dot_center[0] - dot_radius,
            dot_center[1] - dot_radius,
            dot_center[0] + dot_radius,
            dot_center[1] + dot_radius,
        ),
        fill=CYAN,
    )

    return image


def fit_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont | ImageFont.ImageFont, max_width: int) -> str:
    if draw.textlength(text, font=font) <= max_width:
        return text

    words = text.split()
    lines: list[str] = []
    current = ""

    for word in words:
        attempt = f"{current} {word}".strip()
        if current and draw.textlength(attempt, font=font) > max_width:
            lines.append(current)
            current = word
        else:
            current = attempt

    if current:
        lines.append(current)

    return "\n".join(lines)


def draw_chip(draw: ImageDraw.ImageDraw, x: int, y: int, label: str, font: ImageFont.FreeTypeFont | ImageFont.ImageFont) -> int:
    left, top, right, bottom = draw.textbbox((0, 0), label, font=font)
    width = (right - left) + 42
    height = (bottom - top) + 24

    draw.rounded_rectangle((x, y, x + width, y + height), radius=height // 2, fill=(15, 27, 46, 208), outline=(227, 190, 121, 76), width=2)
    draw.text((x + 21, y + 10), label, fill=MIST, font=font)
    return width


def draw_og_image(size: tuple[int, int]) -> Image.Image:
    width, height = size
    image = make_vertical_gradient(width, height, NAVY_TOP, NAVY_BOTTOM)
    image = add_glow(image, (int(width * 0.82), int(height * 0.18)), int(height * 0.28), (92, 217, 232, 78), int(height * 0.14))
    image = add_glow(image, (int(width * 0.2), int(height * 0.9)), int(height * 0.32), (243, 197, 118, 26), int(height * 0.18))

    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.ellipse(
        (
            int(width * 0.03),
            int(height * 0.1),
            int(width * 0.43),
            int(height * 0.9),
        ),
        outline=(92, 217, 232, 32),
        width=3,
    )
    overlay_draw.ellipse(
        (
            int(width * 0.09),
            int(height * 0.18),
            int(width * 0.35),
            int(height * 0.82),
        ),
        outline=(227, 190, 121, 28),
        width=3,
    )
    image = Image.alpha_composite(image, overlay)

    icon = draw_icon(700, transparent_outer=True, outer_padding=42, radius=168).resize((270, 270), Image.Resampling.LANCZOS)
    image.alpha_composite(icon, (86, 96))

    serif_font = pick_font(
        (
            r"C:\Windows\Fonts\georgiab.ttf",
            r"C:\Windows\Fonts\timesbd.ttf",
        ),
        132,
    )
    kicker_font = pick_font(
        (
            r"C:\Windows\Fonts\segoeuib.ttf",
            r"C:\Windows\Fonts\arialbd.ttf",
        ),
        28,
    )
    subtitle_font = pick_font(
        (
            r"C:\Windows\Fonts\segoeui.ttf",
            r"C:\Windows\Fonts\arial.ttf",
        ),
        44,
    )
    chip_font = pick_font(
        (
            r"C:\Windows\Fonts\segoeuib.ttf",
            r"C:\Windows\Fonts\arialbd.ttf",
        ),
        26,
    )
    eyebrow_font = pick_font(
        (
            r"C:\Windows\Fonts\segoeuib.ttf",
            r"C:\Windows\Fonts\arialbd.ttf",
        ),
        24,
    )

    draw = ImageDraw.Draw(image)
    kicker = "CLARA / apoio operacional ao SEI-Rio"
    title = "CLARA"
    subtitle = "Orientação clara para documentos, assinatura e tramitação em rotinas administrativas."
    subtitle = fit_text(draw, subtitle, subtitle_font, 670)

    draw.text((390, 114), kicker, fill=GOLD, font=kicker_font)
    draw.text((390, 154), title, fill=GOLD, font=serif_font)
    draw.multiline_text((390, 316), subtitle, fill=MIST, font=subtitle_font, spacing=8)

    chip_x = 390
    chip_y = 500
    for label in ("modo direto", "modo didático", "exportação em PDF"):
        chip_width = draw_chip(draw, chip_x, chip_y, label, chip_font)
        chip_x += chip_width + 18

    draw.text((390, 74), "Ferramenta digital de apoio", fill=TEXT_MUTED, font=eyebrow_font)
    return image


def save_image(image: Image.Image, name: str, size: tuple[int, int], *, transparent: bool = True) -> None:
    output = image.resize(size, Image.Resampling.LANCZOS)
    if not transparent and output.mode != "RGBA":
        output = output.convert("RGBA")
    output.save(PUBLIC_DIR / name)


def main() -> None:
    ensure_public_dir()

    any_icon_source = draw_icon(1024, transparent_outer=True, outer_padding=62, radius=260)
    maskable_icon_source = draw_icon(1024, transparent_outer=False, outer_padding=24, radius=236)
    og_source = draw_og_image((2400, 1260))

    save_image(any_icon_source, "favicon.png", (512, 512))
    save_image(any_icon_source, "icon-512.png", (512, 512))
    save_image(any_icon_source, "icon-192.png", (192, 192))
    save_image(any_icon_source, "apple-touch-icon.png", (180, 180))
    save_image(any_icon_source, "favicon-32x32.png", (32, 32))
    save_image(any_icon_source, "favicon-16x16.png", (16, 16))
    save_image(maskable_icon_source, "icon-maskable-512.png", (512, 512), transparent=False)
    save_image(og_source, "og-clara.png", (1200, 630), transparent=False)

    favicon_32 = any_icon_source.resize((32, 32), Image.Resampling.LANCZOS)
    favicon_16 = any_icon_source.resize((16, 16), Image.Resampling.LANCZOS)
    favicon_48 = any_icon_source.resize((48, 48), Image.Resampling.LANCZOS)
    favicon_32.save(PUBLIC_DIR / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[favicon_16, favicon_48])

    generated = [
        "favicon.png",
        "favicon.ico",
        "favicon-32x32.png",
        "favicon-16x16.png",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
        "icon-maskable-512.png",
        "og-clara.png",
    ]
    print("Generated brand assets:")
    for asset in generated:
        print(f" - {asset}")


if __name__ == "__main__":
    main()
