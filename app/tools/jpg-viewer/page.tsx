"use client"

import { useState, useCallback, useRef } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { usePing } from "@/lib/usePing"

export default function JpgViewerPage() {
  usePing()
  const [imageUrl, setImageUrl] = useState("")
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState(0)
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 })
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
    setFileName(file.name)
    setFileSize(file.size)
    fileRef.current = file
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    const img = new Image()
    img.onload = () => setDimensions({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
  }, [])

  const handleDownload = () => {
    if (!fileRef.current) return
    const url = URL.createObjectURL(fileRef.current)
    const a = document.createElement("a"); a.href = url; a.download = fileName; a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(""); setFileName(""); setFileSize(0); setDimensions({ w: 0, h: 0 }); fileRef.current = null
  }

  return (
    <ToolLayout title="JPG Viewer" subtitle="View JPG/JPEG images directly in your browser">
      {!imageUrl ? (
        <FileUploader
          accept=".jpg,.jpeg"
          label="Open a JPG image"
          sublabel="Supports .jpg, .jpeg files"
          onFile={loadFile}
          cloudFilterTypes={["jpg", "jpeg"]}
        />
      ) : (
        <div className={`flex flex-col h-[88vh] rounded-xl overflow-hidden border ${dm ? "border-[#404040]" : "border-gray-300"}`}>
          <div className={`flex items-center gap-1 px-3 py-1.5 ${tbg} border-b`}>
            <svg className="w-5 h-5 text-purple-500 mr-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
            <span className={`text-sm font-medium ${tc} truncate max-w-[200px] mr-2`}>{fileName}</span>
            <div className={`w-px h-5 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />
            <button onClick={() => setZoom(z => Math.max(10, z - 25))} className={bb} title="Zoom Out">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"/></svg>
            </button>
            <span className={`text-xs w-12 text-center ${mc}`}>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(400, z + 25))} className={bb} title="Zoom In">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"/></svg>
            </button>
            <button onClick={() => setZoom(100)} className={`${bb} text-[10px]`} title="Reset">Fit</button>
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

          <div className={`flex-1 overflow-auto ${dm ? "bg-[#1e1e1e]" : "bg-[#e8eaed]"} flex items-center justify-center p-4`}>
            <img src={imageUrl} alt={fileName} style={{ width: `${zoom}%`, maxWidth: "none", height: "auto" }} className="rounded shadow-lg" />
          </div>

          <div className={`flex items-center px-3 py-1 ${mbg} border-t text-[10px] ${mc}`}>
            <span>{dimensions.w} × {dimensions.h} px</span>
            <div className={`w-px h-3 mx-3 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />
            <span>{(fileSize / 1024).toFixed(1)} KB</span>
            <div className={`w-px h-3 mx-3 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />
            <span>{fileName}</span>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(z => Math.max(10, z - 25))}>−</button>
              <input type="range" min={10} max={400} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-24 accent-purple-500" />
              <button onClick={() => setZoom(z => Math.min(400, z + 25))}>+</button>
              <span className="w-10 text-center">{zoom}%</span>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
