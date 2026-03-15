"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useApp } from "@/components/AppContext"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

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

const toolMap: Record<string, { label: string; href: string; color: string }> = {
  "pdf-editor": { label: "PDF Editor", href: "/tools/pdf-editor", color: "from-red-500 to-rose-500" },
  "word-editor": { label: "Word Editor", href: "/tools/word-editor", color: "from-blue-500 to-cyan-500" },
  "excel-editor": { label: "Excel Editor", href: "/tools/excel-editor", color: "from-green-500 to-emerald-500" },
  "powerpoint-editor": { label: "PowerPoint", href: "/tools/powerpoint-editor", color: "from-orange-500 to-amber-500" },
  "txt-editor": { label: "TXT Editor", href: "/tools/txt-editor", color: "from-gray-500 to-slate-500" },
  "csv-editor": { label: "CSV Editor", href: "/tools/csv-editor", color: "from-teal-500 to-cyan-500" },
  "pdf-creator": { label: "PDF Creator", href: "/tools/pdf-creator", color: "from-purple-500 to-violet-500" },
  "remove-bg": { label: "Remove BG", href: "/tools/remove-bg", color: "from-fuchsia-500 to-pink-500" },
  "compress": { label: "Compress", href: "/tools/compress", color: "from-indigo-500 to-blue-500" },
  "ocr": { label: "OCR", href: "/tools/ocr", color: "from-yellow-500 to-orange-500" },
  "split-pdf": { label: "Split PDF", href: "/tools/split-pdf", color: "from-pink-500 to-rose-500" },
  "convert-pdf-word": { label: "PDF → Word", href: "/convert/pdf-to-word", color: "from-blue-500 to-indigo-500" },
  "convert-word-pdf": { label: "Word → PDF", href: "/convert/word-to-pdf", color: "from-red-500 to-rose-500" },
  "convert-pdf-excel": { label: "PDF → Excel", href: "/convert/pdf-to-excel", color: "from-green-500 to-emerald-500" },
  "convert-excel-pdf": { label: "Excel → PDF", href: "/convert/excel-to-pdf", color: "from-red-500 to-rose-500" },
  "convert-pdf-pptx": { label: "PDF → PPTX", href: "/convert/pdf-to-pptx", color: "from-orange-500 to-amber-500" },
  "convert-pptx-pdf": { label: "PPTX → PDF", href: "/convert/pptx-to-pdf", color: "from-red-500 to-rose-500" },
  "convert-pdf-jpg": { label: "PDF → JPG", href: "/convert/pdf-to-jpg", color: "from-amber-500 to-yellow-500" },
  "convert-jpg-pdf": { label: "JPG → PDF", href: "/convert/jpg-to-pdf", color: "from-red-500 to-rose-500" },
  "convert-pdf-png": { label: "PDF → PNG", href: "/convert/pdf-to-png", color: "from-amber-500 to-yellow-500" },
  "convert-png-pdf": { label: "PNG → PDF", href: "/convert/png-to-pdf", color: "from-red-500 to-rose-500" },
  "convert-pdf-txt": { label: "PDF → TXT", href: "/convert/pdf-to-txt", color: "from-gray-500 to-slate-500" },
  "convert-txt-pdf": { label: "TXT → PDF", href: "/convert/txt-to-pdf", color: "from-red-500 to-rose-500" },
  "convert-pdf-html": { label: "PDF → HTML", href: "/convert/pdf-to-html", color: "from-cyan-500 to-blue-500" },
  "convert-html-pdf": { label: "HTML → PDF", href: "/convert/html-to-pdf", color: "from-red-500 to-rose-500" },
}

const convertOptions = [
  { label: "PDF \u2192 Word", href: "/convert/pdf-to-word" },
  { label: "Word \u2192 PDF", href: "/convert/word-to-pdf" },
  { label: "PDF \u2192 Excel", href: "/convert/pdf-to-excel" },
  { label: "PDF \u2192 JPG", href: "/convert/pdf-to-jpg" },
  { label: "JPG \u2192 PDF", href: "/convert/jpg-to-pdf" },
]

const toolOptions = [
  { label: "PDF Editor", href: "/tools/pdf-editor" },
  { label: "Word Editor", href: "/tools/word-editor" },
  { label: "Compress", href: "/tools/compress" },
  { label: "Remove BG", href: "/tools/remove-bg" },
  { label: "OCR", href: "/tools/ocr" },
]

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

