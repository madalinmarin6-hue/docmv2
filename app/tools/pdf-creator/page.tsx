"use client"

import { useState, useRef } from "react"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import ToolLayout from "../../../components/ToolLayout"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type Slide = {
  type: "document" | "presentation"
  title: string
  content: string
  bg: string
  textColor: string
}

export default function PdfCreatorPage() {
  usePing()
  const [mode, setMode] = useState<"document" | "presentation">("document")
  const [slides, setSlides] = useState<Slide[]>([
    { type: "document", title: "", content: "", bg: "#ffffff", textColor: "#000000" },
  ])
  const [activeSlide, setActiveSlide] = useState(0)
  const [statusMsg, setStatusMsg] = useState("")
  const [docTitle, setDocTitle] = useState("Untitled")
  const [fontSize, setFontSize] = useState(12)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  function addSlide() {
    setSlides((prev) => [
      ...prev,
      { type: mode, title: "", content: "", bg: mode === "presentation" ? "#1e293b" : "#ffffff", textColor: mode === "presentation" ? "#ffffff" : "#000000" },
    ])
    setActiveSlide(slides.length)
  }

  function removeSlide(idx: number) {
    if (slides.length <= 1) return
    const next = slides.filter((_, i) => i !== idx)
    setSlides(next)
    if (activeSlide >= next.length) setActiveSlide(next.length - 1)
  }

  function updateSlide(key: keyof Slide, value: string) {
    setSlides((prev) => prev.map((s, i) => (i === activeSlide ? { ...s, [key]: value } : s)))
  }

  async function buildPdf() {
    try {
      setStatusMsg("Generating PDF...")
      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      for (const slide of slides) {
        if (mode === "document") {
          const lines = slide.content.split("\n")
          const linesPerPage = Math.floor(700 / (fontSize + 4))
          const chunks = []
          for (let i = 0; i < lines.length; i += linesPerPage) {
            chunks.push(lines.slice(i, i + linesPerPage))
          }
          if (chunks.length === 0) chunks.push([""])

          for (const chunk of chunks) {
            const page = pdfDoc.addPage([612, 792])
            const hex = slide.bg.replace("#", "")
            const bgR = parseInt(hex.substring(0, 2), 16) / 255
            const bgG = parseInt(hex.substring(2, 4), 16) / 255
            const bgB = parseInt(hex.substring(4, 6), 16) / 255
            page.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: rgb(bgR, bgG, bgB) })

            const txHex = slide.textColor.replace("#", "")
            const txR = parseInt(txHex.substring(0, 2), 16) / 255
            const txG = parseInt(txHex.substring(2, 4), 16) / 255
            const txB = parseInt(txHex.substring(4, 6), 16) / 255

            if (slide.title) {
              page.drawText(slide.title, { x: 50, y: 740, size: fontSize + 8, font: fontBold, color: rgb(txR, txG, txB) })
            }

            let y = slide.title ? 710 : 740
            for (const line of chunk) {
              const safeLine = line.replace(/[^\x20-\x7E]/g, " ").substring(0, 100)
              page.drawText(safeLine, { x: 50, y, size: fontSize, font, color: rgb(txR, txG, txB) })
              y -= fontSize + 4
            }
          }
        } else {
          // Presentation mode: landscape slides
          const page = pdfDoc.addPage([960, 540])
          const hex = slide.bg.replace("#", "")
          const bgR = parseInt(hex.substring(0, 2), 16) / 255
          const bgG = parseInt(hex.substring(2, 4), 16) / 255
          const bgB = parseInt(hex.substring(4, 6), 16) / 255
          page.drawRectangle({ x: 0, y: 0, width: 960, height: 540, color: rgb(bgR, bgG, bgB) })

          const txHex = slide.textColor.replace("#", "")
          const txR = parseInt(txHex.substring(0, 2), 16) / 255
          const txG = parseInt(txHex.substring(2, 4), 16) / 255
          const txB = parseInt(txHex.substring(4, 6), 16) / 255

          if (slide.title) {
            const titleWidth = fontBold.widthOfTextAtSize(slide.title.substring(0, 50), 36)
            page.drawText(slide.title.substring(0, 50), {
              x: (960 - titleWidth) / 2,
              y: 360,
              size: 36,
              font: fontBold,
              color: rgb(txR, txG, txB),
            })
          }

          if (slide.content) {
            const contentLines = slide.content.split("\n").slice(0, 10)
            let y = 280
            for (const line of contentLines) {
              const safeLine = line.replace(/[^\x20-\x7E]/g, " ").substring(0, 80)
              const w = font.widthOfTextAtSize(safeLine, 18)
              page.drawText(safeLine, { x: (960 - w) / 2, y, size: 18, font, color: rgb(txR, txG, txB) })
              y -= 28
            }
          }
        }
      }

      const bytes = await pdfDoc.save()
      setPdfBytes(bytes as Uint8Array)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setStatusMsg("PDF created! You can preview and download it below.")
    } catch (err) {
      console.error(err)
      setStatusMsg("Error generating PDF")
    }
  }

  async function downloadPdf() {
    if (!pdfBytes) return
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const outName = (docTitle || "document") + ".pdf"
    a.download = outName
    a.click()
    URL.revokeObjectURL(url)
    const editResult = await trackEdit({ fileName: outName, fileSize: blob.size, fileType: "pdf", toolUsed: "pdf-creator" })
    if (!editResult.allowed) { alert(editResult.error || "Edit limit reached"); return }
    saveToCloud(blob, outName, "pdf-creator")
  }

  const current = slides[activeSlide]

  return (
    <ToolLayout title="PDF Creator" subtitle="Create documents and presentations as PDF">
      <div className="flex flex-col gap-6">
        {/* MODE SELECTOR + TITLE */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            <button
              onClick={() => { setMode("document"); setSlides([{ type: "document", title: "", content: "", bg: "#ffffff", textColor: "#000000" }]); setActiveSlide(0) }}
              className={`px-5 py-2 text-sm font-medium transition ${mode === "document" ? "bg-blue-500 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
            >
              Document
            </button>
            <button
              onClick={() => { setMode("presentation"); setSlides([{ type: "presentation", title: "", content: "", bg: "#1e293b", textColor: "#ffffff" }]); setActiveSlide(0) }}
              className={`px-5 py-2 text-sm font-medium transition ${mode === "presentation" ? "bg-purple-500 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
            >
              Presentation
            </button>
          </div>

          <input
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400/50 w-48"
            placeholder="Document title"
          />

          {mode === "document" && (
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm focus:outline-none"
            >
              {[10, 11, 12, 14, 16, 18, 20, 24].map((s) => (
                <option key={s} value={s} className="bg-[#0a0f2e] text-white">{s}pt</option>
              ))}
            </select>
          )}

          <button onClick={buildPdf} className="ml-auto px-6 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20">
            Create PDF
          </button>
          {pdfBytes && (
            <button onClick={downloadPdf} className="px-6 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">
              Download PDF
            </button>
          )}
        </div>

        {/* SLIDE/PAGE THUMBNAILS */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`relative shrink-0 w-24 h-16 rounded-lg border-2 transition-all text-xs font-medium overflow-hidden
                ${i === activeSlide ? "border-blue-400 scale-105" : "border-white/10 hover:border-white/20"}`}
              style={{ backgroundColor: s.bg }}
            >
              <span className="absolute inset-0 flex items-center justify-center" style={{ color: s.textColor }}>
                {mode === "document" ? `Page ${i + 1}` : `Slide ${i + 1}`}
              </span>
              {slides.length > 1 && (
                <span
                  onClick={(e) => { e.stopPropagation(); removeSlide(i) }}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center cursor-pointer hover:bg-red-600"
                >
                  ×
                </span>
              )}
            </button>
          ))}
          <button
            onClick={addSlide}
            className="shrink-0 w-24 h-16 rounded-lg border-2 border-dashed border-white/10 hover:border-white/20 text-white/30 hover:text-white/50 text-2xl transition flex items-center justify-center"
          >
            +
          </button>
        </div>

        {/* EDITOR */}
        <div className="grid md:grid-cols-[1fr,250px] gap-6">
          <div className="space-y-4">
            <input
              type="text"
              value={current?.title || ""}
              onChange={(e) => updateSlide("title", e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-semibold focus:outline-none focus:border-blue-400/50 placeholder-white/30"
              placeholder={mode === "document" ? "Page title (optional)" : "Slide title"}
            />
            <textarea
              ref={contentRef}
              value={current?.content || ""}
              onChange={(e) => updateSlide("content", e.target.value)}
              className="w-full h-80 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono leading-relaxed resize-none focus:outline-none focus:border-blue-400/50 placeholder-white/30"
              placeholder={mode === "document" ? "Start typing your document content..." : "Slide body text..."}
            />
          </div>

          {/* STYLE PANEL */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <h3 className="text-sm font-semibold text-white/60">Style</h3>
            <div>
              <label className="text-xs text-white/40 block mb-1">Background</label>
              <input
                type="color"
                value={current?.bg || "#ffffff"}
                onChange={(e) => updateSlide("bg", e.target.value)}
                className="w-full h-10 rounded-lg cursor-pointer border border-white/10"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Text Color</label>
              <input
                type="color"
                value={current?.textColor || "#000000"}
                onChange={(e) => updateSlide("textColor", e.target.value)}
                className="w-full h-10 rounded-lg cursor-pointer border border-white/10"
              />
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-white/30">
                {mode === "document" ? "Letter size (8.5×11)" : "Widescreen (16:9)"}
              </p>
              <p className="text-xs text-white/30 mt-1">
                {slides.length} {mode === "document" ? "page" : "slide"}{slides.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {statusMsg && <p className="text-sm text-center text-emerald-400">{statusMsg}</p>}

        {previewUrl && (
          <div className="mt-4 rounded-2xl overflow-hidden border border-white/10">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
              <span className="text-xs text-white/50">PDF Preview</span>
              <button onClick={downloadPdf} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition">Download</button>
            </div>
            <iframe src={previewUrl} className="w-full h-[600px] bg-white" title="PDF Preview" />
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
