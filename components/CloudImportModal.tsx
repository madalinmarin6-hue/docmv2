"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

type CloudFile = {
  id: string
  file_name: string
  file_size: number
  file_type: string
  tool_used: string | null
  storage_path: string
  created_at: string
  updated_at: string
}

type Props = {
  open: boolean
  onClose: () => void
  onImport: (file: File) => void
  filterTypes?: string[]
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export default function CloudImportModal({ open, onClose, onImport, filterTypes }: Props) {
  const { status } = useSession()
  const [files, setFiles] = useState<CloudFile[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState<string | null>(null)

  useEffect(() => {
    if (open && status === "authenticated") {
      setLoading(true)
      fetch("/api/cloud").then(r => r.json()).then(d => {
        if (d.files) setFiles(d.files)
      }).catch(() => {}).finally(() => setLoading(false))
    }
  }, [open, status])

  const filtered = filterTypes && filterTypes.length > 0
    ? files.filter(f => filterTypes.some(ft => f.file_type.toLowerCase() === ft.toLowerCase()))
    : files

  async function handleImport(file: CloudFile) {
    setImporting(file.id)
    try {
      const res = await fetch(`/api/cloud/download?fileId=${file.id}`)
      if (res.ok) {
        const blob = await res.blob()
        const imported = new File([blob], file.file_name, { type: blob.type || "application/octet-stream" })
        onImport(imported)
        onClose()
      }
    } catch { /* ignore */ }
    setImporting(null)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[75vh] bg-[#0d1340] border border-white/10 rounded-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" /></svg>
            <h3 className="text-sm font-semibold text-white">Import from Cloud</h3>
            {filterTypes && filterTypes.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/20">
                {filterTypes.map(t => t.toUpperCase()).join(", ")}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {status !== "authenticated" ? (
            <p className="text-center text-white/40 text-sm py-8">Log in to access your cloud files</p>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto mb-3 text-white/10" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" /></svg>
              <p className="text-sm text-white/40">
                {files.length > 0 ? `No ${filterTypes?.map(t => t.toUpperCase()).join("/")} files in your cloud` : "No files in your cloud"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(file => (
                <button key={file.id} onClick={() => handleImport(file)} disabled={importing === file.id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/8 transition text-left disabled:opacity-50">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-[9px]">{file.file_type.toUpperCase().slice(0, 4)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{file.file_name}</p>
                    <p className="text-[11px] text-white/30">{formatSize(file.file_size)} &middot; {file.file_type.toUpperCase()}</p>
                  </div>
                  {importing === file.id ? (
                    <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
