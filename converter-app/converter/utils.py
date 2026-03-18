"""Shared utilities for the converter modules."""

import os
import sys
import shutil
import subprocess
import platform


def get_tesseract_path() -> str:
    """Find Tesseract OCR executable path."""
    # Check common Windows paths
    common_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
    ]
    for p in common_paths:
        if os.path.isfile(p):
            return p

    # Check PATH
    found = shutil.which("tesseract")
    if found:
        return found

    return ""


def get_libreoffice_path() -> str:
    """Find LibreOffice soffice executable path."""
    if platform.system() == "Windows":
        common_paths = [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
            r"C:\Program Files\LibreOffice\program\soffice.com",
        ]
        for p in common_paths:
            if os.path.isfile(p):
                return p
    elif platform.system() == "Darwin":
        mac_path = "/Applications/LibreOffice.app/Contents/MacOS/soffice"
        if os.path.isfile(mac_path):
            return mac_path
    else:
        for name in ["soffice", "libreoffice"]:
            found = shutil.which(name)
            if found:
                return found

    found = shutil.which("soffice")
    return found or ""


def check_dependencies() -> dict:
    """Check which dependencies are available."""
    result = {
        "tesseract": bool(get_tesseract_path()),
        "libreoffice": bool(get_libreoffice_path()),
        "pymupdf": False,
        "pdf2docx": False,
        "layoutparser": False,
    }

    try:
        import fitz
        result["pymupdf"] = True
    except ImportError:
        pass

    try:
        from pdf2docx import Converter
        result["pdf2docx"] = True
    except ImportError:
        pass

    try:
        import layoutparser
        result["layoutparser"] = True
    except ImportError:
        pass

    return result


def safe_filename(name: str) -> str:
    """Sanitize a filename for safe filesystem use."""
    keep = (" ", ".", "_", "-")
    return "".join(c for c in name if c.isalnum() or c in keep).strip()


def get_output_path(input_path: str, target_ext: str, output_dir: str = "") -> str:
    """Generate output file path from input path and target extension."""
    base = os.path.splitext(os.path.basename(input_path))[0]
    ext = target_ext if target_ext.startswith(".") else f".{target_ext}"
    out_dir = output_dir or os.path.dirname(input_path)
    out_path = os.path.join(out_dir, f"{base}{ext}")

    # Avoid overwriting: add suffix
    counter = 1
    while os.path.exists(out_path):
        out_path = os.path.join(out_dir, f"{base}_converted_{counter}{ext}")
        counter += 1

    return out_path
