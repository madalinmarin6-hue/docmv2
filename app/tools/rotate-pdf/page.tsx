"use client"

import { useState, useCallback, useRef } from "react"
import { PDFDocument, degrees } from "pdf-lib"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type PageInfo = { index: number; imageUrl: string; rotation: number }

export default function RotatePdfPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PageInfo[]>([])
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [zoomPage, setZoomPage] = useState<number | null>(null)
  const [zoomImageUrl, setZoomImageUrl] = useState("")
  const [zoomLoading, setZoomLoading] = useState(false)
  const fileRef = useRef<File | null>(null)

  const handleFile = useCallback(async (f: File) => {
    setFile(f)
    fileRef.current = f
    setLoading(true)
    setStatus("Loading PDF...")
    try {
      const buffer = await f.arrayBuffer()
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
      const items: PageInfo[] = []
      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1)
        const vp = page.getViewport({ scale: 0.4 })
        const canvas = document.createElement("canvas")
        canvas.width = vp.width; canvas.height = vp.height
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise
        items.push({ index: i, imageUrl: canvas.toDataURL(), rotation: 0 })
      }
      setPages(items)
      setStatus(`${pdf.numPages} pages loaded. Click pages to rotate.`)
    } catch { setStatus("Error loading PDF") }
    setLoading(false)
  }, [])

  const rotatePage = (idx: number, deg: number) => {
    setPages(prev => prev.map((p, i) => i === idx ? { ...p, rotation: (p.rotation + deg + 360) % 360 } : p))
  }

  const rotateAll = (deg: number) => {
    setPages(prev => prev.map(p => ({ ...p, rotation: (p.rotation + deg + 360) % 360 })))
  }

  const save = useCallback(async () => {
    if (!file) return
    setStatus("Applying rotations...")
    try {
      const buffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer)
      for (const p of pages) {
        if (p.rotation !== 0) {
          const page = pdfDoc.getPage(p.index)
          const cur = page.getRotation().angle
          page.setRotation(degrees(cur + p.rotation))
        }
      }
      const bytes = await pdfDoc.save()
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = file.name.replace(".pdf", "_rotated.pdf"); a.click()
      URL.revokeObjectURL(url)
      setStatus("Downloaded!")
      const outName = file.name.replace(".pdf", "_rotated.pdf")
      const editResult = await trackEdit({ fileName: outName, fileSize: blob.size, fileType: "pdf", toolUsed: "rotate-pdf" })
      if (!editResult.allowed) { setStatus(editResult.error || "Edit limit reached"); return }
      saveToCloud(blob, outName, "rotate-pdf")
    } catch { setStatus("Error saving") }
  }, [file, pages])

  const openZoom = useCallback(async (idx: number) => {
    setZoomPage(idx)
    setZoomLoading(true)
    setZoomImageUrl("")
    try {
      const f = fileRef.current
      if (!f) return
      const buffer = await f.arrayBuffer()
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
      const page = await pdf.getPage(idx + 1)
      const vp = page.getViewport({ scale: 2.0 })
      const canvas = document.createElement("canvas")
      canvas.width = vp.width; canvas.height = vp.height
      await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise
      setZoomImageUrl(canvas.toDataURL())
    } catch { setZoomImageUrl("") }
    setZoomLoading(false)
  }, [])

  const closeZoom = () => { setZoomPage(null); setZoomImageUrl("") }

  const hasChanges = pages.some(p => p.rotation !== 0)

  return (
    <ToolLayout title="Rotate PDF" subtitle="Rotate individual or all pages in your PDF">
      <div className="space-y-5">
        {!file ? (
          <FileUploader accept=".pdf" onFile={handleFile} label="Upload a PDF to rotate pages" sublabel="Click individual pages or rotate all at once" cloudFilterTypes={["pdf"]} />
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-white/40 text-sm">{status}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => rotateAll(90)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Rotate All +90</button>
              <button onClick={() => rotateAll(180)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Rotate All 180</button>
              <button onClick={() => rotateAll(-90)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Rotate All -90</button>
              <button onClick={() => setPages(prev => prev.map(p => ({ ...p, rotation: 0 })))} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 text-sm hover:bg-white/10 transition">Reset</button>
              <div className="flex-1" />
              <button onClick={save} disabled={!hasChanges}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-40">
                Download Rotated PDF
              </button>
            </div>
            {status && <p className="text-xs text-emerald-400">{status}</p>}
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {pages.map((p, i) => (
                <div key={i} className={`rounded-xl border-2 overflow-hidden flex flex-col transition-all ${p.rotation !== 0 ? "border-purple-400 ring-2 ring-purple-400/30" : "border-white/10"}`}>
                  <div className="relative bg-white/5 flex items-center justify-center aspect-[3/4] overflow-hidden group">
                    <img src={p.imageUrl} alt={`Page ${i + 1}`} className="max-w-full max-h-full object-contain transition-transform duration-300" style={{ transform: `rotate(${p.rotation}deg)` }} />
                    {p.rotation !== 0 && <span className="absolute top-1 left-1 text-[9px] bg-purple-500/80 text-white px-1.5 rounded-md">{p.rotation}&deg;</span>}
                    <div onClick={(e) => { e.stopPropagation(); openZoom(i) }}
                      className="absolute top-1 right-1 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-black/80 hover:scale-110 z-10"
                      title="Preview page">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-1 py-1 bg-white/5">
                    <button onClick={() => rotatePage(i, -90)} className="w-6 h-6 rounded bg-white/5 text-white/40 hover:bg-white/10 text-[10px] flex items-center justify-center transition">&#8634;</button>
                    <span className="text-[10px] text-white/40">{i + 1}</span>
                    <button onClick={() => rotatePage(i, 90)} className="w-6 h-6 rounded bg-white/5 text-white/40 hover:bg-white/10 text-[10px] flex items-center justify-center transition">&#8635;</button>
                  </div>
                </div>
              ))}
            </div>
            {/* ZOOM MODAL */}
            {zoomPage !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={closeZoom}>
                <div className="relative bg-[#12183a] rounded-2xl border border-white/10 shadow-2xl max-w-[90vw] max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-white/5">
                    <span className="text-sm font-semibold text-white">Page {zoomPage + 1} of {pages.length}</span>
                    {pages[zoomPage]?.rotation !== 0 && <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">{pages[zoomPage].rotation}&deg;</span>}
                    <div className="flex-1" />
                    <button onClick={() => { if (zoomPage > 0) openZoom(zoomPage - 1) }} disabled={zoomPage <= 0}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 transition disabled:opacity-30">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </button>
                    <button onClick={() => { if (zoomPage < pages.length - 1) openZoom(zoomPage + 1) }} disabled={zoomPage >= pages.length - 1}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 transition disabled:opacity-30">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    </button>
                    <button onClick={closeZoom} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[60vh]">
                    {zoomLoading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                        <p className="text-white/40 text-sm">Rendering high-res preview...</p>
                      </div>
                    ) : zoomImageUrl ? (
                      <img src={zoomImageUrl} alt={`Page ${zoomPage + 1}`} className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-xl" style={{ transform: `rotate(${pages[zoomPage]?.rotation || 0}deg)` }} />
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ToolLayout>
  )
}
