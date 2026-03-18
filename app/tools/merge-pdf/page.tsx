"use client"

import { useState, useCallback, useRef } from "react"
import { PDFDocument } from "pdf-lib"
import ToolLayout from "@/components/ToolLayout"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type PageThumb = { imageUrl: string; selected: boolean }
type PdfItem = { id: string; file: File; name: string; pageCount: number; coverUrl: string; pages: PageThumb[]; expanded: boolean }

export default function MergePdfPage() {
  usePing()
  const [pdfs, setPdfs] = useState<PdfItem[]>([])
  const [status, setStatus] = useState("")
  const [merging, setMerging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [zoomPage, setZoomPage] = useState<{ pdfIdx: number; pageIdx: number } | null>(null)
  const [zoomImageUrl, setZoomImageUrl] = useState("")
  const [zoomLoading, setZoomLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const items: PdfItem[] = []
    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith(".pdf")) continue
      try {
        const buffer = await file.arrayBuffer()
        const pdfLib = await PDFDocument.load(buffer, { ignoreEncryption: true })
        const pdfjsLib = await import("pdfjs-dist")
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
        const pageCount = pdfLib.getPageCount()
        const thumbs: PageThumb[] = []
        for (let i = 0; i < doc.numPages; i++) {
          const page = await doc.getPage(i + 1)
          const vp = page.getViewport({ scale: 0.25 })
          const canvas = document.createElement("canvas")
          canvas.width = vp.width; canvas.height = vp.height
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise
          thumbs.push({ imageUrl: canvas.toDataURL(), selected: true })
        }
        const coverUrl = thumbs[0]?.imageUrl || ""
        items.push({ id: Math.random().toString(36).slice(2), file, name: file.name, pageCount, coverUrl, pages: thumbs, expanded: true })
      } catch { items.push({ id: Math.random().toString(36).slice(2), file, name: file.name, pageCount: 0, coverUrl: "", pages: [], expanded: true }) }
    }
    setPdfs(prev => [...prev, ...items])
    setPreviewUrl("")
  }, [])

  const remove = (id: string) => { setPdfs(prev => prev.filter(p => p.id !== id)); setPreviewUrl("") }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= pdfs.length) return
    setPdfs(prev => { const c = [...prev]; [c[from], c[to]] = [c[to], c[from]]; return c })
    setPreviewUrl("")
  }

  const toggleExpand = (id: string) => setPdfs(prev => prev.map(p => p.id === id ? { ...p, expanded: !p.expanded } : p))

  const togglePage = (pdfId: string, pageIdx: number) => {
    setPdfs(prev => prev.map(p => p.id === pdfId ? { ...p, pages: p.pages.map((pg, i) => i === pageIdx ? { ...pg, selected: !pg.selected } : pg) } : p))
    setPreviewUrl("")
  }

  const selectAllPages = (pdfId: string, val: boolean) => {
    setPdfs(prev => prev.map(p => p.id === pdfId ? { ...p, pages: p.pages.map(pg => ({ ...pg, selected: val })) } : p))
    setPreviewUrl("")
  }

  const handleDragStart = (i: number) => setDragIdx(i)
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== i) { move(dragIdx, i); setDragIdx(i) } }
  const handleDragEnd = () => setDragIdx(null)

  const openZoom = useCallback(async (pdfIdx: number, pageIdx: number) => {
    setZoomPage({ pdfIdx, pageIdx })
    setZoomLoading(true)
    setZoomImageUrl("")
    try {
      const f = pdfs[pdfIdx]?.file
      if (!f) return
      const buffer = await f.arrayBuffer()
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
      const page = await doc.getPage(pageIdx + 1)
      const vp = page.getViewport({ scale: 2.0 })
      const canvas = document.createElement("canvas")
      canvas.width = vp.width; canvas.height = vp.height
      await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise
      setZoomImageUrl(canvas.toDataURL())
    } catch { setZoomImageUrl("") }
    setZoomLoading(false)
  }, [pdfs])

  const closeZoom = () => { setZoomPage(null); setZoomImageUrl("") }

  const merge = useCallback(async () => {
    if (pdfs.length < 1) return
    setMerging(true); setStatus("Merging PDFs...")
    try {
      const merged = await PDFDocument.create()
      for (let i = 0; i < pdfs.length; i++) {
        const p = pdfs[i]
        const selectedIndices = p.pages.map((pg, j) => pg.selected ? j : -1).filter(j => j >= 0)
        if (selectedIndices.length === 0) continue
        setStatus(`Adding ${p.name} (${i + 1}/${pdfs.length})...`)
        const buffer = await p.file.arrayBuffer()
        const src = await PDFDocument.load(buffer, { ignoreEncryption: true })
        const copied = await merged.copyPages(src, selectedIndices)
        copied.forEach(pg => merged.addPage(pg))
      }
      if (merged.getPageCount() === 0) { setStatus("No pages selected!"); setMerging(false); return }
      const bytes = await merged.save()
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setStatus(`Merged ${merged.getPageCount()} pages from ${pdfs.length} PDFs.`)
      const editResult = await trackEdit({ fileName: "merged.pdf", fileSize: blob.size, fileType: "pdf", toolUsed: "merge-pdf" })
      if (!editResult.allowed) { setStatus(editResult.error || "Edit limit reached"); setMerging(false); return }
      saveToCloud(blob, "merged.pdf", "merge-pdf")
    } catch (err) { console.error(err); setStatus("Error merging") }
    setMerging(false)
  }, [pdfs])

  const download = () => {
    if (!previewUrl) return
    const a = document.createElement("a"); a.href = previewUrl; a.download = "merged.pdf"; a.click()
  }

  const totalSelected = pdfs.reduce((s, p) => s + p.pages.filter(pg => pg.selected).length, 0)
  const totalPages = pdfs.reduce((s, p) => s + p.pageCount, 0)

  return (
    <ToolLayout title="Merge PDF" subtitle="Combine multiple PDFs — select specific pages from each">
      <div className="space-y-5">
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-white/20 hover:border-blue-400/40 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-white/5">
          <input ref={inputRef} type="file" accept=".pdf" multiple className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = "" }} />
          <p className="text-white/60 text-sm font-medium">Click or drag PDF files here</p>
          <p className="text-white/30 text-xs mt-1">Select multiple PDFs to merge — you can pick specific pages from each</p>
        </div>

        {pdfs.length > 0 && (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-white/60"><strong className="text-white">{pdfs.length}</strong> files — <strong className="text-white">{totalSelected}</strong>/{totalPages} pages selected</span>
              <button onClick={() => inputRef.current?.click()} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">+ Add more</button>
              <div className="flex-1" />
              {status && <span className="text-xs text-emerald-400">{status}</span>}
              <button onClick={merge} disabled={merging || totalSelected === 0}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-40">
                {merging ? "Merging..." : `Merge ${totalSelected} Pages`}
              </button>
            </div>

            <div className="space-y-3">
              {pdfs.map((p, i) => {
                const selCount = p.pages.filter(pg => pg.selected).length
                return (
                <div key={p.id} className={`rounded-xl border transition-all ${dragIdx === i ? "border-blue-400 bg-blue-500/10" : "border-white/10 bg-white/5"}`}>
                  {/* PDF header row */}
                  <div draggable onDragStart={() => handleDragStart(i)} onDragOver={e => handleDragOver(e, i)} onDragEnd={handleDragEnd}
                    className="flex items-center gap-3 p-3 cursor-grab active:cursor-grabbing">
                    <span className="text-white/30 text-sm font-mono w-6 text-center">{i + 1}</span>
                    {p.coverUrl ? <img src={p.coverUrl} className="w-10 h-14 rounded object-cover border border-white/10" /> : <div className="w-10 h-14 rounded bg-white/5 flex items-center justify-center text-white/20 text-[8px]">PDF</div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-white/40">{selCount}/{p.pageCount} pages selected — {(p.file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button onClick={() => toggleExpand(p.id)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 transition flex items-center gap-1" title={p.expanded ? "Hide pages" : "Show pages"}>
                      <svg className={`w-3 h-3 transition-transform ${p.expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </button>
                    <div className="flex gap-1">
                      {i > 0 && <button onClick={() => move(i, i - 1)} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/10 text-xs transition">&#8593;</button>}
                      {i < pdfs.length - 1 && <button onClick={() => move(i, i + 1)} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/10 text-xs transition">&#8595;</button>}
                      <button onClick={() => remove(p.id)} className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400/60 hover:bg-red-500/20 text-xs transition">&times;</button>
                    </div>
                  </div>

                  {/* Expanded page grid */}
                  {p.expanded && p.pages.length > 0 && (
                    <div className="px-3 pb-3 border-t border-white/5 pt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => selectAllPages(p.id, true)} className="text-[10px] text-blue-400 hover:underline">Select all</button>
                        <span className="text-white/20">|</span>
                        <button onClick={() => selectAllPages(p.id, false)} className="text-[10px] text-red-400 hover:underline">Deselect all</button>
                      </div>
                      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                        {p.pages.map((pg, j) => (
                          <div key={j} className={`rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${pg.selected ? "border-blue-400 ring-1 ring-blue-400/30" : "border-white/10 opacity-40"}`}>
                            <div className="relative aspect-[3/4] bg-white/5 group" onClick={() => togglePage(p.id, j)}>
                              <img src={pg.imageUrl} alt={`P${j + 1}`} className="w-full h-full object-contain" />
                              {pg.selected && <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded bg-blue-500 flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></div>}
                              <div onClick={(e) => { e.stopPropagation(); openZoom(i, j) }}
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer hover:bg-black/80"
                                title="Zoom">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
                              </div>
                            </div>
                            <p className={`text-center text-[8px] py-0.5 ${pg.selected ? "text-blue-300" : "text-white/30"}`}>{j + 1}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>
          </>
        )}

        {previewUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-white">Preview</h3>
              <div className="flex-1" />
              <button onClick={download} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">Download Merged PDF</button>
            </div>
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
              <iframe src={previewUrl} className="w-full h-[70vh]" />
            </div>
          </div>
        )}

        {/* ZOOM MODAL */}
        {zoomPage !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={closeZoom}>
            <div className="relative bg-[#12183a] rounded-2xl border border-white/10 shadow-2xl max-w-[90vw] max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-white/5">
                <span className="text-sm font-semibold text-white">{pdfs[zoomPage.pdfIdx]?.name} — Page {zoomPage.pageIdx + 1}</span>
                <div className="flex-1" />
                <button onClick={closeZoom} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[60vh]">
                {zoomLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-white/40 text-sm">Rendering high-res preview...</p>
                  </div>
                ) : zoomImageUrl ? (
                  <img src={zoomImageUrl} alt="Page preview" className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-xl" />
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
