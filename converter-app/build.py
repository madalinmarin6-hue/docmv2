"""
PyInstaller build script for DocFlow PDF↔Word Converter.
Run: python build.py
"""

import subprocess
import sys
import os


def build():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    main_script = os.path.join(script_dir, "main.py")

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name", "DocFlow-Converter",
        "--onefile",
        "--windowed",
        "--icon", "NONE",
        "--add-data", f"converter{os.pathsep}converter",
        "--hidden-import", "customtkinter",
        "--hidden-import", "fitz",
        "--hidden-import", "pdf2docx",
        "--hidden-import", "docx",
        "--hidden-import", "pytesseract",
        "--hidden-import", "PIL",
        "--collect-all", "customtkinter",
        "--noconfirm",
        "--clean",
        main_script,
    ]

    print("Building standalone EXE...")
    print(f"Command: {' '.join(cmd)}\n")

    result = subprocess.run(cmd, cwd=script_dir)

    if result.returncode == 0:
        dist_path = os.path.join(script_dir, "dist", "DocFlow-Converter.exe")
        print(f"\n✓ Build successful!")
        print(f"  EXE location: {dist_path}")
    else:
        print(f"\n✗ Build failed with code {result.returncode}")
        sys.exit(1)


if __name__ == "__main__":
    build()
