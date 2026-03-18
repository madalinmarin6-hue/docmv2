"use client"

import { useState, useCallback, useRef } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { usePing } from "@/lib/usePing"

export default function ExcelViewerPage() {
  usePing()
  const [sheets, setSheets] = useState<{ name: string; html: string }[]>([])
  const [activeSheet, setActiveSheet] = useState(0)
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [darkMode, setDarkMode] = useState(true)
  const fileRef = useRef<File | null>(null)

  const dm = darkMode
  const tbg = dm ? "bg-[#2d2d2d] border-[#404040]" : "bg-[#f3f3f3] border-gray-200"
  const mbg = dm ? "bg-[#252526] border-[#404040]" : "bg-white border-gray-200"
  const tc = dm ? "text-gray-200" : "text-gray-700"
  const mc = dm ? "text-gray-400" : "text-gray-500"
  const bb = `w-8 h-8 rounded flex items-center justify-center transition ${dm ? "hover:bg-[#3d3d3d] text-gray-300" : "hover:bg-gray-200 text-gray-600"}`

  const loadFile = useCallback(async (file: File) => {
    setLoading(true)
    setFileName(file.name)
    fileRef.current = file
    try {
      const XLSX = await import("xlsx")
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: "array" })
      const parsed = wb.SheetNames.map(name => {
        const ws = wb.Sheets[name]
        const html = XLSX.utils.sheet_to_html(ws, { editable: false })
        return { name, html }
      })
      setSheets(parsed)
      setActiveSheet(0)
    } catch (err) {
      console.error("Failed to load spreadsheet:", err)
      setSheets([{ name: "Error", html: `<p style="color:red;">Failed to open file: ${err instanceof Error ? err.message : "Unknown error"}</p>` }])
    }
    setLoading(false)
  }, [])

  const handleDownload = () => {
    if (!fileRef.current) return
    const url = URL.createObjectURL(fileRef.current)
    const a = document.createElement("a"); a.href = url; a.download = fileName; a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => { setSheets([]); setFileName(""); fileRef.current = null }

  return (
    <ToolLayout title="Excel Viewer" subtitle="View Excel spreadsheets (.xlsx, .xls, .csv) directly in your browser">
      {sheets.length === 0 ? (
        <div>
          <FileUploader
            accept=".xlsx,.xls,.csv,.ods"
            label="Open a spreadsheet"
            sublabel="Supports .xlsx, .xls, .csv, .ods files"
            onFile={loadFile}
            cloudFilterTypes={["xlsx", "xls", "csv", "ods"]}
          />
          {loading && <p className="text-center text-white/50 mt-4">Loading spreadsheet...</p>}
        </div>
      ) : (
        <div className={`flex flex-col h-[88vh] rounded-xl overflow-hidden border ${dm ? "border-[#404040]" : "border-gray-300"}`}>
          {/* TOOLBAR */}
          <div className={`flex items-center gap-1 px-3 py-1.5 ${tbg} border-b`}>
            <svg className="w-5 h-5 text-green-500 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z"/></svg>
            <span className={`text-sm font-medium ${tc} truncate max-w-[200px] mr-2`}>{fileName}</span>
            <div className={`w-px h-5 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />
            <button onClick={() => setZoom(z => Math.max(50, z - 25))} className={bb} title="Zoom Out">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"/></svg>
            </button>
            <span className={`text-xs w-12 text-center ${mc}`}>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 25))} className={bb} title="Zoom In">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"/></svg>
            </button>
            <div className="flex-1" />
            <button onClick={() => setDarkMode(!darkMode)} className={bb} title="Toggle Theme">
              {dm ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>}
            </button>
            <button onClick={handleDownload} className={bb} title="Download">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
            </button>
            <button onClick={reset} className={`px-3 py-1 rounded text-xs ${mc} hover:opacity-80`}>Close</button>
          </div>

          {/* SHEET TABS */}
          {sheets.length > 1 && (
            <div className={`flex gap-0 px-2 pt-1 ${dm ? "bg-[#1e1e1e]" : "bg-[#e8eaed]"}`}>
              {sheets.map((s, i) => (
                <button key={i} onClick={() => setActiveSheet(i)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-t-lg transition ${i === activeSheet ? dm ? "bg-[#252526] text-white border-t border-x border-[#404040]" : "bg-white text-gray-800 border-t border-x border-gray-300" : dm ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}>
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {/* TABLE VIEW */}
          <div className={`flex-1 overflow-auto ${dm ? "bg-[#1e1e1e]" : "bg-white"}`}>
            <div
              style={{ fontSize: `${(zoom / 100) * 13}px`, transformOrigin: "top left" }}
              className={dm ? "text-gray-200" : "text-gray-800"}
              dangerouslySetInnerHTML={{ __html: `<style>table{border-collapse:collapse;width:100%;min-width:600px;}td,th{border:1px solid ${dm ? "#404040" : "#d1d5db"};padding:4px 8px;text-align:left;white-space:nowrap;}th{background:${dm ? "#2d2d2d" : "#f3f4f6"};font-weight:600;position:sticky;top:0;z-index:1;}tr:hover{background:${dm ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"}}</style>${sheets[activeSheet]?.html || ""}` }}
            />
          </div>

          {/* STATUS BAR */}
          <div className={`flex items-center px-3 py-1 ${mbg} border-t text-[10px] ${mc}`}>
            <span>{sheets.length} sheet{sheets.length > 1 ? "s" : ""}</span>
            <div className={`w-px h-3 mx-3 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />
            <span>{fileName}</span>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(z => Math.max(50, z - 25))}>−</button>
              <input type="range" min={50} max={200} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-24 accent-green-500" />
              <button onClick={() => setZoom(z => Math.min(200, z + 25))}>+</button>
              <span className="w-10 text-center">{zoom}%</span>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
