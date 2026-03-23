"use client"

import { useState, useCallback } from "react"
import { PDFDocument } from "pdf-lib"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type PageInfo = { index: number; imageUrl: string; selected: boolean }

export default function ExtractPagesPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PageInfo[]>([])
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")

  const handleFile = useCallback(async (f: File) => {
    setFile(f); setLoading(true); setStatus("Loading pages...")
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
        items.push({ index: i, imageUrl: canvas.toDataURL(), selected: false })
      }
      setPages(items); setStatus(`${pdf.numPages} pages. Select pages to extract.`)
    } catch { setStatus("Error loading PDF") }
    setLoading(false)
  }, [])

  const toggle = (i: number) => setPages(prev => prev.map((p, idx) => idx === i ? { ...p, selected: !p.selected } : p))
  const selectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: true })))
  const selectNone = () => setPages(prev => prev.map(p => ({ ...p, selected: false })))
  const selectedCount = pages.filter(p => p.selected).length

  const extract = useCallback(async () => {
    if (!file || selectedCount === 0) return
    setStatus("Extracting pages...")
    try {
      const buffer = await file.arrayBuffer()
      const src = await PDFDocument.load(buffer)
      const dest = await PDFDocument.create()
      const indices = pages.filter(p => p.selected).map(p => p.index)
      const copied = await dest.copyPages(src, indices)
      copied.forEach(p => dest.addPage(p))
      const bytes = await dest.save()
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      const outName = file.name.replace(".pdf", "_extracted.pdf")
      trackEdit({ fileName: outName, fileSize: blob.size, fileType: "application/pdf", toolUsed: "extract-pages" })
      saveToCloud(blob, outName, "extract-pages")
      setStatus(`Extracted ${indices.length} pages. Preview below.`)
    } catch { setStatus("Error extracting") }
  }, [file, pages, selectedCount, previewUrl])

  const download = () => { if (!previewUrl) return; const a = document.createElement("a"); a.href = previewUrl; a.download = file!.name.replace(".pdf", "_extracted.pdf"); a.click() }

  return (
    <ToolLayout title="Extract Pages" subtitle="Select and extract specific pages from a PDF">
      <div className="space-y-5">
        {!file ? (
          <FileUploader accept=".pdf" onFile={handleFile} label="Upload a PDF to extract pages from" sublabel="Select which pages to keep in a new PDF" cloudFilterTypes={["pdf"]} />
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 py-12"><div className="w-10 h-10 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /><p className="text-white/40 text-sm">{status}</p></div>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={selectAll} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition">All</button>
              <button onClick={selectNone} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition">None</button>
              <span className="text-xs text-emerald-400 font-medium">{selectedCount} / {pages.length} selected</span>
              <div className="flex-1" />
              <button onClick={() => { setFile(null); setPages([]); setPreviewUrl(""); setStatus("") }} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/50">New File</button>
              <button onClick={extract} disabled={selectedCount === 0}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-40">
                Extract {selectedCount} Pages
              </button>
            </div>
            {status && <p className="text-xs text-emerald-400">{status}</p>}
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {pages.map((p, i) => (
                <button key={i} onClick={() => toggle(i)}
                  className={`rounded-xl border-2 overflow-hidden flex flex-col transition-all hover:scale-105 ${p.selected ? "border-teal-400 ring-2 ring-teal-400/30 bg-teal-500/10" : "border-white/10 bg-white/5 opacity-60"}`}>
                  <img src={p.imageUrl} className="w-full aspect-[3/4] object-cover" />
                  <div className={`py-1 text-center text-xs ${p.selected ? "text-teal-300" : "text-white/40"}`}>{i + 1}</div>
                </button>
              ))}
            </div>
            {previewUrl && (
              <div className="space-y-3">
                <div className="flex items-center gap-3"><h3 className="text-sm font-semibold text-white">Preview</h3><div className="flex-1" />
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