function getDayLabel(d: string) {
  const date = new Date(d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const fileDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = Math.floor((today.getTime() - fileDay.getTime()) / 86400000)
  if (diff === 0) return "Today"
  if (diff === 1) return "Yesterday"
  if (diff < 7) return `${diff} days ago`
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function daysUntilExpiry(d: string) {
  const created = new Date(d)
  const expiry = new Date(created.getTime() + 30 * 86400000)
  const now = new Date()
  return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / 86400000))
}

function getFileIcon(type: string) {
  const t = type.toLowerCase()
  if (t === "pdf") return { label: "PDF", color: "from-red-500 to-rose-500" }
  if (t === "docx") return { label: "DOCX", color: "from-blue-500 to-cyan-500" }
  if (t === "doc") return { label: "DOC", color: "from-blue-500 to-cyan-500" }
  if (t === "xlsx") return { label: "XLSX", color: "from-green-500 to-emerald-500" }
  if (t === "xls") return { label: "XLS", color: "from-green-500 to-emerald-500" }
  if (t === "pptx") return { label: "PPTX", color: "from-orange-500 to-amber-500" }
  if (t === "ppt") return { label: "PPT", color: "from-orange-500 to-amber-500" }
  if (t === "txt") return { label: "TXT", color: "from-gray-500 to-slate-500" }
  if (t === "md") return { label: "MD", color: "from-gray-500 to-slate-500" }
  if (t === "csv") return { label: "CSV", color: "from-teal-500 to-cyan-500" }
  if (t === "jpg" || t === "jpeg") return { label: "JPG", color: "from-fuchsia-500 to-pink-500" }
  if (t === "png") return { label: "PNG", color: "from-fuchsia-500 to-pink-500" }
  if (t === "webp") return { label: "WEBP", color: "from-fuchsia-500 to-pink-500" }
  if (t === "gif") return { label: "GIF", color: "from-fuchsia-500 to-pink-500" }
  if (t === "bmp") return { label: "BMP", color: "from-fuchsia-500 to-pink-500" }
  if (t === "svg") return { label: "SVG", color: "from-fuchsia-500 to-pink-500" }
  if (t === "json") return { label: "JSON", color: "from-yellow-500 to-orange-500" }
  if (t === "zip") return { label: "ZIP", color: "from-indigo-500 to-blue-500" }
  return { label: t.toUpperCase().slice(0, 4), color: "from-purple-500 to-violet-500" }
}

