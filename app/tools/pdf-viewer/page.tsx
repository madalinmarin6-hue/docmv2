"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { usePing } from "@/lib/usePing"

type PageInfo = { pageNum: number; imageUrl: string; width: number; height: number }

export default function PDFViewerPage() {
  usePing()
  const [pages, setPages] = useState<PageInfo[]>([])
  const [activePage, setActivePage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState("")
  const [searchText, setSearchText] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [showThumbs, setShowThumbs] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [pdfUrl, setPdfUrl] = useState("")
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<File | null>(null)

  const dm = darkMode
  const tbg = dm ? "bg-[#2d2d2d] border-[#404040]" : "bg-[#f3f3f3] border-gray-200"
  const mbg = dm ? "bg-[#252526] border-[#404040]" : "bg-white border-gray-200"
  const tc = dm ? "text-gray-200" : "text-gray-700"
  const mc = dm ? "text-gray-400" : "text-gray-500"
  const bb = `w-8 h-8 rounded flex items-center justify-center transition ${dm ? "hover:bg-[#3d3d3d] text-gray-300" : "hover:bg-gray-200 text-gray-600"}`

  const loadPDF = useCallback(async (file: File) => {
    setLoading(true)
    setFileName(file.name)
    fileRef.current = file
    try {
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      const buffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
      setPdfDoc(pdf)
      setTotalPages(pdf.numPages)
      const rendered: PageInfo[] = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2 })
        const canvas = document.createElement("canvas")
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext("2d")!
        await page.render({ canvasContext: ctx, viewport }).promise
        rendered.push({ pageNum: i, imageUrl: canvas.toDataURL(), width: viewport.width, height: viewport.height })
      }
      setPages(rendered)
      setActivePage(1)
    } catch (err) { console.error(err) }
    setLoading(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type === "application/pdf") loadPDF(file)
  }, [loadPDF])

  const handleDownload = () => {
    if (!fileRef.current) return
    const url = URL.createObjectURL(fileRef.current)
    const a = document.createElement("a"); a.href = url; a.download = fileName; a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    if (!fileRef.current) return
    const url = URL.createObjectURL(fileRef.current)
    const w = window.open(url, "_blank")
    if (w) { w.onload = () => w.print() }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") { e.preventDefault(); setShowSearch(s => !s) }
      if (e.key === "ArrowRight" || e.key === "PageDown") setActivePage(p => Math.min(p + 1, totalPages))
      if (e.key === "ArrowLeft" || e.key === "PageUp") setActivePage(p => Math.max(p - 1, 1))
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [totalPages])

  const scrollToPage = (num: number) => {
    setActivePage(num)
    document.getElementById(`pdf-page-${num}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <ToolLayout title="PDF Viewer" subtitle="Open and view PDF documents with zoom, search, and navigation">
      {pages.length === 0 ? (
        <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
          <FileUploader accept=".pdf" label="Open a PDF document" sublabel="Drag & drop or click to upload" onFile={loadPDF} cloudFilterTypes={["pdf"]} />
          {loading && <p className="text-center text-white/50 mt-4">Loading PDF...</p>}
        </div>
      ) : (
        <div className={`flex flex-col h-[88vh] rounded-xl overflow-hidden border ${dm ? "border-[#404040]" : "border-gray-300"}`}>
          {/* TOOLBAR */}
          <div className={`flex items-center gap-1 px-3 py-1.5 ${tbg} border-b`}>
            <svg className="w-5 h-5 text-red-500 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z"/></svg>
            <span className={`text-sm font-medium ${tc} truncate max-w-[200px] mr-2`}>{fileName}</span>
            <div className={`w-px h-5 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />

            {/* Navigation */}
            <button onClick={() => scrollToPage(Math.max(1, activePage - 1))} className={bb} title="Previous Page">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
            </button>
            <div className="flex items-center gap-1">
              <input type="number" value={activePage} onChange={e => { const v = Number(e.target.value); if (v >= 1 && v <= totalPages) scrollToPage(v) }}
                className={`w-12 h-7 text-center text-xs rounded border ${dm ? "bg-[#3c3c3c] border-[#555] text-gray-200" : "bg-white border-gray-300 text-gray-700"}`} />
              <span className={`text-xs ${mc}`}>/ {totalPages}</span>
            </div>
            <button onClick={() => scrollToPage(Math.min(totalPages, activePage + 1))} className={bb} title="Next Page">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
            </button>

            <div className={`w-px h-5 mx-1 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />

            {/* Zoom */}
            <button onClick={() => setZoom(z => Math.max(25, z - 25))} className={bb} title="Zoom Out">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"/></svg>
            </button>
            <span className={`text-xs w-12 text-center ${mc}`}>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(300, z + 25))} className={bb} title="Zoom In">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"/></svg>
            </button>
            <button onClick={() => setZoom(100)} className={`${bb} text-[10px]`} title="Reset">Fit</button>

            <div className={`w-px h-5 mx-1 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />

            {/* Search */}
            <button onClick={() => setShowSearch(!showSearch)} className={`${bb} ${showSearch ? (dm ? "bg-[#094771] text-blue-300" : "bg-blue-100 text-blue-600") : ""}`} title="Search (Ctrl+F)">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            </button>

            {/* Thumbnails toggle */}
            <button onClick={() => setShowThumbs(!showThumbs)} className={`${bb} ${showThumbs ? (dm ? "bg-[#094771] text-blue-300" : "bg-blue-100 text-blue-600") : ""}`} title="Thumbnails">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z"/></svg>
            </button>

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
            <button onClick={() => { setPages([]); setTotalPages(0); setPdfDoc(null); setFileName("") }} className={`px-3 py-1 rounded text-xs ${mc} hover:opacity-80`}>Close</button>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div className={`flex items-center gap-2 px-3 py-1.5 ${tbg} border-b`}>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
              <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search in document..." autoFocus
                className={`flex-1 max-w-[300px] h-7 px-2 rounded border text-xs ${dm ? "bg-[#3c3c3c] border-[#555] text-gray-200" : "bg-white border-gray-300 text-gray-700"}`} />
              <button onClick={() => setShowSearch(false)} className={`text-xs ${mc}`}>✕</button>
            </div>
          )}

          {/* MAIN */}
          <div className="flex flex-1 overflow-hidden">
            {/* Thumbnails */}
            {showThumbs && (
              <div className={`w-28 flex-shrink-0 overflow-y-auto border-r p-2 space-y-2 ${dm ? "border-[#404040] bg-[#1e1e1e]" : "border-gray-200 bg-gray-50"}`}>
                {pages.map(pg => (
                  <button key={pg.pageNum} onClick={() => scrollToPage(pg.pageNum)}
                    className={`w-full rounded-lg border-2 overflow-hidden transition-all ${pg.pageNum === activePage ? (dm ? "border-blue-400" : "border-blue-500") : (dm ? "border-[#404040] hover:border-[#555]" : "border-gray-200 hover:border-gray-300")}`}>
                    <img src={pg.imageUrl} alt={`Page ${pg.pageNum}`} className="w-full" />
                    <div className={`text-[9px] text-center py-0.5 ${dm ? "bg-[#252526] text-gray-400" : "bg-gray-100 text-gray-500"}`}>{pg.pageNum}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Pages */}
            <div ref={containerRef} className={`flex-1 overflow-auto ${dm ? "bg-[#1e1e1e]" : "bg-[#e8eaed]"} py-4 flex flex-col items-center gap-4`}>
              {pages.map(pg => (
                <div key={pg.pageNum} id={`pdf-page-${pg.pageNum}`}
                  className="shadow-lg"
                  style={{ width: `${(zoom / 100) * (pg.width / 2)}px` }}>
                  <img src={pg.imageUrl} alt={`Page ${pg.pageNum}`} className="w-full" draggable={false} />
                </div>
              ))}
            </div>
          </div>

          {/* Status bar */}
          <div className={`flex items-center px-3 py-1 ${mbg} border-t text-[10px] ${mc}`}>
            <span>Page {activePage} of {totalPages}</span>
            <div className={`w-px h-3 mx-3 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />
            <span>{fileName}</span>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(z => Math.max(25, z - 25))}>−</button>
              <input type="range" min={25} max={300} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-24 accent-blue-500" />
              <button onClick={() => setZoom(z => Math.min(300, z + 25))}>+</button>
              <span className="w-10 text-center">{zoom}%</span>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
