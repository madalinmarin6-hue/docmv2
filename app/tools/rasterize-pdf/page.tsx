"use client"
import { useState } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

export default function RasterizePdfPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")
  const [dpi, setDpi] = useState<150 | 200 | 300>(200)

  const process = async () => {
    if (!file) return
    setLoading(true); setStatus("Rasterizing PDF...")
    try {
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      const { PDFDocument } = await import("pdf-lib")
      const scale = dpi / 72
      const srcPdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
      const newPdf = await PDFDocument.create()
      for (let i = 1; i <= srcPdf.numPages; i++) {
        setStatus(`Rasterizing page ${i}/${srcPdf.numPages} at ${dpi} DPI...`)
        const page = await srcPdf.getPage(i)
        const vp = page.getViewport({ scale })
        const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height
        await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise
        const jpgData = await fetch(c.toDataURL("image/jpeg", 0.92)).then(r => r.arrayBuffer())
        const img = await newPdf.embedJpg(new Uint8Array(jpgData))
        const pw = vp.width / scale, ph = vp.height / scale
        const p = newPdf.addPage([pw, ph])
        p.drawImage(img, { x: 0, y: 0, width: pw, height: ph })
      }
      const bytes = await newPdf.save()
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob); setPreviewUrl(url)
      const outName = file.name.replace(/\.pdf$/i, "") + `_${dpi}dpi.pdf`
      const a = document.createElement("a"); a.href = url; a.download = outName; a.click()
      trackEdit({ fileName: outName, fileSize: blob.size, fileType: "application/pdf", toolUsed: "rasterize-pdf" })
      saveToCloud(blob, outName, "rasterize-pdf")
      setStatus("Done!")
    } catch (e: any) { setStatus("Error: " + e.message) }
    setLoading(false)
  }

  return (
    <ToolLayout title="Rasterize PDF" subtitle="Convert vector PDF to raster images at a specific DPI">
      <div className="space-y-5">
        {!file ? (
          <FileUploader accept=".pdf" onFile={f => setFile(f)} label="Upload a PDF to rasterize" sublabel="Convert to raster images — makes text non-selectable" cloudFilterTypes={["pdf"]} />
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 flex items-center justify-between">
              <span className="truncate">{file.name}</span>
              <button onClick={() => { setFile(null); setPreviewUrl(""); setStatus("") }} className="text-xs text-white/30 hover:text-white ml-3">✕</button>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="flex items-center gap-3">
                <label className="text-xs text-white/40">DPI:</label>
                <select value={dpi} onChange={e => setDpi(+e.target.value as 150 | 200 | 300)} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none">
                  <option value={150} className="bg-[#0b1333]">150 DPI (smaller)</option>
                  <option value={200} className="bg-[#0b1333]">200 DPI (balanced)</option>
                  <option value={300} className="bg-[#0b1333]">300 DPI (higher quality)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <button onClick={process} disabled={loading} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-rose-500 to-red-500 text-white disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-lg">{loading ? "Rasterizing..." : "Rasterize"}</button>
            </div>
            {status && <p className={`text-xs text-center ${status.startsWith("Error") ? "text-red-400" : status === "Done!" ? "text-emerald-400" : "text-white/50"}`}>{status}</p>}
            {previewUrl && <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5"><iframe src={previewUrl} className="w-full h-[65vh]" /></div>}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
