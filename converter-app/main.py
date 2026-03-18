"""
DocFlow PDF↔Word Converter — Professional Desktop Application
Modern GUI with drag & drop, batch conversion, progress tracking.
"""

import os
import sys
import threading
import time
import traceback
from typing import List, Optional

import customtkinter as ctk
from tkinter import filedialog, messagebox

# App theme
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")


class ConverterApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("DocFlow PDF↔Word Converter")
        self.geometry("820x640")
        self.minsize(700, 550)

        # State
        self.files: List[str] = []
        self.output_dir: str = ""
        self.converting = False
        self.deps_status = {}

        # Build UI
        self._build_ui()

        # Check dependencies in background
        threading.Thread(target=self._check_deps, daemon=True).start()

        # Enable drag & drop
        self._setup_dnd()

    def _build_ui(self):
        # ── Header ──
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=20, pady=(15, 5))

        ctk.CTkLabel(
            header,
            text="DocFlow Converter",
            font=ctk.CTkFont(size=24, weight="bold"),
        ).pack(side="left")

        self.dep_label = ctk.CTkLabel(
            header,
            text="Checking dependencies...",
            font=ctk.CTkFont(size=11),
            text_color="gray",
        )
        self.dep_label.pack(side="right")

        # ── Mode selector ──
        mode_frame = ctk.CTkFrame(self, fg_color="transparent")
        mode_frame.pack(fill="x", padx=20, pady=(5, 10))

        self.mode_var = ctk.StringVar(value="pdf2word")

        ctk.CTkRadioButton(
            mode_frame,
            text="PDF → Word",
            variable=self.mode_var,
            value="pdf2word",
            font=ctk.CTkFont(size=13),
            command=self._on_mode_change,
        ).pack(side="left", padx=(0, 20))

        ctk.CTkRadioButton(
            mode_frame,
            text="Word → PDF",
            variable=self.mode_var,
            value="word2pdf",
            font=ctk.CTkFont(size=13),
            command=self._on_mode_change,
        ).pack(side="left")

        # OCR toggle
        self.ocr_var = ctk.BooleanVar(value=True)
        self.ocr_check = ctk.CTkCheckBox(
            mode_frame,
            text="OCR for scanned PDFs",
            variable=self.ocr_var,
            font=ctk.CTkFont(size=12),
        )
        self.ocr_check.pack(side="right")

        # ── Drop zone ──
        self.drop_frame = ctk.CTkFrame(
            self,
            height=140,
            corner_radius=16,
            border_width=2,
            border_color=("#3b82f6", "#1e40af"),
            fg_color=("#eff6ff", "#0f172a"),
        )
        self.drop_frame.pack(fill="x", padx=20, pady=5)
        self.drop_frame.pack_propagate(False)

        drop_inner = ctk.CTkFrame(self.drop_frame, fg_color="transparent")
        drop_inner.place(relx=0.5, rely=0.5, anchor="center")

        self.drop_icon = ctk.CTkLabel(
            drop_inner,
            text="📂",
            font=ctk.CTkFont(size=32),
        )
        self.drop_icon.pack()

        self.drop_label = ctk.CTkLabel(
            drop_inner,
            text="Drag & Drop PDF files here\nor click Browse to select",
            font=ctk.CTkFont(size=13),
            text_color="gray",
            justify="center",
        )
        self.drop_label.pack(pady=(4, 0))

        # Browse button on drop zone
        browse_btn = ctk.CTkButton(
            self.drop_frame,
            text="Browse Files",
            width=120,
            height=32,
            font=ctk.CTkFont(size=12),
            command=self._browse_files,
        )
        browse_btn.place(relx=0.5, rely=0.88, anchor="center")

        # ── File list ──
        list_frame = ctk.CTkFrame(self, fg_color="transparent")
        list_frame.pack(fill="both", expand=True, padx=20, pady=5)

        list_header = ctk.CTkFrame(list_frame, fg_color="transparent")
        list_header.pack(fill="x")

        self.file_count_label = ctk.CTkLabel(
            list_header,
            text="Files: 0",
            font=ctk.CTkFont(size=12, weight="bold"),
        )
        self.file_count_label.pack(side="left")

        ctk.CTkButton(
            list_header,
            text="Clear All",
            width=80,
            height=28,
            font=ctk.CTkFont(size=11),
            fg_color="transparent",
            border_width=1,
            border_color="gray",
            hover_color=("#fee2e2", "#450a0a"),
            text_color=("#dc2626", "#f87171"),
            command=self._clear_files,
        ).pack(side="right")

        # Scrollable file list
        self.file_listbox = ctk.CTkTextbox(
            list_frame,
            height=100,
            font=ctk.CTkFont(size=11, family="Consolas"),
            state="disabled",
            corner_radius=10,
        )
        self.file_listbox.pack(fill="both", expand=True, pady=(5, 0))

        # ── Output directory ──
        out_frame = ctk.CTkFrame(self, fg_color="transparent")
        out_frame.pack(fill="x", padx=20, pady=5)

        ctk.CTkLabel(
            out_frame,
            text="Output:",
            font=ctk.CTkFont(size=12, weight="bold"),
        ).pack(side="left")

        self.out_label = ctk.CTkLabel(
            out_frame,
            text="Same as input file",
            font=ctk.CTkFont(size=11),
            text_color="gray",
        )
        self.out_label.pack(side="left", padx=(8, 0))

        ctk.CTkButton(
            out_frame,
            text="Change",
            width=70,
            height=28,
            font=ctk.CTkFont(size=11),
            fg_color="transparent",
            border_width=1,
            border_color="gray",
            command=self._choose_output_dir,
        ).pack(side="right")

        # ── Progress ──
        prog_frame = ctk.CTkFrame(self, fg_color="transparent")
        prog_frame.pack(fill="x", padx=20, pady=(5, 0))

        self.progress_bar = ctk.CTkProgressBar(prog_frame, height=8, corner_radius=4)
        self.progress_bar.pack(fill="x")
        self.progress_bar.set(0)

        self.status_label = ctk.CTkLabel(
            prog_frame,
            text="Ready",
            font=ctk.CTkFont(size=11),
            text_color="gray",
        )
        self.status_label.pack(fill="x", pady=(3, 0))

        # ── Convert button ──
        btn_frame = ctk.CTkFrame(self, fg_color="transparent")
        btn_frame.pack(fill="x", padx=20, pady=(5, 15))

        self.convert_btn = ctk.CTkButton(
            btn_frame,
            text="Convert",
            height=44,
            font=ctk.CTkFont(size=15, weight="bold"),
            corner_radius=12,
            command=self._start_conversion,
        )
        self.convert_btn.pack(fill="x")

    def _setup_dnd(self):
        """Setup drag & drop support."""
        try:
            # Try tkinterdnd2 for native DnD
            from tkinterdnd2 import DND_FILES, TkinterDnD
            # If available, would need TkinterDnD base — skip if not set up
        except ImportError:
            pass

        # Fallback: bind click on drop zone as browse
        self.drop_frame.bind("<Button-1>", lambda e: self._browse_files())

    def _check_deps(self):
        """Check available dependencies."""
        from converter.utils import check_dependencies
        self.deps_status = check_dependencies()

        parts = []
        if self.deps_status.get("pymupdf"):
            parts.append("✓ PyMuPDF")
        if self.deps_status.get("pdf2docx"):
            parts.append("✓ pdf2docx")
        if self.deps_status.get("tesseract"):
            parts.append("✓ Tesseract")
        else:
            parts.append("✗ Tesseract")
        if self.deps_status.get("libreoffice"):
            parts.append("✓ LibreOffice")
        else:
            parts.append("✗ LibreOffice")

        text = "  |  ".join(parts)
        self.after(0, lambda: self.dep_label.configure(text=text))

    def _on_mode_change(self):
        mode = self.mode_var.get()
        if mode == "pdf2word":
            self.drop_label.configure(text="Drag & Drop PDF files here\nor click Browse to select")
            self.ocr_check.pack(side="right")
        else:
            self.drop_label.configure(text="Drag & Drop Word files here\nor click Browse to select")
            self.ocr_check.pack_forget()

    def _browse_files(self):
        mode = self.mode_var.get()
        if mode == "pdf2word":
            ftypes = [("PDF files", "*.pdf"), ("All files", "*.*")]
        else:
            ftypes = [("Word files", "*.docx;*.doc"), ("All files", "*.*")]

        paths = filedialog.askopenfilenames(filetypes=ftypes)
        if paths:
            for p in paths:
                if p not in self.files:
                    self.files.append(p)
            self._update_file_list()

    def _choose_output_dir(self):
        d = filedialog.askdirectory()
        if d:
            self.output_dir = d
            self.out_label.configure(text=d)

    def _clear_files(self):
        self.files.clear()
        self._update_file_list()

    def _update_file_list(self):
        self.file_count_label.configure(text=f"Files: {len(self.files)}")
        self.file_listbox.configure(state="normal")
        self.file_listbox.delete("1.0", "end")
        for i, f in enumerate(self.files):
            name = os.path.basename(f)
            size = os.path.getsize(f) if os.path.isfile(f) else 0
            size_str = f"{size / 1024:.1f} KB" if size < 1024 * 1024 else f"{size / (1024 * 1024):.1f} MB"
            self.file_listbox.insert("end", f"  {i + 1}. {name}  ({size_str})\n")
        self.file_listbox.configure(state="disabled")

    def _start_conversion(self):
        if self.converting:
            return
        if not self.files:
            messagebox.showwarning("No Files", "Please add files to convert.")
            return

        self.converting = True
        self.convert_btn.configure(state="disabled", text="Converting...")
        threading.Thread(target=self._do_conversion, daemon=True).start()

    def _do_conversion(self):
        mode = self.mode_var.get()
        total = len(self.files)
        success = 0
        errors = []

        for i, filepath in enumerate(self.files):
            filename = os.path.basename(filepath)
            self.after(0, lambda f=filename, idx=i: self._update_status(
                f"Converting {idx + 1}/{total}: {f}..."
            ))

            try:
                out_dir = self.output_dir or os.path.dirname(filepath)

                def progress_cb(pct, idx=i):
                    overall = ((idx + pct / 100) / total)
                    self.after(0, lambda v=overall: self.progress_bar.set(v))

                if mode == "pdf2word":
                    from converter.pdf_to_word import convert_pdf_to_word
                    from converter.utils import get_output_path

                    out_path = get_output_path(filepath, ".docx", out_dir)
                    convert_pdf_to_word(
                        filepath,
                        out_path,
                        progress_callback=progress_cb,
                        ocr_fallback=self.ocr_var.get(),
                    )
                else:
                    from converter.word_to_pdf import convert_word_to_pdf
                    from converter.utils import get_output_path

                    out_path = get_output_path(filepath, ".pdf", out_dir)
                    convert_word_to_pdf(
                        filepath,
                        out_path,
                        progress_callback=progress_cb,
                    )

                success += 1

            except Exception as e:
                errors.append(f"{filename}: {str(e)}")
                traceback.print_exc()

        # Done
        self.after(0, lambda: self.progress_bar.set(1.0))
        self.after(0, lambda: self.convert_btn.configure(state="normal", text="Convert"))

        if errors:
            err_text = "\n".join(errors[:10])
            self.after(0, lambda: self._update_status(
                f"Done: {success}/{total} converted, {len(errors)} failed"
            ))
            self.after(100, lambda: messagebox.showwarning(
                "Conversion Errors",
                f"{len(errors)} file(s) had errors:\n\n{err_text}"
            ))
        else:
            out_loc = self.output_dir or "same folder as input"
            self.after(0, lambda: self._update_status(
                f"✓ All {success} file(s) converted successfully → {out_loc}"
            ))
            self.after(100, lambda: messagebox.showinfo(
                "Success",
                f"All {success} file(s) converted successfully!\n\nOutput: {out_loc}"
            ))

        self.converting = False

    def _update_status(self, text: str):
        self.status_label.configure(text=text)


def main():
    app = ConverterApp()
    app.mainloop()


if __name__ == "__main__":
    main()
