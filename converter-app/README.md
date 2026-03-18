# DocFlow PDF↔Word Converter

Professional standalone desktop converter for PDF ↔ Word with 100% structure preservation.

## Features
- **PDF → Word**: Preserves layout, tables, borders, images, fonts, spacing, page breaks, columns, headers/footers
- **Word → PDF**: Perfect rendering via LibreOffice headless
- **Scanned PDF detection**: Auto OCR via Tesseract
- **Layout detection**: LayoutParser for document structure analysis
- **Drag & Drop GUI**: Modern CustomTkinter interface
- **Batch conversion**: Convert multiple files at once
- **Error handling**: Graceful handling of corrupted PDFs
- **Standalone EXE**: Compiled with PyInstaller

## Requirements

### System Dependencies
1. **Python 3.10+**
2. **Tesseract OCR**: Download from https://github.com/UB-Mannheim/tesseract/wiki
   - Install to `C:\Program Files\Tesseract-OCR\`
   - Add to system PATH
3. **LibreOffice**: Download from https://www.libreoffice.org/download/
   - Install to default location (e.g. `C:\Program Files\LibreOffice\`)

### Python Dependencies
```bash
pip install -r requirements.txt
```

## Usage

### Run directly
```bash
python main.py
```

### Build standalone EXE
```bash
python build.py
```
The EXE will be created in the `dist/` folder.

## Project Structure
```
converter-app/
├── main.py              # Entry point + GUI
├── converter/
│   ├── __init__.py
│   ├── pdf_to_word.py   # PDF → Word engine
│   ├── word_to_pdf.py   # Word → PDF engine
│   ├── ocr_engine.py    # Tesseract OCR integration
│   ├── layout_detect.py # LayoutParser integration
│   └── utils.py         # Shared utilities
├── build.py             # PyInstaller build script
├── requirements.txt
└── README.md
```
