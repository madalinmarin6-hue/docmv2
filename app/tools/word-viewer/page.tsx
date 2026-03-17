"use client"

import { useState, useCallback, useRef } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { usePing } from "@/lib/usePing"

export default function WordViewerPage() {
  usePing()
  const [html, setHtml] = useState("")
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [darkMode, setDarkMode] = useState(true)
  const [wordCount, setWordCount] = useState(0)
  const [pageEstimate, setPageEstimate] = useState(1)
  const fileRef = useRef<File | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const dm = darkMode
  const tbg = dm ? "bg-[#2d2d2d] border-[#404040]" : "bg-[#f3f3f3] border-gray-200"
  const mbg = dm ? "bg-[#252526] border-[#404040]" : "bg-white border-gray-200"
  const tc = dm ? "text-gray-200" : "text-gray-700"
  const mc = dm ? "text-gray-400" : "text-gray-500"
  const bb = `w-8 h-8 rounded flex items-center justify-center transition ${dm ? "hover:bg-[#3d3d3d] text-gray-300" : "hover:bg-gray-200 text-gray-600"}`

  const loadDoc = useCallback(async (file: File) => {
    setLoading(true)
    setFileName(file.name)
    fileRef.current = file
    try {
      const buffer = await file.arrayBuffer()
      const ext = file.name.toLowerCase()

      if (ext.endsWith(".docx") || ext.endsWith(".doc")) {
        const mammoth = (await import("mammoth")).default
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
        setHtml(result.value || "<p>No content found in document.</p>")
        const text = result.value.replace(/<[^>]+>/g, " ").trim()
        const words = text ? text.split(/\s+/).length : 0
        setWordCount(words)
        setPageEstimate(Math.max(1, Math.ceil(words / 300)))
      } else if (ext.endsWith(".html") || ext.endsWith(".htm")) {
        const text = await file.text()
        setHtml(text)
        const plain = text.replace(/<[^>]+>/g, " ").trim()
        setWordCount(plain ? plain.split(/\s+/).length : 0)
        setPageEstimate(Math.max(1, Math.ceil((plain ? plain.split(/\s+/).length : 0) / 300)))
      } else if (ext.endsWith(".txt") || ext.endsWith(".md")) {
        const text = await file.text()
        setHtml(`<pre style="white-space:pre-wrap;font-family:inherit;margin:0;">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`)
        const words = text.trim() ? text.trim().split(/\s+/).length : 0
        setWordCount(words)
        setPageEstimate(Math.max(1, Math.ceil(words / 300)))
      } else {
        const text = await file.text()
        setHtml(`<p>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "</p><p>")}</p>`)
        setWordCount(0)
        setPageEstimate(1)
      }
    } catch (err) {
      console.error("Failed to load document:", err)
      setHtml(`<p style="color:red;">Failed to open document. Error: ${err instanceof Error ? err.message : "Unknown error"}</p>`)
    }
    setLoading(false)
  }, [])

  const handleDownload = () => {
    if (!fileRef.current) return
    const url = URL.createObjectURL(fileRef.current)
    const a = document.createElement("a"); a.href = url; a.download = fileName; a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileName}</title><style>body{font-family:Calibri,Arial,sans-serif;margin:2cm;line-height:1.6;color:#222;}img{max-width:100%;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:6px 10px;}h1,h2,h3{color:#1a1a2e;}@media print{body{margin:0;}}</style></head><body>${html}</body></html>`)
    w.document.close()
    w.onload = () => w.print()
  }

  const reset = () => {
    setHtml("")
    setFileName("")
    setWordCount(0)
    setPageEstimate(1)
    fileRef.current = null
  }

  return (
    <ToolLayout title="Word Viewer" subtitle="View Word documents (.docx, .doc, .html, .txt) directly in your browser">
      {!html ? (
        <div>
          <FileUploader
            accept=".docx,.doc,.html,.htm,.txt,.md"
            label="Open a Word document"
            sublabel="Supports .docx, .doc, .html, .txt, .md files"
            onFile={loadDoc}
            cloudFilterTypes={["docx", "doc", "html", "txt", "md"]}
          />
          {loading && <p className="text-center text-white/50 mt-4">Loading document...</p>}
        </div>
      ) : (
        <div className={`flex flex-col h-[88vh] rounded-xl overflow-hidden border ${dm ? "border-[#404040]" : "border-gray-300"}`}>
          {/* TOOLBAR */}
          <div className={`flex items-center gap-1 px-3 py-1.5 ${tbg} border-b`}>
            <svg className="w-5 h-5 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z"/></svg>
            <span className={`text-sm font-medium ${tc} truncate max-w-[200px] mr-2`}>{fileName}</span>
            <div className={`w-px h-5 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />

            {/* Zoom */}
            <button onClick={() => setZoom(z => Math.max(50, z - 25))} className={bb} title="Zoom Out">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"/></svg>
            </button>
            <span className={`text-xs w-12 text-center ${mc}`}>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 25))} className={bb} title="Zoom In">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"/></svg>
            </button>
            <button onClick={() => setZoom(100)} className={`${bb} text-[10px]`} title="Reset Zoom">Fit</button>

            <div className={`w-px h-5 mx-1 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />

            <div className="flex-1" />

            {/* Actions */}
            <button onClick={() => setDarkMode(!darkMode)} className={bb} title="Toggle Theme">
              {dm ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>}
            </button>
            <button onClick={handlePrint} className={bb} title="Print">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m0 0a48.1 48.1 0 0110.5 0m-10.5 0V4.875c0-.621.504-1.125 1.125-1.125h8.25c.621 0 1.125.504 1.125 1.125v3.659"/></svg>
            </button>
            <button onClick={handleDownload} className={bb} title="Download">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
            </button>
            <button onClick={reset} className={`px-3 py-1 rounded text-xs ${mc} hover:opacity-80`}>Close</button>
          </div>

          {/* DOCUMENT VIEW */}
          <div className={`flex-1 overflow-auto ${dm ? "bg-[#1e1e1e]" : "bg-[#e8eaed]"} py-6 flex justify-center`}>
            <div
              ref={contentRef}
              className="bg-white shadow-lg"
              style={{
                width: `${(zoom / 100) * 794}px`,
                minHeight: `${(zoom / 100) * 1123}px`,
                padding: `${(zoom / 100) * 96}px ${(zoom / 100) * 72}px`,
                transformOrigin: "top center",
                color: "#222",
                fontFamily: "Calibri, Arial, sans-serif",
                lineHeight: "1.6",
                fontSize: `${(zoom / 100) * 14}px`,
              }}
              dangerouslySetInnerHTML={{ __html: `<style>img{max-width:100%;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:6px 10px;}h1,h2,h3{color:#1a1a2e;}p{margin:0.4em 0;}ul,ol{padding-left:1.5em;}</style>${html}` }}
            />
          </div>

          {/* STATUS BAR */}
          <div className={`flex items-center px-3 py-1 ${mbg} border-t text-[10px] ${mc}`}>
            <span>~{pageEstimate} page{pageEstimate > 1 ? "s" : ""}</span>
            <div className={`w-px h-3 mx-3 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />
            <span>{wordCount.toLocaleString()} words</span>
            <div className={`w-px h-3 mx-3 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />
            <span>{fileName}</span>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(z => Math.max(50, z - 25))}>−</button>
              <input type="range" min={50} max={200} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-24 accent-blue-500" />
              <button onClick={() => setZoom(z => Math.min(200, z + 25))}>+</button>
              <span className="w-10 text-center">{zoom}%</span>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
