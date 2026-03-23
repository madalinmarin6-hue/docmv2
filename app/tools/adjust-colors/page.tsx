"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type PageImg = { dataUrl: string; width: number; height: number }

export default function AdjustColorsPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(0)
  const [saturation, setSaturation] = useState(0)
  const [rawPages, setRawPages] = useState<PageImg[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const loadPages = useCallback(async (f: File) => {
    setLoading(true); setStatus("Loading PDF pages...")
    try {
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise
      const imgs: PageImg[] = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const vp = page.getViewport({ scale: 1.5 })
        const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height
        const ctx = c.getContext("2d")!
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height)
        await page.render({ canvasContext: ctx, viewport: vp }).promise
        imgs.push({ dataUrl: c.toDataURL(), width: vp.width, height: vp.height })
      }
      setRawPages(imgs); setCurrentPage(0)
      setStatus(`${imgs.length} page${imgs.length > 1 ? "s" : ""} loaded. Adjust sliders to see the live preview.`)
    } catch { setStatus("Error loading PDF") }
    setLoading(false)
  }, [])

  // Live preview: re-draw current page with CSS filters applied
  useEffect(() => {
    if (!rawPages.length || !canvasRef.current) return
    const page = rawPages[currentPage]
    if (!page) return
    const canvas = canvasRef.current
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`
      ctx.drawImage(img, 0, 0)
    }
    img.src = page.dataUrl
  }, [rawPages, currentPage, brightness, contrast, saturation])

  const generate = async () => {
    if (!file) return
    setGenerating(true); setStatus("Generating adjusted PDF...")
    try {
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      const { PDFDocument } = await import("pdf-lib")
      const srcPdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
      const newPdf = await PDFDocument.create()
      for (let i = 1; i <= srcPdf.numPages; i++) {
        setStatus(`Processing page ${i}/${srcPdf.numPages}...`)
        const page = await srcPdf.getPage(i)
        const vp = page.getViewport({ scale: 2 })
        const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height
        const ctx = c.getContext("2d")!
        ctx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`
        await page.render({ canvasContext: ctx, viewport: vp }).promise
        const jpgData = await fetch(c.toDataURL("image/jpeg", 0.95)).then(r => r.arrayBuffer())
        const img = await newPdf.embedJpg(new Uint8Array(jpgData))
        const p = newPdf.addPage([vp.width / 2, vp.height / 2])
        p.drawImage(img, { x: 0, y: 0, width: vp.width / 2, height: vp.height / 2 })
      }
      const bytes = await newPdf.save()
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      if (resultUrl) URL.revokeObjectURL(resultUrl)
      const url = URL.createObjectURL(blob)
      setResultBlob(blob); setResultUrl(url)
      const outName = file.name.replace(/\.pdf$/i, "") + "_adjusted.pdf"
      trackEdit({ fileName: outName, fileSize: blob.size, fileType: "application/pdf", toolUsed: "adjust-colors" })
      saveToCloud(blob, outName, "adjust-colors")
      setStatus("Done! Preview and download below.")
    } catch (e: any) { setStatus("Error: " + e.message) }
    setGenerating(false)
  }

  const download = () => {
    if (!resultUrl || !file) return
    const a = document.createElement("a"); a.href = resultUrl
    a.download = file.name.replace(/\.pdf$/i, "") + "_adjusted.pdf"; a.click()
  }

  const reset = () => {
    setFile(null); setRawPages([]); setResultBlob(null)
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    setResultUrl(""); setStatus(""); setCurrentPage(0)
    setBrightness(0); setContrast(0); setSaturation(0)
  }

  return (
    <ToolLayout title="Adjust Colors" subtitle="Adjust brightness, contrast, and saturation of PDF pages">
      <div className="space-y-5">
        {!file ? (
          <FileUploader accept=".pdf" onFile={f => { setFile(f); loadPages(f) }} label="Upload a PDF to adjust colors" sublabel="Adjust brightness, contrast, and saturation" cloudFilterTypes={["pdf"]} />
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 py-12"><div className="w-10 h-10 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" /><p className="text-white/40 text-sm">{status}</p></div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 flex items-center justify-between">
              <span className="truncate">{file.name} <span className="text-white/30">({rawPages.length} pages)</span></span>
              <button onClick={reset} className="text-xs text-white/30 hover:text-white ml-3">✕</button>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Color Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="text-[10px] text-white/40">Brightness: {brightness > 0 ? "+" : ""}{brightness}%</label><input type="range" min="-50" max="50" value={brightness} onChange={e => setBrightness(+e.target.value)} className="w-full accent-yellow-500" /></div>
                <div><label className="text-[10px] text-white/40">Contrast: {contrast > 0 ? "+" : ""}{contrast}%</label><input type="range" min="-50" max="50" value={contrast} onChange={e => setContrast(+e.target.value)} className="w-full accent-orange-500" /></div>
                <div><label className="text-[10px] text-white/40">Saturation: {saturation > 0 ? "+" : ""}{saturation}%</label><input type="range" min="-100" max="100" value={saturation} onChange={e => setSaturation(+e.target.value)} className="w-full accent-pink-500" /></div>
              </div>
            </div>

            {/* Live preview canvas */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-white">Live Preview</h3>
                <div className="flex-1" />
                {rawPages.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white/40 disabled:opacity-30">←</button>
                    <span className="text-[10px] text-white/40">{currentPage + 1}/{rawPages.length}</span>
                    <button onClick={() => setCurrentPage(Math.min(rawPages.length - 1, currentPage + 1))} disabled={currentPage >= rawPages.length - 1} className="px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white/40 disabled:opacity-30">→</button>
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <canvas ref={canvasRef} className="max-h-[50vh] w-auto rounded-lg border border-white/10" />
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center flex-wrap">
              <button onClick={reset} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/50">Upload New File</button>
              <button onClick={() => { setBrightness(0); setContrast(0); setSaturation(0) }} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/50">Reset Sliders</button>
              <button onClick={generate} disabled={generating} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-lg">
                {generating ? "Processing..." : "Apply & Generate PDF"}
              </button>
              {resultBlob && <button onClick={download} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">Download</button>}
            </div>
            {status && <p className={`text-xs text-center ${status.startsWith("Error") ? "text-red-400" : status.includes("Done") ? "text-emerald-400" : "text-white/50"}`}>{status}</p>}
            {resultUrl && <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5"><iframe src={resultUrl} className="w-full h-[65vh]" /></div>}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
