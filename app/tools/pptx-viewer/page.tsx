"use client"

import { useState, useCallback, useRef } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { usePing } from "@/lib/usePing"

export default function PptxViewerPage() {
  usePing()
  const [slides, setSlides] = useState<string[]>([])
  const [activeSlide, setActiveSlide] = useState(0)
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
      const JSZip = (await import("jszip")).default
      const buffer = await file.arrayBuffer()
      const zip = await JSZip.loadAsync(buffer)

      const slideFiles = Object.keys(zip.files)
        .filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0")
          const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0")
          return numA - numB
        })

      const parsed: string[] = []
      for (const sf of slideFiles) {
        const xml = await zip.files[sf].async("text")
        const parser = new DOMParser()
        const doc = parser.parseFromString(xml, "application/xml")
        const texts: string[] = []
        const tNodes = doc.getElementsByTagName("a:t")
        for (let i = 0; i < tNodes.length; i++) {
          const t = tNodes[i].textContent?.trim()
          if (t) texts.push(t)
        }
        const slideHtml = texts.length > 0
          ? texts.map((t, i) => {
              if (i === 0) return `<h2 style="font-size:28px;font-weight:700;color:#1a1a2e;margin-bottom:16px;">${t}</h2>`
              return `<p style="font-size:16px;line-height:1.8;color:#444;margin:6px 0;">${t}</p>`
            }).join("")
          : `<p style="color:#999;font-style:italic;">No text content on this slide</p>`
        parsed.push(slideHtml)
      }

      if (parsed.length === 0) {
        parsed.push(`<p style="color:#999;">Could not extract slide content. The file may use an unsupported format.</p>`)
      }
      setSlides(parsed)
      setActiveSlide(0)
    } catch (err) {
      console.error("Failed to load PPTX:", err)
      setSlides([`<p style="color:red;">Failed to open file: ${err instanceof Error ? err.message : "Unknown error"}</p>`])
    }
    setLoading(false)
  }, [])

  const handleDownload = () => {
    if (!fileRef.current) return
    const url = URL.createObjectURL(fileRef.current)
    const a = document.createElement("a"); a.href = url; a.download = fileName; a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => { setSlides([]); setFileName(""); setActiveSlide(0); fileRef.current = null }

  return (
    <ToolLayout title="PowerPoint Viewer" subtitle="View PowerPoint presentations (.pptx) directly in your browser">
      {slides.length === 0 ? (
        <div>
          <FileUploader
            accept=".pptx,.ppt"
            label="Open a PowerPoint presentation"
            sublabel="Supports .pptx files"
            onFile={loadFile}
            cloudFilterTypes={["pptx", "ppt"]}
          />
          {loading && <p className="text-center text-white/50 mt-4">Loading presentation...</p>}
        </div>
      ) : (
        <div className={`flex flex-col h-[88vh] rounded-xl overflow-hidden border ${dm ? "border-[#404040]" : "border-gray-300"}`}>
          {/* TOOLBAR */}
          <div className={`flex items-center gap-1 px-3 py-1.5 ${tbg} border-b`}>
            <svg className="w-5 h-5 text-orange-500 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z"/></svg>
            <span className={`text-sm font-medium ${tc} truncate max-w-[200px] mr-2`}>{fileName}</span>
            <div className={`w-px h-5 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />
            <button onClick={() => setActiveSlide(s => Math.max(0, s - 1))} disabled={activeSlide <= 0} className={`${bb} disabled:opacity-30`} title="Previous">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <span className={`text-xs ${mc} min-w-[60px] text-center`}>{activeSlide + 1} / {slides.length}</span>
            <button onClick={() => setActiveSlide(s => Math.min(slides.length - 1, s + 1))} disabled={activeSlide >= slides.length - 1} className={`${bb} disabled:opacity-30`} title="Next">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
            <div className={`w-px h-5 mx-1 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />
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

          {/* SLIDE + SIDEBAR */}
          <div className="flex flex-1 overflow-hidden">
            {/* Slide thumbnails */}
            <div className={`w-32 flex-shrink-0 overflow-y-auto p-2 space-y-2 ${dm ? "bg-[#1e1e1e] border-r border-[#404040]" : "bg-[#f0f0f0] border-r border-gray-200"}`}>
              {slides.map((_, i) => (
                <button key={i} onClick={() => setActiveSlide(i)}
                  className={`w-full aspect-[4/3] rounded-lg flex items-center justify-center text-xs font-medium transition border-2 ${i === activeSlide ? "border-orange-400 bg-orange-500/10 text-orange-300" : dm ? "border-[#404040] bg-[#252526] text-gray-500 hover:border-gray-500" : "border-gray-300 bg-white text-gray-400 hover:border-gray-400"}`}>
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Main slide */}
            <div className={`flex-1 overflow-auto ${dm ? "bg-[#1e1e1e]" : "bg-[#e8eaed]"} flex items-center justify-center p-6`}>
              <div
                className="bg-white shadow-xl rounded-lg"
                style={{
                  width: `${(zoom / 100) * 900}px`,
                  minHeight: `${(zoom / 100) * 506}px`,
                  padding: `${(zoom / 100) * 48}px`,
                  fontSize: `${(zoom / 100) * 14}px`,
                }}
                dangerouslySetInnerHTML={{ __html: slides[activeSlide] || "" }}
              />
            </div>
          </div>

          {/* STATUS BAR */}
          <div className={`flex items-center px-3 py-1 ${mbg} border-t text-[10px] ${mc}`}>
            <span>Slide {activeSlide + 1} of {slides.length}</span>
            <div className={`w-px h-3 mx-3 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />
            <span>{fileName}</span>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(z => Math.max(50, z - 25))}>−</button>
              <input type="range" min={50} max={200} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-24 accent-orange-500" />
              <button onClick={() => setZoom(z => Math.min(200, z + 25))}>+</button>
              <span className="w-10 text-center">{zoom}%</span>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
