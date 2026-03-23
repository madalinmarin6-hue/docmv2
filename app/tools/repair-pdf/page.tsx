"use client"

import { useState, useCallback } from "react"
import { PDFDocument } from "pdf-lib"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

export default function RepairPdfPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState("")
  const [processing, setProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")
  const [details, setDetails] = useState<string[]>([])

  const process = useCallback(async (f: File) => {
    setFile(f); setProcessing(true); setStatus("Repairing PDF..."); setDetails([])
    const log: string[] = []
    try {
      const buffer = await f.arrayBuffer()
      log.push("✓ File read successfully")

      let pdfDoc: any
      try {
        pdfDoc = await PDFDocument.load(buffer)
        log.push("✓ PDF parsed normally")
      } catch {
        log.push("⚠ Standard parse failed, trying with ignoreEncryption...")
        pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
        log.push("✓ PDF loaded with ignoreEncryption")
      }

      log.push(`✓ ${pdfDoc.getPageCount()} pages found`)

      const dest = await PDFDocument.create()
      const indices = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i)
      const copied = await dest.copyPages(pdfDoc, indices)
      copied.forEach((p) => dest.addPage(p))

      const title = pdfDoc.getTitle()
      const author = pdfDoc.getAuthor()
      if (title) dest.setTitle(title)
      if (author) dest.setAuthor(author)
      log.push("✓ Pages copied to clean document")
      log.push("✓ Metadata preserved")

      const bytes = await dest.save()
      log.push(`✓ New PDF saved (${(bytes.length / 1024).toFixed(1)} KB)`)

      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      const outName = f.name.replace(".pdf", "_repaired.pdf")
      trackEdit({ fileName: outName, fileSize: blob.size, fileType: "application/pdf", toolUsed: "repair-pdf" })
      saveToCloud(blob, outName, "repair-pdf")
      setStatus("Repair complete!")
    } catch (err) {
      log.push(`✗ Error: ${err instanceof Error ? err.message : "Unknown error"}`)
      setStatus("Repair failed — file may be severely corrupted")
    }
    setDetails(log)
    setProcessing(false)
  }, [previewUrl])

  const download = () => { if (!previewUrl) return; const a = document.createElement("a"); a.href = previewUrl; a.download = file!.name.replace(".pdf", "_repaired.pdf"); a.click() }

  return (
    <ToolLayout title="Repair PDF" subtitle="Attempt to fix corrupted or damaged PDFs">
      <div className="space-y-5">
        {!file ? (
          <FileUploader accept=".pdf" onFile={process} label="Upload a damaged or corrupted PDF" sublabel="Attempts to rebuild the PDF structure by re-creating pages" cloudFilterTypes={["pdf"]} />
        ) : processing ? (
          <div className="flex flex-col items-center gap-3 py-12"><div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /><p className="text-white/40 text-sm">{status}</p></div>
        ) : (
          <>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-white">Repair Log</h3>
              {details.map((d, i) => (
                <p key={i} className={`text-xs font-mono ${d.startsWith("✓") ? "text-green-400" : d.startsWith("⚠") ? "text-amber-400" : d.startsWith("✗") ? "text-red-400" : "text-white/40"}`}>{d}</p>
              ))}
            </div>
            <div className="flex items-center gap-3 justify-center">
              <button onClick={() => { setFile(null); setPreviewUrl(""); setStatus(""); setDetails([]) }} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/50">New File</button>
              {previewUrl && <button onClick={download} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">Download Repaired PDF</button>}
            </div>
            {previewUrl && (
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5"><iframe src={previewUrl} className="w-full h-[60vh]" /></div>
            )}
          </>
        )}
      </div>
    </ToolLayout>
  )
}
