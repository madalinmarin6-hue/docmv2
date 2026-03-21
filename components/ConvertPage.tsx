"use client"

import { useState, useCallback, useEffect } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import * as XLSX from "xlsx"
import PptxGenJS from "pptxgenjs"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type Props = {
  title: string
  subtitle: string
  fromFormat: string
  toFormat: string
  acceptTypes: string
  fromColor: string
  toColor: string
}

function DocxPreview({ url }: { url: string }) {
  const [html, setHtml] = useState("")
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(url)
        const buf = await resp.arrayBuffer()
        const mammoth = (await import("mammoth")).default
        const result = await mammoth.convertToHtml({ arrayBuffer: buf })
        setHtml(result.value)
      } catch { setHtml("<p style='color:#999;text-align:center;padding:2rem'>Could not preview this document.</p>") }
      setLoading(false)
    })()
  }, [url])
  if (loading) return <div className="p-8 text-center text-white/40"><div className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" /><p className="text-sm">Loading preview...</p></div>
  return <div className="p-6 bg-white rounded-xl max-h-[60vh] overflow-auto" dangerouslySetInnerHTML={{ __html: html }} />
}

export default function ConvertPage({ title, subtitle, fromFormat, toFormat, acceptTypes, fromColor, toColor }: Props) {
  usePing()

  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState("")
  const [resultName, setResultName] = useState("")
  const [showPreview, setShowPreview] = useState(false)

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

    // Check edit limit BEFORE converting
    try {
      const checkRes = await fetch("/api/user/track-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size, fileType: `${fromFormat}-to-${toFormat}`, toolUsed: `convert-${fromFormat.toLowerCase()}-${toFormat.toLowerCase()}` }),
      })
      if (checkRes.status === 429) {
        alert("Daily edit limit reached (0/10).\n\n\u2B50 Get Premium \u2014 Unlimited edits & no ads\n\uD83C\uDFA5 Watch 2 Ads \u2014 +1 free edit\n\nGo to your Dashboard to upgrade or watch ads.")
        return
      }
    } catch { /* allow on network error */ }

    setStatus("processing")
    const interval = simulateProgress()

    try {
      const buffer = await file.arrayBuffer()
      let blob: Blob
      let outputName: string

      const baseName = file.name.replace(/\.[^.]+$/, "")

      if (fromFormat === "PDF" && toFormat === "Word") {
        // ── PDF → Word: PyMuPDF WASM engine (high fidelity) with fallback ──
        try {
          setProgress(10)
          const { loadPyMuPDF } = await import("@/lib/pymupdf-loader")
          const pymupdf = await loadPyMuPDF()
          setProgress(40)
          const docxBlob = await pymupdf.pdfToDocx(file)
          setProgress(90)
          blob = docxBlob
          outputName = baseName + ".docx"
        } catch (pyErr) {
          console.warn("[PyMuPDF] fallback to pdfToWord:", pyErr)
          const { convertPdfToWord } = await import("@/lib/converters/pdfToWord")
          const result = await convertPdfToWord(buffer, file.name, (pct) => setProgress(Math.min(95, pct)))
          blob = result.blob
          outputName = result.name
        }

      } else if (toFormat === "PDF" && (fromFormat === "Word" || file.name.toLowerCase().endsWith(".docx") || file.name.toLowerCase().endsWith(".doc") || file.name.toLowerCase().endsWith(".odt") || file.name.toLowerCase().endsWith(".rtf"))) {
        // ── Word/Doc/ODT/RTF → PDF: LibreOffice WASM engine with fallback ──
        try {
          setProgress(5)
          const { convertToPdf, initializeConverter } = await import("@/lib/libreoffice-converter")
          await initializeConverter((p) => setProgress(Math.min(70, Math.round(p.percent * 0.7))))
          setProgress(70)
          blob = await convertToPdf(file)
          setProgress(95)
          outputName = baseName + ".pdf"
        } catch (loErr) {
          console.warn("[LibreOffice] fallback to wordToPdf:", loErr)
          const { convertWordToPdf } = await import("@/lib/converters/wordToPdf")
          const result = await convertWordToPdf(buffer, file.name, (pct) => setProgress(Math.min(95, pct)))
          blob = result.blob
          outputName = result.name
        }

      } else if (toFormat === "PDF" && (fromFormat === "Excel" || file.name.toLowerCase().match(/\.(xlsx?|csv|ods)$/))) {
        // ── Excel/CSV/ODS → PDF: LibreOffice WASM engine with fallback ──
        try {
          setProgress(5)
          const { convertToPdf, initializeConverter } = await import("@/lib/libreoffice-converter")
          await initializeConverter((p) => setProgress(Math.min(70, Math.round(p.percent * 0.7))))
          setProgress(70)
          blob = await convertToPdf(file)
          setProgress(95)
          outputName = baseName + ".pdf"
        } catch {
          // Fallback: basic text rendering
          const pdfDoc = await PDFDocument.create()
          let font = await pdfDoc.embedFont(StandardFonts.Helvetica)
          const text = await file.text()
          const lines = text.split("\n")
          const linesPerPage = 45
          for (let i = 0; i < lines.length; i += linesPerPage) {
            const page = pdfDoc.addPage([595, 842])
            let y = 800
            for (const line of lines.slice(i, i + linesPerPage)) {
              const safeLine = line.replace(/[^\x20-\x7E\u00C0-\u024F]/g, " ").substring(0, 100)
              try { page.drawText(safeLine, { x: 50, y, size: 10, font, color: rgb(0, 0, 0) }) } catch {}
              y -= 14
            }
          }
          const pdfBytes = await pdfDoc.save()
          blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
          outputName = baseName + ".pdf"
        }

      } else if (toFormat === "PDF" && (fromFormat === "PPTX" || file.name.toLowerCase().match(/\.(pptx?|odp)$/))) {
        // ── PowerPoint → PDF: LibreOffice WASM ──
        try {
          setProgress(5)
          const { convertToPdf, initializeConverter } = await import("@/lib/libreoffice-converter")
          await initializeConverter((p) => setProgress(Math.min(70, Math.round(p.percent * 0.7))))
          setProgress(70)
          blob = await convertToPdf(file)
          setProgress(95)
          outputName = baseName + ".pdf"
        } catch {
          throw new Error("PowerPoint to PDF conversion failed")
        }

      } else if (toFormat === "PDF") {
        // ── Other formats → PDF (images, text, HTML, etc.) ──
        const pdfDoc = await PDFDocument.create()

        let font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        let boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        let useUnicode = false
        try {
          const fontBytes = await fetch("https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/unhinted/ttf/NotoSans-Regular.ttf").then(r => r.arrayBuffer())
          font = await pdfDoc.embedFont(fontBytes)
          const boldBytes = await fetch("https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/unhinted/ttf/NotoSans-Bold.ttf").then(r => r.arrayBuffer())
          boldFont = await pdfDoc.embedFont(boldBytes)
          useUnicode = true
        } catch { /* fall back to standard fonts */ }

        if (fromFormat === "JPG" || fromFormat === "PNG" || fromFormat === "Image" || file.type?.startsWith("image/")) {
          // Handle all image types → PDF
          const imgBytes = new Uint8Array(buffer)
          const fname = file.name.toLowerCase()
          let image
          if (fname.endsWith(".jpg") || fname.endsWith(".jpeg") || fromFormat === "JPG") {
            image = await pdfDoc.embedJpg(imgBytes)
          } else if (fname.endsWith(".png") || fromFormat === "PNG") {
            image = await pdfDoc.embedPng(imgBytes)
          } else {
            // For other formats (webp, bmp, gif, svg, tiff), render to canvas first then embed as JPEG
            const imgEl = new (globalThis as any).Image() as HTMLImageElement
            const imgUrl = URL.createObjectURL(file)
            await new Promise<void>((resolve) => { imgEl.onload = () => resolve(); imgEl.onerror = () => resolve(); imgEl.src = imgUrl })
            const canvas = document.createElement("canvas")
            canvas.width = imgEl.naturalWidth || 800; canvas.height = imgEl.naturalHeight || 600
            const ctx = canvas.getContext("2d")!
            ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(imgEl, 0, 0)
            URL.revokeObjectURL(imgUrl)
            const jpegBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/jpeg", 0.92))
            if (jpegBlob) {
              const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer())
              image = await pdfDoc.embedJpg(jpegBytes)
            }
          }
          if (image) {
            const { width, height } = image.scaleToFit(595, 842)
            const page = pdfDoc.addPage([595, 842])
            page.drawImage(image, {
              x: (595 - width) / 2,
              y: (842 - height) / 2,
              width,
              height,
            })
          }
        } else if (fromFormat === "Markdown" || file.name.toLowerCase().match(/\.(md|markdown)$/)) {
          // Markdown → PDF using marked → html2canvas → jsPDF
          const mdText = await file.text()
          const { marked } = await import("marked")
          const htmlContent = await marked(mdText)
          const { jsPDF } = await import("jspdf")
          const html2canvas = (await import("html2canvas")).default
          const container = document.createElement("div")
          container.style.cssText = "position:absolute;left:-9999px;width:794px;padding:40px;background:#fff;color:#000;font-family:system-ui,sans-serif;line-height:1.6"
          container.innerHTML = `<style>h1,h2,h3{color:#1a1a2e;margin-top:1em}code{background:#f0f0f0;padding:2px 6px;border-radius:4px;font-size:0.9em}pre{background:#1a1a2e;color:#e0e0e0;padding:16px;border-radius:8px;overflow-x:auto}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:8px}blockquote{border-left:4px solid #ccc;margin-left:0;padding-left:16px;color:#555}</style>${htmlContent}`
          document.body.appendChild(container)
          await new Promise(r => setTimeout(r, 500))
          const canvas = await html2canvas(container, { scale: 2, useCORS: true })
          document.body.removeChild(container)
          const imgW = 210, imgH = (canvas.height * imgW) / canvas.width
          const pdf = new jsPDF({ unit: "mm", format: "a4" })
          let y = 0
          while (y < imgH) {
            if (y > 0) pdf.addPage()
            pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, -y, imgW, imgH)
            y += 297
          }
          const pdfBlob = pdf.output("blob")
          clearInterval(interval)
          setProgress(100)
          const url = URL.createObjectURL(pdfBlob)
          setResultUrl(url)
          setResultName(baseName + ".pdf")
          setStatus("done")
          saveToCloud(pdfBlob, baseName + ".pdf", `convert-${fromFormat.toLowerCase()}-${toFormat.toLowerCase()}`)
          return
        } else if (fromFormat === "HTML" || file.name.toLowerCase().endsWith(".html") || file.name.toLowerCase().endsWith(".htm")) {
          // HTML → PDF using jsPDF + html2canvas
          const htmlContent = await file.text()
          const { jsPDF } = await import("jspdf")
          const html2canvas = (await import("html2canvas")).default
          const container = document.createElement("div")
          container.style.cssText = "position:absolute;left:-9999px;width:794px;padding:40px;background:#fff;color:#000"
          container.innerHTML = htmlContent
          document.body.appendChild(container)
          await new Promise(r => setTimeout(r, 500))
          const canvas = await html2canvas(container, { scale: 2, useCORS: true })
          document.body.removeChild(container)
          const imgW = 210, imgH = (canvas.height * imgW) / canvas.width
          const pdf = new jsPDF({ unit: "mm", format: "a4" })
          let y = 0
          while (y < imgH) {
            if (y > 0) pdf.addPage()
            pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, -y, imgW, imgH)
            y += 297
          }
          const pdfBlob = pdf.output("blob")
          clearInterval(interval)
          setProgress(100)
          const url = URL.createObjectURL(pdfBlob)
          setResultUrl(url)
          setResultName(baseName + ".pdf")
          setStatus("done")
          saveToCloud(pdfBlob, baseName + ".pdf", `convert-${fromFormat.toLowerCase()}-${toFormat.toLowerCase()}`)
          return
        } else {
          let text: string
          try { text = await file.text() } catch { text = "" }
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
              const safeLine = useUnicode
                ? line.substring(0, 90)
                : line.replace(/[^\x20-\x7E\u00C0-\u024F]/g, " ").substring(0, 90)
              try {
                page.drawText(safeLine, { x: 50, y, size: 11, font, color: rgb(0, 0, 0) })
              } catch {
                page.drawText(safeLine.replace(/[^\x20-\x7E]/g, " "), { x: 50, y, size: 11, font, color: rgb(0, 0, 0) })
              }
              y -= 16
            }
          }
        }

        const pdfBytes = await pdfDoc.save()
        blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
        outputName = baseName + ".pdf"

      } else if (fromFormat === "PDF" && (toFormat === "JPG" || toFormat === "PNG")) {
        // ── PDF → JPG/PNG: render ALL pages ──
        const pdfjsLib = await import("pdfjs-dist")
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
        const pdfData = new Uint8Array(buffer)
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise
        const scale = 2
        const mimeType = toFormat === "JPG" ? "image/jpeg" : "image/png"
        const ext = toFormat === "JPG" ? ".jpg" : ".png"

        if (pdf.numPages === 1) {
          const page = await pdf.getPage(1)
          const viewport = page.getViewport({ scale })
          const canvas = document.createElement("canvas")
          canvas.width = viewport.width; canvas.height = viewport.height
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise
          const dataUrl = canvas.toDataURL(mimeType, 0.92)
          const res = await fetch(dataUrl)
          blob = await res.blob()
          outputName = baseName + ext
        } else {
          // Multiple pages: download each page individually
          for (let i = 1; i <= pdf.numPages; i++) {
            setProgress(Math.round((i / pdf.numPages) * 90))
            const page = await pdf.getPage(i)
            const viewport = page.getViewport({ scale })
            const canvas = document.createElement("canvas")
            canvas.width = viewport.width; canvas.height = viewport.height
            await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise
            const dataUrl = canvas.toDataURL(mimeType, 0.92)
            const a = document.createElement("a")
            a.href = dataUrl
            a.download = `${baseName}_page${i}${ext}`
            a.click()
            await new Promise(r => setTimeout(r, 200))
          }
          // Set result to last page for preview
          const lastPage = await pdf.getPage(pdf.numPages)
          const vp = lastPage.getViewport({ scale })
          const c = document.createElement("canvas")
          c.width = vp.width; c.height = vp.height
          await lastPage.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise
          const res = await fetch(c.toDataURL(mimeType, 0.92))
          blob = await res.blob()
          outputName = `${baseName}_${pdf.numPages}pages${ext}`
        }

      } else if (fromFormat === "PDF") {
        // ── PDF → other formats: use pdfjs-dist for text extraction ──
        const pdfjsLib = await import("pdfjs-dist")
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
        const pdfData = new Uint8Array(buffer)
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise
        const allLines: string[] = []
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p)
          const tc = await page.getTextContent()
          let prevY: number | null = null
          let lineText = ""
          for (const item of tc.items) {
            if (!("str" in item)) continue
            const it = item as { str: string; transform: number[] }
            const y = Math.round(it.transform[5])
            if (prevY !== null && Math.abs(y - prevY) > 3) {
              allLines.push(lineText)
              lineText = ""
            }
            lineText += (lineText && prevY !== null && Math.abs(y - (prevY ?? 0)) <= 3 ? " " : "") + it.str
            prevY = y
          }
          if (lineText) allLines.push(lineText)
          if (p < pdf.numPages) allLines.push("")
        }
        const textContent = allLines.join("\n")

        if (toFormat === "Excel") {
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

      } else if ((fromFormat === "Word" || file.name.toLowerCase().endsWith(".docx") || file.name.toLowerCase().endsWith(".doc")) && toFormat === "HTML") {
        // ── Word → HTML: rich HTML with mammoth ──
        const mammoth = (await import("mammoth")).default
        const result = await mammoth.convertToHtml(
          { arrayBuffer: buffer },
          { convertImage: mammoth.images.imgElement((image: any) => image.read("base64").then((buf: string) => ({ src: `data:${image.contentType};base64,${buf}` }))) }
        )
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:Calibri,system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#333;}h1,h2,h3{color:#1a1a2e;}table{border-collapse:collapse;width:100%;margin:1em 0;}td,th{border:1px solid #ccc;padding:8px;}img{max-width:100%;}</style></head><body>${result.value}</body></html>`
        blob = new Blob([html], { type: "text/html" })
        outputName = baseName + ".html"

      } else if ((fromFormat === "Word" || file.name.toLowerCase().endsWith(".docx") || file.name.toLowerCase().endsWith(".doc")) && (toFormat === "JPG" || toFormat === "PNG")) {
        // ── Word → JPG/PNG: mammoth → HTML → canvas → image ──
        const mammoth = (await import("mammoth")).default
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
        const iframe = document.createElement("iframe")
        iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;"
        document.body.appendChild(iframe)
        const doc = iframe.contentDocument!
        doc.open()
        doc.write(`<!DOCTYPE html><html><head><style>body{font-family:Calibri,sans-serif;margin:40px;line-height:1.6;color:#000;background:#fff;}h1,h2,h3{color:#1a1a2e;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:6px;}img{max-width:100%;}</style></head><body>${result.value}</body></html>`)
        doc.close()
        await new Promise(r => setTimeout(r, 500))
        const { default: html2canvas } = await import("html2canvas").catch(() => ({ default: null }))
        if (html2canvas) {
          const canvas = await html2canvas(doc.body, { scale: 2, backgroundColor: "#ffffff", width: 794, windowWidth: 794 })
          const mimeType = toFormat === "JPG" ? "image/jpeg" : "image/png"
          const dataUrl = canvas.toDataURL(mimeType, 0.95)
          const res = await fetch(dataUrl)
          blob = await res.blob()
        } else {
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Calibri,sans-serif;padding:40px;background:#fff;">${result.value.replace(/&/g, "&amp;")}</div></foreignObject></svg>`
          blob = new Blob([svg], { type: "image/svg+xml" })
        }
        document.body.removeChild(iframe)
        outputName = baseName + (toFormat === "JPG" ? ".jpg" : ".png")

      } else if ((fromFormat === "JPG" || fromFormat === "PNG") && toFormat === "Word") {
        // ── JPG/PNG → Word: embed image into .docx ──
        const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, Header, Footer, PageNumber, convertInchesToTwip } = await import("docx")
        const imgData = new Uint8Array(buffer)
        const img = new Image()
        const imgUrl = URL.createObjectURL(file)
        await new Promise<void>((resolve) => { img.onload = () => resolve(); img.onerror = () => resolve(); img.src = imgUrl })
        const maxW = 570; const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1
        const w = Math.round(img.naturalWidth * scale); const h = Math.round(img.naturalHeight * scale)
        URL.revokeObjectURL(imgUrl)
        const doc = new Document({
          creator: "DocFlow Converter", title: baseName,
          sections: [{
            properties: { page: { size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) }, margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1), right: convertInchesToTwip(1) } } },
            headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: baseName, size: 16, color: "888888", italics: true })], alignment: AlignmentType.RIGHT })] }) },
            footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: "Page ", size: 16, color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" })], alignment: AlignmentType.CENTER })] }) },
            children: [
              new Paragraph({ children: [new TextRun({ text: baseName, bold: true, size: 40, color: "1a1a2e" })], heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
              new Paragraph({ children: [new ImageRun({ data: imgData, transformation: { width: w, height: h }, type: fromFormat === "JPG" ? "jpg" : "png" })], spacing: { before: 200 } }),
            ],
          }],
        })
        blob = await Packer.toBlob(doc)
        outputName = baseName + ".docx"

      } else if (fromFormat === "Excel" && toFormat === "CSV") {
        // ── Excel → CSV ──
        const wb = XLSX.read(buffer, { type: "array" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const csv = XLSX.utils.sheet_to_csv(ws)
        blob = new Blob([csv], { type: "text/csv" })
        outputName = baseName + ".csv"

      } else if (fromFormat === "CSV" && toFormat === "Excel") {
        // ── CSV → Excel ──
        const csvText = await file.text()
        const wb = XLSX.read(csvText, { type: "string" })
        const xlsxBuf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
        blob = new Blob([xlsxBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
        outputName = baseName + ".xlsx"

      } else if (fromFormat === "Excel" && toFormat === "HTML") {
        // ── Excel → HTML (rich table) ──
        const wb = XLSX.read(buffer, { type: "array" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const tableHtml = XLSX.utils.sheet_to_html(ws)
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:system-ui,sans-serif;margin:40px;color:#333;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:8px 12px;text-align:left;}th{background:#f0f0f0;font-weight:600;}tr:nth-child(even){background:#fafafa;}h1{color:#1a1a2e;}</style></head><body><h1>${baseName}</h1>${tableHtml}</body></html>`
        blob = new Blob([html], { type: "text/html" })
        outputName = baseName + ".html"

      } else if (fromFormat === "HTML" && toFormat === "Excel") {
        // ── HTML → Excel (parse tables) ──
        const htmlText = await file.text()
        const wb = XLSX.read(htmlText, { type: "string" })
        const xlsxBuf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
        blob = new Blob([xlsxBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
        outputName = baseName + ".xlsx"

      } else {
        // ── Generic non-PDF source → non-PDF target ──
        let textContent: string
        const ext = file.name.toLowerCase()
        if (ext.endsWith(".docx") || ext.endsWith(".doc")) {
          try {
            const mammoth = (await import("mammoth")).default
            const result = await mammoth.extractRawText({ arrayBuffer: buffer })
            textContent = result.value || ""
          } catch { textContent = await file.text() }
        } else if (ext.endsWith(".xlsx") || ext.endsWith(".xls")) {
          try {
            const wb = XLSX.read(buffer, { type: "array" })
            const ws = wb.Sheets[wb.SheetNames[0]]
            textContent = XLSX.utils.sheet_to_csv(ws)
          } catch { textContent = await file.text() }
        } else {
          try { textContent = await file.text() } catch { textContent = `[Binary content from ${file.name}]` }
        }

        if (toFormat === "Word") {
          const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Header, Footer, PageNumber, convertInchesToTwip } = await import("docx")
          const lines = textContent.split("\n")
          const paragraphs = [
            new Paragraph({ children: [new TextRun({ text: baseName, bold: true, size: 40, color: "1a1a2e" })], heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
            new Paragraph({ children: [new TextRun({ text: `Converted from ${fromFormat}`, size: 18, color: "888888", italics: true })], spacing: { after: 300 } }),
            ...lines.map(l => new Paragraph({ children: [new TextRun({ text: l || " ", size: 22, font: "Calibri" })], spacing: { after: 40 } })),
          ]
          const doc = new Document({
            creator: "DocFlow Converter", title: baseName,
            sections: [{
              properties: { page: { size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) }, margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1), right: convertInchesToTwip(1) } } },
              headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: baseName, size: 16, color: "888888", italics: true })], alignment: AlignmentType.RIGHT })] }) },
              footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: "Page ", size: 16, color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" })], alignment: AlignmentType.CENTER })] }) },
              children: paragraphs,
            }],
          })
          blob = await Packer.toBlob(doc)
          outputName = baseName + ".docx"
        } else if (toFormat === "Excel") {
          const lines = textContent.split("\n").map(line => line.split(/[,\t]/).map(cell => cell.trim()))
          const ws = XLSX.utils.aoa_to_sheet(lines)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
          const xlsxBuf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
          blob = new Blob([xlsxBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
          outputName = baseName + ".xlsx"
        } else if (toFormat === "PPTX") {
          const pptx = new PptxGenJS()
          const contentLines = textContent.split("\n")
          const linesPerSlide = 12
          for (let i = 0; i < contentLines.length; i += linesPerSlide) {
            const slide = pptx.addSlide()
            if (i === 0) slide.addText(baseName, { x: 0.5, y: 0.3, w: 9, h: 1, fontSize: 28, bold: true, color: "1a1a2e" })
            const chunk = contentLines.slice(i, i + linesPerSlide).join("\n")
            slide.addText(chunk, { x: 0.5, y: i === 0 ? 1.5 : 0.5, w: 9, h: 5, fontSize: 14, color: "333333", valign: "top" })
          }
          const pptxBuf = await pptx.write({ outputType: "arraybuffer" }) as ArrayBuffer
          blob = new Blob([pptxBuf], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" })
          outputName = baseName + ".pptx"
        } else if (toFormat === "HTML") {
          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#333;}h1{color:#1a1a2e;border-bottom:2px solid #eee;padding-bottom:10px;}</style></head><body><h1>${baseName}</h1>${textContent.split("\n").map(l => `<p>${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`).join("")}</body></html>`
          blob = new Blob([html], { type: "text/html" })
          outputName = baseName + ".html"
        } else if (toFormat === "TXT") {
          blob = new Blob([textContent], { type: "text/plain" })
          outputName = baseName + ".txt"
        } else if (toFormat === "CSV") {
          blob = new Blob([textContent], { type: "text/csv" })
          outputName = baseName + ".csv"
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
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={() => setShowPreview(v => !v)}
                className={`px-6 py-3 rounded-xl text-sm font-semibold hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2 ${showPreview ? "bg-gradient-to-r from-indigo-600 to-blue-600 shadow-indigo-500/20" : "bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/20"}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {showPreview ? "Hide Preview" : "Preview"}
              </button>
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
            {showPreview && resultUrl && (
              <div className="mt-4 rounded-2xl border border-white/10 overflow-hidden bg-white/5">
                {(resultName.endsWith(".jpg") || resultName.endsWith(".jpeg") || resultName.endsWith(".png") || resultName.endsWith(".svg") || resultName.endsWith(".webp") || resultName.endsWith(".bmp")) ? (
                  <img src={resultUrl} alt={resultName} className="max-w-full max-h-[60vh] mx-auto object-contain p-4" />
                ) : resultName.endsWith(".pdf") ? (
                  <embed src={resultUrl + "#toolbar=1&navpanes=0"} type="application/pdf" className="w-full h-[60vh]" />
                ) : resultName.endsWith(".html") ? (
                  <iframe src={resultUrl} className="w-full h-[60vh]" title="Preview" />
                ) : resultName.endsWith(".txt") || resultName.endsWith(".csv") || resultName.endsWith(".md") ? (
                  <iframe src={resultUrl} className="w-full h-[50vh] bg-white" title="Preview" />
                ) : resultName.endsWith(".docx") ? (
                  <DocxPreview url={resultUrl} />
                ) : (
                  <div className="p-8 text-center text-white/40">
                    <p className="text-sm">Preview not available for this file type.</p>
                    <button onClick={() => { if (resultUrl) window.open(resultUrl, "_blank") }} className="mt-3 px-4 py-2 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/15 transition">Open in new tab</button>
                  </div>
                )}
              </div>
            )}
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
