"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import ToolLayout from "../../../components/ToolLayout"
import FileUploader from "../../../components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

export default function SplitPdfPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [rangeInput, setRangeInput] = useState("")
  const [statusMsg, setStatusMsg] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleFile(f: File) {
    setFile(f)
    setStatusMsg("Loading PDF...")
    try {
      const buffer = await f.arrayBuffer()
      const pdf = await PDFDocument.load(buffer)
      const count = pdf.getPageCount()
      setTotalPages(count)
      setSelectedPages(new Set())
      setRangeInput("")
      setStatusMsg(`PDF loaded: ${count} pages`)
    } catch {
      setStatusMsg("Error loading PDF")
    }
  }

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

  function selectNone() {
    setSelectedPages(new Set())
  }

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
          for (let i = Math.max(0, start); i <= Math.min(totalPages - 1, end); i++) {
            pages.add(i)
          }
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
      for (const page of copied) {
        newDoc.addPage(page)
      }

      const bytes = await newDoc.save()
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name.replace(".pdf", "") + "_split.pdf"
      a.click()
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
    setFile(null)
    setTotalPages(0)
    setSelectedPages(new Set())
    setRangeInput("")
    setStatusMsg("")
  }

  return (
    <ToolLayout title="Split PDF" subtitle="Select pages to extract from your PDF">
      <div className="space-y-6">
        {!file ? (
          <FileUploader accept=".pdf" onFile={handleFile} label="Upload a PDF to split" cloudFilterTypes={["pdf"]} />
        ) : (
          <>
            {/* TOOLBAR */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="e.g. 1-3, 5, 7-10"
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400/50 w-48"
                />
                <button onClick={applyRange} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">
                  Apply Range
                </button>
              </div>
              <button onClick={selectAll} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">
                Select All
              </button>
              <button onClick={selectNone} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">
                Clear
              </button>
              <button onClick={reset} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-red-400/60 text-sm hover:bg-red-500/10 transition">
                New File
              </button>
            </div>

            {/* INFO */}
            <div className="flex items-center justify-between text-sm">
              <p className="text-white/40">
                <span className="text-white/70 font-medium">{file.name}</span> — {totalPages} pages
              </p>
              <p className="text-white/40">
                <span className="text-emerald-400 font-medium">{selectedPages.size}</span> selected
              </p>
            </div>

            {/* PAGE GRID */}
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => togglePage(i)}
                  className={`aspect-[3/4] rounded-lg border-2 text-sm font-medium transition-all hover:scale-105
                    ${selectedPages.has(i)
                      ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                      : "border-white/10 bg-white/5 text-white/40 hover:border-white/20"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* EXPORT */}
            <div className="flex justify-center">
              <button
                onClick={splitAndDownload}
                disabled={loading || selectedPages.size === 0}
                className="px-8 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Splitting..." : `Download ${selectedPages.size} Page${selectedPages.size !== 1 ? "s" : ""}`}
              </button>
            </div>

            {statusMsg && <p className="text-sm text-center text-emerald-400">{statusMsg}</p>}
          </>
        )}
      </div>
    </ToolLayout>
  )
}
