"use client"
import { useState } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

export default function EditMetadataPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")
  const [meta, setMeta] = useState({ title: "", author: "", subject: "", keywords: "", creator: "", producer: "" })

  const loadMeta = async (f: File) => {
    setFile(f)
    try {
      const { PDFDocument } = await import("pdf-lib")
      const doc = await PDFDocument.load(await f.arrayBuffer())
      setMeta({
        title: doc.getTitle() || "",
        author: doc.getAuthor() || "",
        subject: doc.getSubject() || "",
        keywords: doc.getKeywords() || "",
        creator: doc.getCreator() || "",
        producer: doc.getProducer() || "",
      })
    } catch { /* ignore */ }
  }

  const process = async () => {
    if (!file) return
    setLoading(true); setStatus("Updating metadata...")
    try {
      const { PDFDocument } = await import("pdf-lib")
      const doc = await PDFDocument.load(await file.arrayBuffer())
      if (meta.title) doc.setTitle(meta.title)
      if (meta.author) doc.setAuthor(meta.author)
      if (meta.subject) doc.setSubject(meta.subject)
      if (meta.keywords) doc.setKeywords([meta.keywords])
      if (meta.creator) doc.setCreator(meta.creator)
      if (meta.producer) doc.setProducer(meta.producer)
      const bytes = await doc.save()
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob); setPreviewUrl(url)
      const a = document.createElement("a"); a.href = url; a.download = file.name; a.click()
      trackEdit({ fileName: file.name, fileSize: blob.size, fileType: "application/pdf", toolUsed: "edit-metadata" })
      saveToCloud(blob, file.name, "edit-metadata")
      setStatus("Done! Metadata updated.")
    } catch (e: any) { setStatus("Error: " + e.message) }
    setLoading(false)
  }

  return (
    <ToolLayout title="Edit Metadata" subtitle="View and edit PDF document metadata">
      <div className="space-y-5">
        {!file ? (
          <FileUploader accept=".pdf" onFile={loadMeta} label="Upload a PDF to edit metadata" sublabel="View and edit title, author, subject, and more" cloudFilterTypes={["pdf"]} />
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 flex items-center justify-between">
              <span className="truncate">{file.name}</span>
              <button onClick={() => { setFile(null); setPreviewUrl(""); setStatus(""); setMeta({ title: "", author: "", subject: "", keywords: "", creator: "", producer: "" }) }} className="text-xs text-white/30 hover:text-white ml-3">✕</button>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Document Properties</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(meta) as (keyof typeof meta)[]).map(key => (
                  <div key={key}>
                    <label className="text-[10px] text-white/40 capitalize">{key}</label>
                    <input type="text" value={meta[key]} onChange={e => setMeta(m => ({ ...m, [key]: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-400/50" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <button onClick={process} disabled={loading} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 to-cyan-500 text-white disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-lg">{loading ? "Saving..." : "Save Metadata"}</button>
            </div>
            {status && <p className={`text-xs text-center ${status.startsWith("Error") ? "text-red-400" : status.startsWith("Done") ? "text-emerald-400" : "text-white/50"}`}>{status}</p>}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
