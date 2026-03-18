"""OCR engine for scanned PDF detection and text extraction."""

import os
import fitz  # PyMuPDF
from PIL import Image
import io

from .utils import get_tesseract_path


def is_scanned_pdf(pdf_path: str, sample_pages: int = 3) -> bool:
    """
    Detect if a PDF is scanned (image-based) or digital (text-based).
    Checks the first N pages for extractable text.
    Returns True if the PDF appears to be scanned.
    """
    try:
        doc = fitz.open(pdf_path)
        pages_to_check = min(sample_pages, len(doc))

        total_text_len = 0
        total_images = 0

        for i in range(pages_to_check):
            page = doc[i]
            text = page.get_text("text").strip()
            total_text_len += len(text)
            images = page.get_images(full=True)
            total_images += len(images)

        doc.close()

        # If very little text but images exist, it's likely scanned
        if total_text_len < 50 and total_images > 0:
            return True

        # If no text at all
        if total_text_len == 0:
            return True

        return False

    except Exception:
        return False


def ocr_pdf_to_text(pdf_path: str, progress_callback=None) -> str:
    """
    Extract text from a scanned PDF using Tesseract OCR.
    Renders each page as an image, then runs OCR.
    """
    tess_path = get_tesseract_path()
    if not tess_path:
        raise RuntimeError(
            "Tesseract OCR not found. Install from:\n"
            "https://github.com/UB-Mannheim/tesseract/wiki"
        )

    import pytesseract
    pytesseract.pytesseract.tesseract_cmd = tess_path

    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    all_text = []

    for i in range(total_pages):
        page = doc[i]

        # Render page at 300 DPI for good OCR quality
        mat = fitz.Matrix(300 / 72, 300 / 72)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_data = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_data))

        # Run Tesseract OCR
        text = pytesseract.image_to_string(img, lang="eng+ron")
        all_text.append(text)

        if progress_callback:
            progress_callback(int((i + 1) / total_pages * 100))

    doc.close()
    return "\n\n--- Page Break ---\n\n".join(all_text)


def ocr_pdf_page_to_image(pdf_path: str, page_num: int, dpi: int = 300) -> Image.Image:
    """Render a single PDF page as a PIL Image at given DPI."""
    doc = fitz.open(pdf_path)
    page = doc[page_num]
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img_data = pix.tobytes("png")
    doc.close()
    return Image.open(io.BytesIO(img_data))
