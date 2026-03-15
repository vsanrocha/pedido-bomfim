"""
One-time script to extract kit images from the Distribuidora Bomfim PDF catalog.
Extracts embedded images and saves them as WebP in public/images/.
"""

import fitz  # PyMuPDF
from pathlib import Path
from PIL import Image
import io
import re


PDF_PATH = Path.home() / "Downloads" / "TABELA DE PREÇOS DISTRIBUIDORA BOMFIM_260314_213531.PDF"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "images"

# Minimum image dimensions to filter out small icons/logos
MIN_WIDTH = 150
MIN_HEIGHT = 150


def slugify(text: str) -> str:
    """Convert text to a URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[àáâãä]", "a", text)
    text = re.sub(r"[èéêë]", "e", text)
    text = re.sub(r"[ìíîï]", "i", text)
    text = re.sub(r"[òóôõö]", "o", text)
    text = re.sub(r"[ùúûü]", "u", text)
    text = re.sub(r"[ç]", "c", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")
    return text


def extract_images():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(str(PDF_PATH))
    image_count = 0

    for page_num in range(len(doc)):
        page = doc[page_num]
        image_list = page.get_images(full=True)

        for img_index, img_info in enumerate(image_list):
            xref = img_info[0]
            base_image = doc.extract_image(xref)

            if base_image is None:
                continue

            img_bytes = base_image["image"]
            img_ext = base_image["ext"]
            width = base_image["width"]
            height = base_image["height"]

            # Skip small images (logos, icons, decorations)
            if width < MIN_WIDTH or height < MIN_HEIGHT:
                continue

            image_count += 1
            filename = f"page{page_num + 1}-img{img_index + 1}.webp"
            output_path = OUTPUT_DIR / filename

            # Convert to WebP
            img = Image.open(io.BytesIO(img_bytes))
            if img.mode in ("CMYK", "P"):
                img = img.convert("RGB")
            img.save(str(output_path), "WEBP", quality=85)

            print(f"  [{image_count}] Page {page_num + 1}, Image {img_index + 1}: "
                  f"{width}x{height} -> {filename}")

    doc.close()
    print(f"\nExtracted {image_count} images to {OUTPUT_DIR}")


if __name__ == "__main__":
    extract_images()
