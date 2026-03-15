"use client"

import { useState, useCallback } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import * as XLSX from "xlsx"
import PptxGenJS from "pptxgenjs"
import { saveToCloud } from "@/lib/saveToCloud"

type Props = {
  title: string
  subtitle: string
  fromFormat: string
  toFormat: string
  acceptTypes: string
  fromColor: string
  toColor: string
}

export default function ConvertPage({ title, subtitle, fromFormat, toFormat, acceptTypes, fromColor, toColor }: Props) {

  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState("")
  const [resultName, setResultName] = useState("")

  const simulateProgress = () => {
    setProgress(0)
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5
      if (p >= 95) { clearInterval(interval); setProgress(95) }
      else setProgress(Math.round(p))
    }, 200)
    return interval
  }

  const handleConvert = useCallback(async () => {
    if (!file) return
    setStatus("processing")
    const interval = simulateProgress()

    try {
      const buffer = await file.arrayBuffer()
      let blob: Blob
      let outputName: string

      const baseName = file.name.replace(/\.[^.]+$/, "")

      if (toFormat === "PDF") {
        const pdfDoc = await PDFDocument.create()
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

        if (fromFormat === "JPG" || fromFormat === "PNG") {
          const imgBytes = new Uint8Array(buffer)
          const image = fromFormat === "JPG"
            ? await pdfDoc.embedJpg(imgBytes)
            : await pdfDoc.embedPng(imgBytes)
          const { width, height } = image.scaleToFit(595, 842)
          const page = pdfDoc.addPage([595, 842])
          page.drawImage(image, {
            x: (595 - width) / 2,
            y: (842 - height) / 2,
            width,
            height,
          })
        } else {
          const text = await file.text()
          const lines = text.split("\n")
          const linesPerPage = 45
          for (let i = 0; i < lines.length; i += linesPerPage) {
            const page = pdfDoc.addPage([595, 842])
            let y = 800
            if (i === 0) {
              page.drawText(baseName, { x: 50, y, size: 20, font: boldFont, color: rgb(0.1, 0.1, 0.4) })
              y -= 35
              page.drawText(`Converted from ${fromFormat}`, { x: 50, y, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
              y -= 25
            }
            const chunk = lines.slice(i, i + linesPerPage)
            for (const line of chunk) {
              const safeLine = line.replace(/[^\x20-\x7E]/g, " ").substring(0, 90)
              page.drawText(safeLine, { x: 50, y, size: 11, font, color: rgb(0, 0, 0) })
              y -= 16
            }
          }
        }

        const pdfBytes = await pdfDoc.save()
        blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
        outputName = baseName + ".pdf"

      } else if (fromFormat === "PDF" && (toFormat === "JPG" || toFormat === "PNG")) {
        // Render PDF page to canvas using pdfjs-dist
        const pdfjsLib = await import("pdfjs-dist")
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
        const pdfData = new Uint8Array(buffer)
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise
        const page = await pdf.getPage(1)
        const scale = 2
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement("canvas")
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext("2d")!
        await page.render({ canvasContext: ctx, viewport }).promise
        const mimeType = toFormat === "JPG" ? "image/jpeg" : "image/png"
        const dataUrl = canvas.toDataURL(mimeType, 0.95)
        const res = await fetch(dataUrl)
        blob = await res.blob()
        outputName = baseName + (toFormat === "JPG" ? ".jpg" : ".png")

      } else {
        // Read source content
        let textContent: string
        try {
          textContent = await file.text()
        } catch {
          textContent = `[Binary content from ${file.name}]`
        }

        // For PDF sources, try to extract readable text from binary
        if (fromFormat === "PDF") {
          const raw = textContent
          const extracted: string[] = []
          // Extract text from PDF parenthesized strings
          const regex = /\(([^)]{1,500})\)/g
          let m
          while ((m = regex.exec(raw)) !== null) {
            const s = m[1].replace(/\\n/g, "\n").replace(/\\\\/g, "\\").replace(/\\r/g, "")
            if (s.length > 1 && /[a-zA-Z0-9]/.test(s)) extracted.push(s)
          }
          if (extracted.length > 0) {
            textContent = extracted.join("\n")
          } else {
            textContent = `[PDF content from ${file.name} - text extraction limited in browser]`
          }
        }

        if (toFormat === "Word") {
          // Create HTML that Word can open natively (save as .doc)
          const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>body{font-family:Calibri,sans-serif;margin:2cm;line-height:1.6;}h1{color:#1a1a2e;}p.meta{color:#888;font-size:10pt;}</style></head><body><h1>${baseName}</h1><p class="meta">Converted from ${fromFormat}</p>${textContent.split("\n").map(l => `<p>${l.replace(/</g, "&lt;")}</p>`).join("")}</body></html>`
          blob = new Blob(["\ufeff" + html], { type: "application/msword" })
          outputName = baseName + ".doc"
        } else if (toFormat === "Excel") {
          // Create real XLSX using xlsx library
          const lines = textContent.split("\n").map(line => line.split(/[,\t]/).map(cell => cell.trim()))
          const ws = XLSX.utils.aoa_to_sheet(lines)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
          const xlsxBuf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
          blob = new Blob([xlsxBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
          outputName = baseName + ".xlsx"
        } else if (toFormat === "PPTX") {
          // Create real PPTX using pptxgenjs
          const pptx = new PptxGenJS()
          const contentLines = textContent.split("\n")
          const linesPerSlide = 12
          for (let i = 0; i < contentLines.length; i += linesPerSlide) {
            const slide = pptx.addSlide()
            if (i === 0) {
              slide.addText(baseName, { x: 0.5, y: 0.3, w: 9, h: 1, fontSize: 28, bold: true, color: "1a1a2e" })
            }
            const chunk = contentLines.slice(i, i + linesPerSlide).join("\n")
            slide.addText(chunk, { x: 0.5, y: i === 0 ? 1.5 : 0.5, w: 9, h: 5, fontSize: 14, color: "333333", valign: "top" })
          }
          if (contentLines.length === 0) {
            const slide = pptx.addSlide()
            slide.addText(baseName, { x: 0.5, y: 2, w: 9, h: 1, fontSize: 32, bold: true, align: "center", color: "1a1a2e" })
          }
          const pptxBuf = await pptx.write({ outputType: "arraybuffer" }) as ArrayBuffer
          blob = new Blob([pptxBuf], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" })
          outputName = baseName + ".pptx"
        } else if (toFormat === "HTML") {
          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#333;}h1{color:#1a1a2e;border-bottom:2px solid #eee;padding-bottom:10px;}</style></head><body><h1>${baseName}</h1>${textContent.split("\n").map(l => `<p>${l.replace(/</g, "&lt;")}</p>`).join("")}</body></html>`
          blob = new Blob([html], { type: "text/html" })
          outputName = baseName + ".html"
        } else if (toFormat === "TXT") {
          blob = new Blob([textContent], { type: "text/plain" })
          outputName = baseName + ".txt"
        } else {
          blob = new Blob([textContent], { type: "text/plain" })
          outputName = baseName + "." + toFormat.toLowerCase()
        }
      }

      clearInterval(interval)
      setProgress(100)

      const url = URL.createObjectURL(blob)
      setResultUrl(url)
      setResultName(outputName)
      setStatus("done")

      // Track file processing
      try {
        await fetch("/api/user/track-edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            fileType: `${fromFormat}-to-${toFormat}`,
            toolUsed: `convert-${fromFormat.toLowerCase()}-${toFormat.toLowerCase()}`,
          }),
        })
      } catch {}

      // Auto-save to cloud
      saveToCloud(blob, outputName, `convert-${fromFormat.toLowerCase()}-${toFormat.toLowerCase()}`)

    } catch (err) {
      clearInterval(interval)
      console.error(err)
      setStatus("error")
    }
  }, [file, fromFormat, toFormat])

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = resultName
    a.click()
  }

  const reset = () => {
    setFile(null)
    setStatus("idle")
    setProgress(0)
    setResultUrl("")
    setResultName("")
  }

  return (

    <ToolLayout title={title} subtitle={subtitle}>

      <div className="max-w-2xl mx-auto">

        {status === "idle" && (

          <div className="space-y-6">

            <FileUploader
              accept={acceptTypes}
              label={`Upload your ${fromFormat} file`}
              sublabel={`Select a ${fromFormat} file to convert to ${toFormat}`}
              onFile={(f) => { setFile(f); setStatus("uploading") }}
              cloudFilterTypes={acceptTypes.split(",").map(t => t.trim().replace(".", "").toLowerCase())}
            />

            {/* FORMAT INFO */}
            <div className="flex items-center justify-center gap-4">
              <div className={`px-5 py-3 rounded-xl bg-gradient-to-r ${fromColor} text-white font-bold text-lg shadow-lg`}>
                {fromFormat}
              </div>
              <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              <div className={`px-5 py-3 rounded-xl bg-gradient-to-r ${toColor} text-white font-bold text-lg shadow-lg`}>
                {toFormat}
              </div>
            </div>

          </div>

        )}

        {status === "uploading" && file && (

          <div className="space-y-6">

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${fromColor} flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
                  {fromFormat}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{file.name}</p>
                  <p className="text-xs text-white/40">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={reset} className="text-white/30 hover:text-white/60 transition">&times;</button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/50">Convert to:</span>
                  <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${toColor} text-white font-bold text-xs`}>
                    {toFormat}
                  </div>
                </div>
                <button
                  onClick={handleConvert}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                >
                  Convert Now
                </button>
              </div>
            </div>

          </div>

        )}

        {status === "processing" && (

          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">Converting {fromFormat} to {toFormat}...</p>
              <p className="text-sm text-white/40 mt-1">Please wait while we process your file</p>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-white/40">{progress}%</p>
          </div>

        )}

        {status === "done" && (

          <div className="p-8 rounded-2xl bg-white/5 border border-emerald-400/30 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-emerald-300">Conversion Complete!</p>
              <p className="text-sm text-white/40 mt-1">{resultName}</p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleDownload}
                className="px-8 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
              >
                Download {toFormat}
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 rounded-xl text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                Convert Another
              </button>
            </div>
          </div>

        )}

        {status === "error" && (

          <div className="p-8 rounded-2xl bg-white/5 border border-red-400/30 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-300">Conversion Failed</p>
              <p className="text-sm text-white/40 mt-1">An error occurred. Please try again.</p>
            </div>
            <button onClick={reset} className="px-6 py-3 rounded-xl text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition">
              Try Again
            </button>
          </div>

        )}

      </div>

    </ToolLayout>

  )

}
