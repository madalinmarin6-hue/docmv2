"use client"

import { useState, useCallback } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { usePing } from "@/lib/usePing"

type PdfInfo = {
  fileName: string; fileSize: number; pageCount: number; title: string; author: string
  subject: string; creator: string; producer: string; creationDate: string; modDate: string
  pdfVersion: string; encrypted: boolean; pages: { width: number; height: number; rotation: number }[]
}

export default function PdfInfoPage() {
  usePing()
  const [info, setInfo] = useState<PdfInfo | null>(null)
  const [status, setStatus] = useState("")

  const handleFile = useCallback(async (f: File) => {
    setStatus("Analyzing...")
    try {
      const buffer = await f.arrayBuffer()
      const { PDFDocument } = await import("pdf-lib")
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const pages = []
      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const p = pdfDoc.getPage(i)
        const { width, height } = p.getSize()
        pages.push({ width: Math.round(width), height: Math.round(height), rotation: p.getRotation().angle })
      }
      setInfo({
        fileName: f.name, fileSize: f.size, pageCount: pdfDoc.getPageCount(),
        title: pdfDoc.getTitle() || "", author: pdfDoc.getAuthor() || "",
        subject: pdfDoc.getSubject() || "", creator: pdfDoc.getCreator() || "",
        producer: pdfDoc.getProducer() || "",
        creationDate: pdfDoc.getCreationDate()?.toISOString() || "",
        modDate: pdfDoc.getModificationDate()?.toISOString() || "",
        pdfVersion: "1.x", encrypted: false, pages,
      })
      setStatus("")
    } catch (err) { console.error(err); setStatus("Error reading PDF") }
  }, [])

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-start gap-3 py-2 border-b border-white/5">
      <span className="text-xs text-white/40 w-32 flex-shrink-0">{label}</span>
      <span className="text-xs text-white break-all">{value || <span className="text-white/20">—</span>}</span>
    </div>
  )

  return (
    <ToolLayout title="PDF Info / Metadata" subtitle="Display PDF metadata and page info">
      <div className="space-y-5">
        {!info ? (
          <>
            <FileUploader accept=".pdf" onFile={handleFile} label="Upload a PDF to view its metadata" sublabel="Shows file info, page sizes, author, dates, and more" cloudFilterTypes={["pdf"]} />
            {status && <p className="text-xs text-center text-emerald-400">{status}</p>}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-white">{info.fileName}</h3>
              <div className="flex-1" />
              <button onClick={() => setInfo(null)} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/50">New File</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <h4 className="text-xs font-semibold text-white/60 mb-2">File Information</h4>
                <Row label="File Name" value={info.fileName} />
                <Row label="File Size" value={`${(info.fileSize / 1024).toFixed(1)} KB (${(info.fileSize / 1024 / 1024).toFixed(2)} MB)`} />
                <Row label="Pages" value={`${info.pageCount}`} />
                <Row label="Encrypted" value={info.encrypted ? "Yes" : "No"} />
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <h4 className="text-xs font-semibold text-white/60 mb-2">Document Properties</h4>
                <Row label="Title" value={info.title} />
                <Row label="Author" value={info.author} />
                <Row label="Subject" value={info.subject} />
                <Row label="Creator" value={info.creator} />
                <Row label="Producer" value={info.producer} />
                <Row label="Created" value={info.creationDate} />
                <Row label="Modified" value={info.modDate} />
              </div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <h4 className="text-xs font-semibold text-white/60 mb-2">Page Details</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {info.pages.map((p, i) => (
                  <div key={i} className="rounded-lg bg-white/5 border border-white/10 p-2 text-center">
                    <p className="text-xs text-white font-medium">Page {i + 1}</p>
                    <p className="text-[10px] text-white/40">{p.width} × {p.height} pt</p>
                    <p className="text-[9px] text-white/30">{(p.width / 72).toFixed(1)}&quot; × {(p.height / 72).toFixed(1)}&quot;</p>
                    {p.rotation !== 0 && <p className="text-[9px] text-amber-400">Rotated {p.rotation}°</p>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  )
}
