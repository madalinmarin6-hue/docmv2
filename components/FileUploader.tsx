"use client"

import { useCallback, useState } from "react"
import CloudImportModal from "./CloudImportModal"

type Props = {
  accept: string
  label: string
  sublabel?: string
  onFile: (file: File) => void
  cloudFilterTypes?: string[]
}

export default function FileUploader({ accept, label, sublabel, onFile, cloudFilterTypes }: Props) {
  const [dragging, setDragging] = useState(false)
  const [showCloud, setShowCloud] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }, [onFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }, [onFile])

  return (
    <>
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer group
        ${dragging ? "border-blue-400 bg-blue-500/10 scale-[1.02]" : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/8"}`}
    >
      <input type="file" accept={accept} onChange={handleChange} className="absolute inset-0 opacity-0 cursor-pointer" />

      <div className="flex flex-col items-center gap-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${dragging ? "bg-blue-500/20 scale-110" : "bg-white/5 group-hover:bg-white/10"}`}>
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
        </div>

        <div>
          <p className="text-lg font-semibold text-white">{label}</p>
          {sublabel && <p className="text-sm text-white/40 mt-1">{sublabel}</p>}
        </div>

        <p className="text-xs text-white/30">Drag & drop or click to browse</p>
      </div>
    </div>

    {/* Import from Cloud button */}
    <div className="flex justify-center mt-3">
      <button onClick={() => setShowCloud(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-purple-500/10 border border-purple-400/20 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400/30 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" /></svg>
        Import from Cloud
      </button>
    </div>

    <CloudImportModal open={showCloud} onClose={() => setShowCloud(false)} onImport={onFile} filterTypes={cloudFilterTypes} />
    </>
  )
}
