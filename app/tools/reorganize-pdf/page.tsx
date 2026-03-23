"use client"

import { useState, useCallback } from "react"
import { PDFDocument } from "pdf-lib"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type PageItem = { index: number; imageUrl: string }

export default function ReorganizePdfPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PageItem[]>([])
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")

  const handleFile = useCallback(async (f: File) => {
    setFile(f); setLoading(true); setStatus("Loading pages...")
    try {
      const buffer = await f.arrayBuffer()
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
      const items: PageItem[] = []
      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1)
        const vp = page.getViewport({ scale: 0.4 })
        const canvas = document.createElement("canvas")
        canvas.width = vp.width; canvas.height = vp.height
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise
        items.push({ index: i, imageUrl: canvas.toDataURL() })
      }
      setPages(items); setStatus(`${pdf.numPages} pages. Drag to reorder.`)
    } catch { setStatus("Error loading PDF") }
    setLoading(false)
  }, [])

  const move = (from: number, to: number) => {
    if (to < 0 || to >= pages.length) return
    setPages(prev => { const c = [...prev]; [c[from], c[to]] = [c[to], c[from]]; return c })
    setPreviewUrl("")
  }

  const handleDragStart = (i: number) => setDragIdx(i)
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== i) { move(dragIdx, i); setDragIdx(i) } }
  const handleDragEnd = () => setDragIdx(null)

  const reverse = () => { setPages(prev => [...prev].reverse()); setPreviewUrl("") }

  const save = useCallback(async () => {
    if (!file) return
    setStatus("Reordering...")
    try {
      const buffer = await file.arrayBuffer()
      const src = await PDFDocument.load(buffer)
      const dest = await PDFDocument.create()
      const indices = pages.map(p => p.index)
      const copied = await dest.copyPages(src, indices)
      copied.forEach(p => dest.addPage(p))
      const bytes = await dest.save()
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      const outName = file.name.replace(".pdf", "_reordered.pdf")
      trackEdit({ fileName: outName, fileSize: blob.size, fileType: "application/pdf", toolUsed: "reorganize-pdf" })
      saveToCloud(blob, outName, "reorganize-pdf")
      setStatus("Done! Preview below.")
    } catch { setStatus("Error saving") }
  }, [file, pages, previewUrl])

  const download = () => {
    if (!previewUrl) return
    const a = document.createElement("a"); a.href = previewUrl; a.download = file!.name.replace(".pdf", "_reordered.pdf"); a.click()
  }

  const isChanged = pages.some((p, i) => p.index !== i)

  return (
    <ToolLayout title="Reorganize Pages" subtitle="Drag-and-drop page reordering">
      <div className="space-y-5">
        {!file ? (
          <FileUploader accept=".pdf" onFile={handleFile} label="Upload a PDF to reorganize pages" sublabel="Drag pages to reorder them" cloudFilterTypes={["pdf"]} />
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 py-12"><div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /><p className="text-white/40 text-sm">{status}</p></div>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-white/50">{pages.length} pages</span>
              <button onClick={reverse} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Reverse Order</button>
              <div className="flex-1" />
              <button onClick={() => { setFile(null); setPages([]); setPreviewUrl(""); setStatus("") }} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/50">New File</button>
              <button onClick={save} disabled={!isChanged}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-40">
                Apply &amp; Preview
              </button>
            </div>
            {status && <p className="text-xs text-emerald-400">{status}</p>}
            <p className="text-[10px] text-white/30">Drag pages to reorder. Original page number shown in corner.</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {pages.map((p, i) => (
                <div key={`${p.index}-${i}`} draggable onDragStart={() => handleDragStart(i)} onDragOver={e => handleDragOver(e, i)} onDragEnd={handleDragEnd}
                  className={`rounded-xl border-2 overflow-hidden flex flex-col cursor-grab active:cursor-grabbing transition-all ${dragIdx === i ? "border-cyan-400 scale-95 opacity-60" : p.index !== i ? "border-cyan-400/50 ring-1 ring-cyan-400/20" : "border-white/10"}`}>
                  <div className="relative">
                    <img src={p.imageUrl} className="w-full aspect-[3/4] object-cover" />
                    <span className="absolute top-0.5 left-0.5 text-[8px] bg-black/60 text-white/60 px-1 rounded">was {p.index + 1}</span>
                  </div>
                  <div className="py-1 text-center text-xs text-white/40 bg-white/5 flex items-center justify-center gap-1">
                    {i > 0 && <button onClick={() => move(i, i - 1)} className="text-[9px] text-white/30 hover:text-white">←</button>}
                    <span>{i + 1}</span>
                    {i < pages.length - 1 && <button onClick={() => move(i, i + 1)} className="text-[9px] text-white/30 hover:text-white">→</button>}
                  </div>
                </div>
              ))}
            </div>

            {previewUrl && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-white">Preview</h3><div className="flex-1" />
                  <button onClick={download} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">Download</button>
                </div>
                <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5"><iframe src={previewUrl} className="w-full h-[65vh]" /></div>
              </div>
            )}
          </>
        )}
      </div>
    </ToolLayout>
  )
}
