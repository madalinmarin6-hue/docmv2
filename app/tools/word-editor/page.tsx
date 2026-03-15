"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"

const TipTapEditor = dynamic(() => import("@/modules/word-editor/TipTapEditor"), { ssr: false, loading: () => <div className="flex items-center justify-center h-[60vh] text-white/30">Loading editor...</div> })

export default function WordEditorPage() {
  const [content, setContent] = useState("")
  const [fileName, setFileName] = useState("")
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState("")

  const handleImport = useCallback(async (file: File) => {
    setStatus("Loading..."); setFileName(file.name)
    try {
      if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
        const mammoth = (await import("mammoth")).default
        const buffer = await file.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
        setContent(result.value)
      } else if (file.name.endsWith(".html") || file.name.endsWith(".htm")) {
        setContent(await file.text())
      } else {
        const text = await file.text()
        setContent(`<p>${text.replace(/\n/g, "</p><p>")}</p>`)
      }
      setLoaded(true); setStatus(`Loaded: ${file.name}`)
      window.dispatchEvent(new Event("docm-collapse-sidebar"))
    } catch {
      const text = await file.text()
      setContent(`<p>${text.replace(/\n/g, "</p><p>")}</p>`)
      setLoaded(true); setStatus(`Loaded as text: ${file.name}`)
      window.dispatchEvent(new Event("docm-collapse-sidebar"))
    }
  }, [])

  const doExport = useCallback((html: string, ext: string, mime: string) => {
    let blob: Blob
    if (ext === ".doc") {
      const full = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;margin:2cm;line-height:1.6;}img{max-width:100%;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:6px 10px;}</style></head><body>${html}</body></html>`
      blob = new Blob(["\ufeff" + full], { type: "application/msword" })
    } else if (ext === ".html") {
      blob = new Blob([`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;margin:2cm;line-height:1.6;}table{border-collapse:collapse;}td,th{border:1px solid #ccc;padding:6px 10px;}</style></head><body>${html}</body></html>`], { type: "text/html" })
    } else {
      blob = new Blob([html], { type: mime })
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    a.download = (fileName.replace(/\.[^.]+$/, "") || "document") + ext
    a.click(); URL.revokeObjectURL(url)
    setStatus(`Exported as ${ext}!`)
    trackEdit({ fileName: (fileName.replace(/\.[^.]+$/, "") || "document") + ext, fileSize: blob.size, fileType: ext.replace(".", ""), toolUsed: "word-editor" })
    saveToCloud(blob, (fileName.replace(/\.[^.]+$/, "") || "document") + ext, "word-editor")
  }, [fileName])

  const handlePrint = useCallback((html: string) => {
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;margin:2cm;line-height:1.6;}@media print{body{margin:0;}}</style></head><body>${html}</body></html>`)
    w.document.close(); w.print()
  }, [])

  const handleNewDoc = () => {
    setContent("<p></p>"); setFileName("new-document.doc"); setLoaded(true); setStatus("New document")
    window.dispatchEvent(new Event("docm-collapse-sidebar"))
  }

  return (
    <ToolLayout title="Word Editor" subtitle="Professional document editor with TipTap (.doc, .docx, .txt, .html)">
      {!loaded ? (
        <div className="space-y-4">
          <FileUploader accept=".docx,.doc,.txt,.html,.htm,.md" label="Import a document" sublabel="Supports .docx, .doc, .txt, .html, .md files" onFile={handleImport} cloudFilterTypes={["docx", "doc", "txt", "html", "md"]} />
          <div className="flex justify-center">
            <button onClick={handleNewDoc} className="px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 hover:scale-105 transition-all">
              Or create a new document
            </button>
          </div>
        </div>
      ) : (
        <TipTapEditor
          initialContent={content}
          fileName={fileName}
          status={status}
          onExport={(html) => doExport(html, ".doc", "application/msword")}
          onExportHTML={(html) => doExport(html, ".html", "text/html")}
          onExportTXT={(text) => doExport(text, ".txt", "text/plain")}
          onPrint={handlePrint}
          onClose={() => { setLoaded(false); setContent(""); setFileName(""); setStatus("") }}
        />
      )}
    </ToolLayout>
  )
}
