"use client"

import { useState, useCallback } from "react"
import { PDFDocument } from "pdf-lib"
import ToolLayout from "../../../components/ToolLayout"
import FileUploader from "../../../components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type PagePreview = { index: number; imageUrl: string }

export default function SplitPdfPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [rangeInput, setRangeInput] = useState("")
  const [statusMsg, setStatusMsg] = useState("")
  const [loading, setLoading] = useState(false)
  const [previews, setPreviews] = useState<PagePreview[]>([])
  const [zoomPage, setZoomPage] = useState<number | null>(null)
  const [zoomImageUrl, setZoomImageUrl] = useState<string>("")
  const [zoomLoading, setZoomLoading] = useState(false)

  const handleFile = useCallback(async (f: File) => {
    setFile(f)
    setStatusMsg("Loading PDF with previews...")
    try {
      const buffer = await f.arrayBuffer()
      const pdf = await PDFDocument.load(buffer)
      const count = pdf.getPageCount()
      setTotalPages(count)
      setSelectedPages(new Set())
      setRangeInput("")

      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
      const pagesPreviews: PagePreview[] = []
      for (let i = 0; i < count; i++) {
        const page = await pdfDoc.getPage(i + 1)
        const viewport = page.getViewport({ scale: 0.5 })
        const canvas = document.createElement("canvas")
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext("2d")!
        await page.render({ canvasContext: ctx, viewport }).promise
        pagesPreviews.push({ index: i, imageUrl: canvas.toDataURL() })
      }
      setPreviews(pagesPreviews)
      setStatusMsg(`PDF loaded: ${count} pages`)
    } catch {
      setStatusMsg("Error loading PDF")
    }
  }, [])

  const openZoom = useCallback(async (pageIndex: number) => {
    if (!file) return
    setZoomPage(pageIndex)
    setZoomLoading(true)
    setZoomImageUrl("")
    try {
      const freshBuffer = await file.arrayBuffer()
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(freshBuffer) }).promise
      const page = await pdfDoc.getPage(pageIndex + 1)
      const viewport = page.getViewport({ scale: 2.5 })
      const canvas = document.createElement("canvas")
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext("2d")!
      await page.render({ canvasContext: ctx, viewport }).promise
      setZoomImageUrl(canvas.toDataURL())
    } catch (err) {
      console.error("Zoom preview error:", err)
      setStatusMsg("Error rendering preview")
      setZoomPage(null)
    }
    setZoomLoading(false)
  }, [file])

  const closeZoom = () => { setZoomPage(null); setZoomImageUrl("") }

  function togglePage(p: number) {
    setSelectedPages(prev => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  function selectAll() {
    const all = new Set<number>()
    for (let i = 0; i < totalPages; i++) all.add(i)
    setSelectedPages(all)
  }

  function selectNone() { setSelectedPages(new Set()) }

  function applyRange() {
    if (!rangeInput.trim()) return
    const pages = new Set<number>()
    const parts = rangeInput.split(",")
    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed.includes("-")) {
        const [startStr, endStr] = trimmed.split("-")
        const start = parseInt(startStr) - 1
        const end = parseInt(endStr) - 1
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(0, start); i <= Math.min(totalPages - 1, end); i++) pages.add(i)
        }
      } else {
        const p = parseInt(trimmed) - 1
        if (!isNaN(p) && p >= 0 && p < totalPages) pages.add(p)
      }
    }
    setSelectedPages(pages)
  }

  async function splitAndDownload() {
    if (!file || selectedPages.size === 0) return
    setLoading(true)
    setStatusMsg("Splitting PDF...")
    try {
      const buffer = await file.arrayBuffer()
      const srcDoc = await PDFDocument.load(buffer)
      const newDoc = await PDFDocument.create()
      const sorted = Array.from(selectedPages).sort((a, b) => a - b)
      const copied = await newDoc.copyPages(srcDoc, sorted)
      for (const page of copied) newDoc.addPage(page)
      const bytes = await newDoc.save()
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = file.name.replace(".pdf", "") + "_split.pdf"; a.click()
      URL.revokeObjectURL(url)
      setStatusMsg(`Exported ${sorted.length} pages successfully!`)
      const editResult = await trackEdit({ fileName: file.name.replace(".pdf", "") + "_split.pdf", fileSize: blob.size, fileType: "pdf", toolUsed: "split-pdf" })
      if (!editResult.allowed) { setStatusMsg(editResult.error || "Edit limit reached"); setLoading(false); return }
      saveToCloud(blob, file.name.replace(".pdf", "") + "_split.pdf", "split-pdf")
    } catch (err) {
      console.error(err)
      setStatusMsg("Error splitting PDF")
    }
    setLoading(false)
  }

  function reset() {
    setFile(null); setTotalPages(0); setSelectedPages(new Set()); setRangeInput(""); setStatusMsg(""); setPreviews([]); setZoomPage(null)
  }

  return (
    <ToolLayout title="Split PDF" subtitle="Select pages to extract from your PDF">
      <div className="space-y-6">
        {!file ? (
          <FileUploader accept=".pdf" onFile={handleFile} label="Upload a PDF to split" sublabel="Pages will show previews" cloudFilterTypes={["pdf"]} />
        ) : (
          <>
            {/* TOOLBAR */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <input type="text" value={rangeInput} onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="e.g. 1-3, 5, 7-10"
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400/50 w-48" />
                <button onClick={applyRange} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Apply Range</button>
              </div>
              <button onClick={selectAll} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Select All</button>
              <button onClick={selectNone} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Clear</button>
              <button onClick={reset} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-red-400/60 text-sm hover:bg-red-500/10 transition">New File</button>
            </div>

            {/* INFO */}
            <div className="flex items-center justify-between text-sm">
              <p className="text-white/40"><span className="text-white/70 font-medium">{file.name}</span> — {totalPages} pages</p>
              <p className="text-white/40"><span className="text-emerald-400 font-medium">{selectedPages.size}</span> selected</p>
            </div>

            {/* PAGE GRID WITH PREVIEWS */}
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {Array.from({ length: totalPages }).map((_, i) => {
                const preview = previews.find(p => p.index === i)
                return (
                  <button key={i} onClick={() => togglePage(i)}
                    className={`rounded-xl border-2 text-sm font-medium transition-all hover:scale-105 overflow-hidden flex flex-col
                      ${selectedPages.has(i)
                        ? "border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-400/30"
                        : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                    <div className="relative group">
                      {preview ? (
                        <img src={preview.imageUrl} alt={`Page ${i + 1}`} className="w-full aspect-[3/4] object-cover" />
                      ) : (
                        <div className="w-full aspect-[3/4] bg-white/5 flex items-center justify-center">
                          <span className="text-white/20 text-2xl">{i + 1}</span>
                        </div>
                      )}
                      <div
                        onClick={(e) => { e.stopPropagation(); openZoom(i) }}
                        className="absolute top-1 right-1 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-black/80 hover:scale-110 z-10"
                        title="Preview page">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                        </svg>
                      </div>
                    </div>
                    <div className={`py-1 text-center text-xs ${selectedPages.has(i) ? "text-emerald-300 bg-emerald-500/10" : "text-white/40"}`}>
                      {i + 1}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* EXPORT */}
            <div className="flex justify-center">
              <button onClick={splitAndDownload} disabled={loading || selectedPages.size === 0}
                className="px-8 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Splitting..." : `Download ${selectedPages.size} Page${selectedPages.size !== 1 ? "s" : ""}`}
              </button>
            </div>

            {statusMsg && <p className="text-sm text-center text-emerald-400">{statusMsg}</p>}

            {/* ZOOM / PREVIEW MODAL */}
            {zoomPage !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={closeZoom}>
                <div className="relative bg-[#12183a] rounded-2xl border border-white/10 shadow-2xl max-w-[90vw] max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-white/5">
                    <span className="text-sm font-semibold text-white">Page {zoomPage + 1} of {totalPages}</span>
                    <div className="flex-1" />
                    <button
                      onClick={() => { togglePage(zoomPage); closeZoom() }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedPages.has(zoomPage)
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30"
                      }`}>
                      {selectedPages.has(zoomPage) ? "Deselect page" : "Select page"}
                    </button>
                    <button onClick={() => { if (zoomPage > 0) openZoom(zoomPage - 1) }} disabled={zoomPage <= 0}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 transition disabled:opacity-30">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </button>
                    <button onClick={() => { if (zoomPage < totalPages - 1) openZoom(zoomPage + 1) }} disabled={zoomPage >= totalPages - 1}
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
                        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-white/40 text-sm">Rendering high-res preview...</p>
                      </div>
                    ) : zoomImageUrl ? (
                      <img src={zoomImageUrl} alt={`Page ${zoomPage + 1}`} className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-xl" />
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