function getExpiryStyle(days: number) {
  if (days > 20) return { text: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-400/30" }
  if (days > 10) return { text: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-400/30" }
  return { text: "text-red-400", bg: "bg-red-500/15", border: "border-red-400/30" }
}

function getExpiryStyleClassic(days: number) {
  if (days > 20) return { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" }
  if (days > 10) return { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" }
  return { text: "text-red-600", bg: "bg-red-50", border: "border-red-200" }
}

const fileTypeFilters = [
  { key: "all", label: "All" },
  { key: "pdf", label: "PDF" },
  { key: "word", label: "Word", types: ["doc", "docx"] },
  { key: "excel", label: "Excel", types: ["xls", "xlsx"] },
  { key: "ppt", label: "PowerPoint", types: ["ppt", "pptx"] },
  { key: "image", label: "Images", types: ["jpg", "jpeg", "png", "webp", "bmp", "gif", "svg"] },
  { key: "text", label: "Text", types: ["txt", "md", "csv", "json"] },
]

function groupByDay(files: CloudFile[]) {
  const groups: { label: string; files: CloudFile[] }[] = []
  const map = new Map<string, CloudFile[]>()
  for (const f of files) {
    const key = getDayLabel(f.updated_at)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(f)
  }
  map.forEach((files, label) => groups.push({ label, files }))
  return groups
}

export default function CloudPage() {
  const { lang, setLang, classicMode, setClassicMode } = useApp()
  const { status } = useSession()
  const [files, setFiles] = useState<CloudFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload progress
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; name: string } | null>(null)

  // Delete confirmation (3-second wait)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; timer: number } | null>(null)
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Multi-select
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [batchDeleting, setBatchDeleting] = useState(false)

  // Rename
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  // View modal
  const [viewing, setViewing] = useState<CloudFile | null>(null)
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const cm = classicMode

  useEffect(() => {
    if (status === "authenticated") fetchFiles()
  }, [status])

  async function fetchFiles() {
    setLoading(true)
    try {
      const res = await fetch("/api/cloud")
      const data = await res.json()
      if (data.files) setFiles(data.files)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    setError("")
    const total = fileList.length

    for (let i = 0; i < total; i++) {
      const f = fileList[i]
      setUploadProgress({ current: i + 1, total, name: f.name })
      const formData = new FormData()
      formData.append("file", f)
      try {
        const res = await fetch("/api/cloud", { method: "POST", body: formData })
        const data = await res.json()
        if (!res.ok) setError(data.error || "Upload failed")
      } catch {
        setError("Upload failed")
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = ""
    setUploadProgress(null)
    fetchFiles()
  }

  // Delete with 3-second confirmation
  function handleDeleteClick(fileId: string) {
    if (deleteConfirm?.id === fileId && deleteConfirm.timer <= 0) {
      // Second click — actually delete
      doDelete(fileId)
      setDeleteConfirm(null)
      if (deleteTimerRef.current) clearInterval(deleteTimerRef.current)
      return
    }
    // First click — start 3s countdown
    if (deleteTimerRef.current) clearInterval(deleteTimerRef.current)
    setDeleteConfirm({ id: fileId, timer: 3 })
    const iv = setInterval(() => {
      setDeleteConfirm(prev => {
        if (!prev || prev.id !== fileId) { clearInterval(iv); return prev }
        if (prev.timer <= 1) return { ...prev, timer: 0 }
        return { ...prev, timer: prev.timer - 1 }
      })
    }, 1000)
    deleteTimerRef.current = iv
    // Auto-cancel after 6 seconds if not confirmed
    setTimeout(() => { clearInterval(iv); setDeleteConfirm(prev => prev?.id === fileId ? null : prev) }, 6000)
  }

  async function doDelete(fileId: string) {
    try {
      await fetch("/api/cloud", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileId }) })
    } catch { /* ignore */ }
    setSelected(prev => { const n = new Set(prev); n.delete(fileId); return n })
    fetchFiles()
  }

  // Batch delete
  async function handleBatchDelete() {
    if (selected.size === 0) return
    setBatchDeleting(true)
    for (const id of selected) {
      try {
        await fetch("/api/cloud", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileId: id }) })
      } catch { /* ignore */ }
    }
    setSelected(new Set())
    setBatchDeleting(false)
    fetchFiles()
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function selectAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(f => f.id)))
  }

  async function handleDownload(file: CloudFile) {
    try {
      const res = await fetch(`/api/cloud/download?fileId=${file.id}`)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.file_name
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* ignore */ }
  }

  // Rename
  async function handleRename(fileId: string) {
    if (!renameValue.trim()) { setRenaming(null); return }
    try {
      await fetch("/api/cloud/rename", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileId, newName: renameValue.trim() }) })
    } catch { /* ignore */ }
    setRenaming(null)
    fetchFiles()
  }

  // View file
  async function handleView(file: CloudFile) {
    setViewing(file)
    setViewLoading(true)
    setViewUrl(null)
    try {
      const res = await fetch(`/api/cloud/download?fileId=${file.id}`)
      if (res.ok) {
        const blob = await res.blob()
        setViewUrl(URL.createObjectURL(blob))
      }
    } catch { /* ignore */ }
    setViewLoading(false)
  }

  function closeView() {
    if (viewUrl) URL.revokeObjectURL(viewUrl)
    setViewing(null)
    setViewUrl(null)
  }

  const typeFiltered = typeFilter === "all" ? files : files.filter(f => {
    const ft = f.file_type.toLowerCase()
    const filter = fileTypeFilters.find(x => x.key === typeFilter)
    if (!filter) return true
    if (filter.key === "pdf") return ft === "pdf"
    return filter.types?.includes(ft) ?? true
  })

  const filtered = search
    ? typeFiltered.filter(f => f.file_name.toLowerCase().includes(search.toLowerCase()) || f.file_type.toLowerCase().includes(search.toLowerCase()))
    : typeFiltered

  const totalUsage = files.reduce((sum, f) => sum + f.file_size, 0)
  const dayGroups = groupByDay(filtered)

  if (status === "loading") {
    return (
      <div className={`min-h-screen flex items-center justify-center ${cm ? "bg-[#f0f2f5]" : "bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e]"}`}>
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${cm ? "bg-[#f0f2f5] text-gray-900" : "bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e] text-white"}`}>
        <div className={`max-w-md w-full rounded-2xl p-8 text-center space-y-6 ${cm ? "bg-white border border-gray-200 shadow-lg" : "bg-white/5 border border-white/10 backdrop-blur-xl"}`}>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" /></svg>
          </div>
          <div>
            <h2 className={`text-2xl font-bold mb-2 ${cm ? "text-gray-900" : ""}`}>Cloud Storage</h2>
            <p className={`text-sm ${cm ? "text-gray-500" : "text-white/50"}`}>Log in to access your cloud files and storage.</p>
          </div>
          <Link href="/auth/login" className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20 block">
            Log In
          </Link>
        </div>
      </div>
    )
  }

  const isImage = (t: string) => ["jpg", "jpeg", "png", "webp", "bmp", "gif", "svg"].includes(t.toLowerCase())
  const isText = (t: string) => ["txt", "csv", "md", "json"].includes(t.toLowerCase())
  const isPdf = (t: string) => t.toLowerCase() === "pdf"

  return (
    <div className={`min-h-screen ${cm ? "bg-[#f0f2f5] text-gray-900" : "bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e] text-white"}`}>
      <Navbar lang={lang} setLang={setLang} classicMode={classicMode} setClassicMode={setClassicMode} />

      <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-6">
          <h1 className={`text-3xl font-bold ${cm ? "text-gray-900" : "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"}`}>
            My Cloud Files
          </h1>
          <p className={`text-sm mt-1 ${cm ? "text-gray-500" : "text-white/40"}`}>
            {files.length} file{files.length !== 1 ? "s" : ""} &middot; {formatSize(totalUsage)} used
          </p>
        </div>

        {/* SEARCH + UPLOAD + FILTER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${cm ? "text-gray-300" : "text-white/30"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files..."
                className={`pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition w-48 ${cm ? "bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400" : "bg-white/5 border border-white/10 text-white placeholder:text-white/30"}`} />
            </div>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.json,.xml,.html,.css,.jpg,.jpeg,.png,.webp,.bmp,.gif,.svg,.zip,.rar,.7z,.mp3,.mp4,.wav,.ogg,.yaml,.yml,.sql,.py,.ts,.js,.tsx,.jsx,.java,.cpp,.c,.h,.php,.rb,.go,.rs" />
            <button onClick={() => fileInputRef.current?.click()} disabled={!!uploadProgress}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              Upload
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {fileTypeFilters.map(f => (
              <button key={f.key} onClick={() => setTypeFilter(f.key)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${typeFilter === f.key ? cm ? "bg-blue-100 text-blue-700 border border-blue-300" : "bg-blue-500/20 text-blue-300 border border-blue-400/30" : cm ? "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200" : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 30-DAY NOTICE */}
        <div className={`mb-6 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs ${cm ? "bg-amber-50 border border-amber-200 text-amber-700" : "bg-amber-500/10 border border-amber-400/20 text-amber-300"}`}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          Files are stored for 30 days. After that, they are automatically deleted. Download important files to keep them permanently.
        </div>

        {/* UPLOAD PROGRESS */}
        {uploadProgress && (
          <div className={`mb-6 p-4 rounded-xl ${cm ? "bg-white border border-gray-200" : "bg-white/5 border border-white/10"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${cm ? "text-gray-900" : ""}`}>Uploading {uploadProgress.current}/{uploadProgress.total}</span>
              <span className={`text-xs ${cm ? "text-gray-400" : "text-white/40"}`}>{uploadProgress.name}</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${cm ? "bg-gray-100" : "bg-white/10"}`}>
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className={`mb-6 p-3 rounded-xl text-sm text-center ${cm ? "bg-red-50 border border-red-200 text-red-600" : "bg-red-500/10 border border-red-400/20 text-red-300"}`}>{error}</div>
        )}

        {/* BATCH ACTIONS BAR */}
        {selected.size > 0 && (
          <div className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-xl ${cm ? "bg-blue-50 border border-blue-200" : "bg-blue-500/10 border border-blue-400/20"}`}>
            <span className={`text-sm font-medium ${cm ? "text-blue-700" : "text-blue-300"}`}>{selected.size} selected</span>
            <button onClick={selectAll} className={`text-xs px-3 py-1 rounded-lg transition ${cm ? "bg-white text-gray-600 hover:bg-gray-50" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
              {selected.size === filtered.length ? "Deselect All" : "Select All"}
            </button>
            <div className="flex-1" />
            <button onClick={handleBatchDelete} disabled={batchDeleting}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition disabled:opacity-50">
              {batchDeleting ? "Deleting..." : `Delete ${selected.size} file${selected.size > 1 ? "s" : ""}`}
            </button>
          </div>
        )}

        {/* QUICK LINKS */}
        <div className={`mb-6 flex flex-wrap gap-2`}>
          <span className={`text-xs font-medium self-center mr-1 ${cm ? "text-gray-400" : "text-white/30"}`}>Quick:</span>
          {convertOptions.map(c => (
            <Link key={c.href} href={c.href} className={`px-3 py-1 rounded-lg text-[11px] font-medium transition ${cm ? "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600" : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"}`}>{c.label}</Link>
          ))}
          <span className={`text-xs ${cm ? "text-gray-300" : "text-white/10"}`}>|</span>
          {toolOptions.map(t => (
            <Link key={t.href} href={t.href} className={`px-3 py-1 rounded-lg text-[11px] font-medium transition ${cm ? "bg-white border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600" : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"}`}>{t.label}</Link>
          ))}
        </div>

        {/* FILES */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-20 rounded-2xl ${cm ? "bg-white border border-gray-200" : "bg-white/5 border border-white/10"}`}>
            <svg className={`w-16 h-16 mx-auto mb-4 ${cm ? "text-gray-200" : "text-white/10"}`} fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" /></svg>
            <p className={`text-lg font-semibold mb-2 ${cm ? "text-gray-900" : ""}`}>{search ? "No files match your search" : "No files yet"}</p>
            <p className={`text-sm mb-6 ${cm ? "text-gray-400" : "text-white/40"}`}>{search ? "Try a different search term" : "Upload files or save them from any editing tool"}</p>
            {!search && (
              <button onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 active:scale-95 transition-all">
                Upload Your First File
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {dayGroups.map(group => (
              <div key={group.label}>
                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${cm ? "text-gray-500" : "text-white/40"}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                  {group.label}
                  <span className={`text-[10px] font-normal ${cm ? "text-gray-300" : "text-white/20"}`}>({group.files.length})</span>
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.files.map(file => {
                    const icon = getFileIcon(file.file_type)
                    const tool = file.tool_used ? toolMap[file.tool_used] : null
                    const isSelected = selected.has(file.id)
                    const isDelConfirm = deleteConfirm?.id === file.id
                    const delReady = isDelConfirm && deleteConfirm!.timer <= 0
                    const expDays = daysUntilExpiry(file.created_at)
                    return (
                      <div key={file.id} onClick={(e) => { if ((e.target as HTMLElement).closest('button, a, input, form')) return; toggleSelect(file.id) }}
                        className={`p-4 rounded-2xl transition group relative cursor-pointer ${isSelected ? cm ? "bg-blue-50 border-2 border-blue-400" : "bg-blue-500/10 border-2 border-blue-400/40" : cm ? "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md" : "bg-white/5 border border-white/10 hover:border-white/20"}`}>

                        {/* SELECT CHECKBOX */}
                        <button onClick={(e) => { e.stopPropagation(); toggleSelect(file.id) }} className={`absolute top-3 right-3 w-5 h-5 rounded border-2 flex items-center justify-center transition ${isSelected ? "bg-blue-500 border-blue-500 text-white" : cm ? "border-gray-300 hover:border-gray-400" : "border-white/20 hover:border-white/40"}`}>
                          {isSelected && <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                        </button>

                        {/* FILE INFO */}
                        <div className="flex items-start gap-3 mb-2 pr-6">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${icon.color} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white font-extrabold" style={{ fontSize: icon.label.length > 3 ? '8px' : '10px' }}>{icon.label}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {renaming === file.id && selected.size === 0 ? (
                              <form onSubmit={e => { e.preventDefault(); handleRename(file.id) }} className="flex gap-1">
                                <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
                                  className={`flex-1 px-2 py-0.5 rounded text-sm outline-none ${cm ? "bg-gray-100 border border-gray-200" : "bg-white/10 border border-white/20 text-white"}`}
                                  onBlur={() => handleRename(file.id)} />
                              </form>
                            ) : (
                              <p className={`text-sm font-medium truncate ${selected.size === 0 ? "cursor-pointer hover:underline" : ""} ${cm ? "text-gray-900" : ""}`}
                                onClick={(e) => { if (selected.size > 0) { e.stopPropagation(); toggleSelect(file.id); return; } setRenaming(file.id); setRenameValue(file.file_name) }}
                                title={selected.size > 0 ? "Click to select" : "Click to rename"}>
                                {file.file_name}
                              </p>
                            )}
                            <p className={`text-[11px] ${cm ? "text-gray-400" : "text-white/30"}`}>
                              {formatSize(file.file_size)} &middot; {file.file_type.toUpperCase()} &middot; {formatTime(file.updated_at)}
                            </p>
                          </div>
                        </div>

                        {/* META ROW */}
                        <div className={`flex items-center gap-2 text-[10px] mb-3 ${cm ? "text-gray-400" : "text-white/30"}`}>
                          {tool && <span className={`inline-block px-2 py-0.5 rounded-full bg-gradient-to-r ${tool.color} text-white text-[9px] font-medium`}>{tool.label}</span>}
                          {(() => { const es = cm ? getExpiryStyleClassic(expDays) : getExpiryStyle(expDays); return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${es.text} ${es.bg} ${es.border}`}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {expDays}d left
                            </span>
                          ) })()}
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex gap-1.5 flex-wrap">
                          <button onClick={() => handleView(file)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition ${cm ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"}`}>
                            View
                          </button>
                          <button onClick={() => handleDownload(file)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition ${cm ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
                            Download
                          </button>
                          {tool && (
                            <Link href={tool.href}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition ${cm ? "bg-purple-50 text-purple-600 hover:bg-purple-100" : "bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"}`}>
                              Re-edit
                            </Link>
                          )}
                          {selected.size === 0 && (
                          <button onClick={() => { setRenaming(file.id); setRenameValue(file.file_name) }}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition ${cm ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-white/5 text-white/50 hover:bg-white/10"}`}>
                            Rename
                          </button>
                          )}
                          <button onClick={() => handleDeleteClick(file.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition ${isDelConfirm ? delReady ? "bg-red-500 text-white animate-pulse" : cm ? "bg-red-100 text-red-500" : "bg-red-500/20 text-red-400" : cm ? "text-red-400 hover:bg-red-50" : "text-red-400/50 hover:bg-red-500/10"}`}>
                            {isDelConfirm ? (delReady ? "Confirm Delete" : `Wait ${deleteConfirm!.timer}s...`) : "Delete"}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={closeView}>
          <div className="w-full max-w-3xl max-h-[85vh] bg-[#0d1340] border border-white/10 rounded-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white truncate">{viewing.file_name}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownload(viewing)} className="px-3 py-1 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition">Download</button>
                <button onClick={closeView} className="text-white/40 hover:text-white/70 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {viewLoading ? (
                <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              ) : viewUrl ? (
                isImage(viewing.file_type) ? (
                  <img src={viewUrl} alt={viewing.file_name} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
                ) : isPdf(viewing.file_type) ? (
                  <iframe src={viewUrl} className="w-full h-[70vh] rounded-lg border border-white/10" />
                ) : isText(viewing.file_type) ? (
                  <TextPreview url={viewUrl} />
                ) : (
                  <div className="text-center text-white/40 space-y-3">
                    <svg className="w-16 h-16 mx-auto text-white/10" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    <p className="text-sm">Preview not available for this file type</p>
                    <p className="text-xs">Download the file to view its contents</p>
                  </div>
                )
              ) : (
                <p className="text-white/40 text-sm">Failed to load file</p>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer lang={lang} classicMode={classicMode} />
    </div>
  )
}

function TextPreview({ url }: { url: string }) {
  const [text, setText] = useState("")
  useEffect(() => {
    fetch(url).then(r => r.text()).then(setText).catch(() => setText("Failed to load"))
  }, [url])
  return <pre className="w-full max-h-[70vh] overflow-auto text-xs text-white/70 bg-white/5 rounded-lg p-4 whitespace-pre-wrap font-mono">{text}</pre>
}
