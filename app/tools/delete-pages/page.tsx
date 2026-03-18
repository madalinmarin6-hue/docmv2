"use client"

import { useState, useCallback } from "react"
import { PDFDocument } from "pdf-lib"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type PagePreview = { index: number; imageUrl: string }

export default function DeletePagesPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [statusMsg, setStatusMsg] = useState("")
  const [loading, setLoading] = useState(false)
  const [previews, setPreviews] = useState<PagePreview[]>([])
  const [zoomPage, setZoomPage] = useState<number | null>(null)
  const [zoomImageUrl, setZoomImageUrl] = useState("")
  const [zoomLoading, setZoomLoading] = useState(false)

  const handleFile = useCallback(async (f: File) => {
    setFile(f)
    setStatusMsg("Loading PDF with previews...")
    try {
      const buffer = await f.arrayBuffer()
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const count = pdf.getPageCount()
      setTotalPages(count)
      setSelectedPages(new Set())

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
      setStatusMsg(`PDF loaded: ${count} pages. Select pages to DELETE (they will be removed).`)
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
      const buffer = await file.arrayBuffer()
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
      const page = await pdfDoc.getPage(pageIndex + 1)
      const viewport = page.getViewport({ scale: 2.5 })
      const canvas = document.createElement("canvas")
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext("2d")!
      await page.render({ canvasContext: ctx, viewport }).promise
      setZoomImageUrl(canvas.toDataURL())
    } catch {
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

  async function deleteAndDownload() {
    if (!file || selectedPages.size === 0) return
    if (selectedPages.size === totalPages) { setStatusMsg("Cannot delete all pages! At least one page must remain."); return }
    setLoading(true)
    setStatusMsg("Removing selected pages...")
    try {
      const buffer = await file.arrayBuffer()
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const keepIndices = Array.from({ length: totalPages }, (_, i) => i).filter(i => !selectedPages.has(i))
      const newDoc = await PDFDocument.create()
      const copied = await newDoc.copyPages(srcDoc, keepIndices)
      for (const page of copied) newDoc.addPage(page)
      const bytes = await newDoc.save()
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const outName = file.name.replace(".pdf", "") + "_pages_removed.pdf"
      a.href = url; a.download = outName; a.click()
      URL.revokeObjectURL(url)
      setStatusMsg(`Removed ${selectedPages.size} page${selectedPages.size > 1 ? "s" : ""}. ${keepIndices.length} pages remaining. Downloaded!`)
      const editResult = await trackEdit({ fileName: outName, fileSize: blob.size, fileType: "pdf", toolUsed: "delete-pages" })
      if (!editResult.allowed) { setStatusMsg(editResult.error || "Edit limit reached"); setLoading(false); return }
      saveToCloud(blob, outName, "delete-pages")
    } catch (err) {
      console.error(err)
      setStatusMsg("Error removing pages")
    }
    setLoading(false)
  }

  function reset() {
    setFile(null); setTotalPages(0); setSelectedPages(new Set()); setStatusMsg(""); setPreviews([]); setZoomPage(null)
  }

  return (
    <ToolLayout title="Delete Pages" subtitle="Select pages to remove from your PDF">
      <div className="space-y-6">
        {!file ? (
          <FileUploader accept=".pdf" onFile={handleFile} label="Upload a PDF to remove pages" sublabel="Select which pages to delete" cloudFilterTypes={["pdf"]} />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={selectAll} className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400/80 text-sm hover:bg-red-500/20 transition">Select All for Deletion</button>
              <button onClick={selectNone} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Clear Selection</button>
              <div className="flex-1" />
              <button onClick={reset} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 text-sm hover:bg-white/10 transition">New File</button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <p className="text-white/40"><span className="text-white/70 font-medium">{file.name}</span> — {totalPages} pages</p>
              <p className="text-white/40"><span className="text-red-400 font-medium">{selectedPages.size}</span> marked for deletion — <span className="text-emerald-400 font-medium">{totalPages - selectedPages.size}</span> will remain</p>
            </div>

            <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3">
              <p className="text-xs text-red-300/80">Click on pages to mark them for deletion. Marked pages (highlighted in red) will be removed from the PDF.</p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {Array.from({ length: totalPages }).map((_, i) => {
                const preview = previews.find(p => p.index === i)
                const isMarked = selectedPages.has(i)
                return (
                  <button key={i} onClick={() => togglePage(i)}
                    className={`rounded-xl border-2 text-sm font-medium transition-all hover:scale-105 overflow-hidden flex flex-col
                      ${isMarked
                        ? "border-red-500 bg-red-500/20 ring-2 ring-red-400/30"
                        : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                    <div className="relative group">
                      {preview ? (
                        <img src={preview.imageUrl} alt={`Page ${i + 1}`} className={`w-full aspect-[3/4] object-cover ${isMarked ? "opacity-40" : ""}`} />
                      ) : (
                        <div className={`w-full aspect-[3/4] bg-white/5 flex items-center justify-center ${isMarked ? "opacity-40" : ""}`}>
                          <span className="text-white/20 text-2xl">{i + 1}</span>
                        </div>
                      )}
                      {isMarked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
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
                    <div className={`py-1 text-center text-xs ${isMarked ? "text-red-400 bg-red-500/10 line-through" : "text-white/40"}`}>
                      {i + 1}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-center">
              <button onClick={deleteAndDownload} disabled={loading || selectedPages.size === 0 || selectedPages.size === totalPages}
                className="px-8 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-rose-600 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Removing..." : `Delete ${selectedPages.size} Page${selectedPages.size !== 1 ? "s" : ""} & Download`}
              </button>
            </div>

            {statusMsg && <p className={`text-sm text-center ${statusMsg.includes("Error") || statusMsg.includes("Cannot") ? "text-red-400" : "text-emerald-400"}`}>{statusMsg}</p>}

            {zoomPage !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={closeZoom}>
                <div className="relative bg-[#12183a] rounded-2xl border border-white/10 shadow-2xl max-w-[90vw] max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-white/5">
                    <span className="text-sm font-semibold text-white">Page {zoomPage + 1} of {totalPages}</span>
                    {selectedPages.has(zoomPage) && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Marked for deletion</span>}
                    <div className="flex-1" />
                    <button
                      onClick={() => { togglePage(zoomPage); closeZoom() }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedPages.has(zoomPage)
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-400/30 hover:bg-red-500/30"
                      }`}>
                      {selectedPages.has(zoomPage) ? "Keep this page" : "Mark for deletion"}
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
                        <div className="w-10 h-10 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
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
