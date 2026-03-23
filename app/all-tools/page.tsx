"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useApp } from "@/components/AppContext"
import { usePing } from "@/lib/usePing"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import ScrollTop from "@/components/ScrollTop"

type ToolItem = { href: string; en: string; ro: string }
type Section = { id: string; en: string; ro: string; color: string; border: string; hex: string; items: ToolItem[] }

const defaultSections: Section[] = [
  {
    id: "viewers", en: "Viewers", ro: "Vizualizatoare", color: "from-cyan-500 to-blue-500", border: "border-cyan-400/30", hex: "#22d3ee",
    items: [
      { href: "/tools/pdf-viewer", en: "PDF Viewer", ro: "Vizualizator PDF" },
      { href: "/tools/word-viewer", en: "Word Viewer", ro: "Vizualizator Word" },
      { href: "/tools/excel-viewer", en: "Excel Viewer", ro: "Vizualizator Excel" },
      { href: "/tools/pptx-viewer", en: "PowerPoint Viewer", ro: "Vizualizator PowerPoint" },
      { href: "/tools/image-viewer", en: "Image Viewer", ro: "Vizualizator Imagini" },
    ],
  },
  {
    id: "pdf-tools", en: "PDF Tools", ro: "Instrumente PDF", color: "from-red-500 to-rose-500", border: "border-red-400/30", hex: "#f87171",
    items: [
      { href: "/tools/pdf-editor", en: "PDF Editor", ro: "Editor PDF" },
      { href: "/tools/pdf-creator", en: "PDF Creator", ro: "Creator PDF" },
      { href: "/tools/split-pdf", en: "Split PDF", ro: "Împarte PDF" },
      { href: "/tools/merge-pdf", en: "Merge PDF", ro: "Unește PDF" },
      { href: "/tools/rotate-pdf", en: "Rotate PDF", ro: "Rotește PDF" },
      { href: "/tools/compress", en: "Compress", ro: "Comprimă" },
      { href: "/tools/watermark", en: "Add Watermark", ro: "Adaugă Watermark" },
      { href: "/tools/encrypt-pdf", en: "Encrypt / Decrypt", ro: "Criptare / Decriptare" },
      { href: "/tools/extract-images", en: "Extract Images", ro: "Extrage Imagini" },
      { href: "/tools/delete-pages", en: "Delete Pages", ro: "Șterge Pagini" },
      { href: "/tools/extract-pages", en: "Extract Pages", ro: "Extrage Pagini" },
      { href: "/tools/reorganize-pdf", en: "Reorganize Pages", ro: "Reorganizează Pagini" },
      { href: "/tools/sign-pdf", en: "Sign PDF", ro: "Semnează PDF" },
      { href: "/tools/stamp", en: "Add Stamp", ro: "Adaugă Ștampilă" },
      { href: "/tools/header-footer", en: "Header & Footer", ro: "Antet & Subsol" },
      { href: "/tools/flatten-pdf", en: "Flatten PDF", ro: "Aplatizează PDF" },
      { href: "/tools/repair-pdf", en: "Repair PDF", ro: "Repară PDF" },
      { href: "/tools/compare-pdf", en: "Compare PDFs", ro: "Compară PDF-uri" },
      { href: "/tools/edit-metadata", en: "Edit Metadata", ro: "Editează Metadata" },
      { href: "/tools/pdf-info", en: "PDF Info", ro: "Info PDF" },
    ],
  },
  {
    id: "editors", en: "Document Editors", ro: "Editoare Documente", color: "from-purple-500 to-indigo-500", border: "border-purple-400/30", hex: "#a78bfa",
    items: [
      { href: "/tools/word-editor", en: "Word Editor", ro: "Editor Word" },
      { href: "/tools/excel-editor", en: "Excel Editor", ro: "Editor Excel" },
      { href: "/tools/powerpoint-editor", en: "PowerPoint Editor", ro: "Editor PowerPoint" },
      { href: "/tools/txt-editor", en: "TXT Editor", ro: "Editor TXT" },
      { href: "/tools/csv-editor", en: "CSV Editor", ro: "Editor CSV" },
    ],
  },
  {
    id: "utilities", en: "Utilities", ro: "Utilități", color: "from-emerald-500 to-teal-500", border: "border-emerald-400/30", hex: "#34d399",
    items: [
      { href: "/tools/ocr", en: "OCR (Image → Text)", ro: "OCR (Imagine → Text)" },
      { href: "/tools/remove-bg", en: "Remove Background", ro: "Elimină Fundal" },
      { href: "/tools/adjust-colors", en: "Adjust Colors", ro: "Ajustează Culori" },
      { href: "/tools/background-color", en: "Background Color", ro: "Culoare Fundal" },
      { href: "/tools/scanner-effect", en: "Scanner Effect", ro: "Efect Scanner" },
      { href: "/tools/rasterize-pdf", en: "Rasterize PDF", ro: "Rasterizează PDF" },
    ],
  },
  {
    id: "from-pdf", en: "Convert from PDF", ro: "Conversie din PDF", color: "from-blue-500 to-cyan-500", border: "border-blue-400/30", hex: "#60a5fa",
    items: [
      { href: "/convert/pdf-to-word", en: "PDF → Word", ro: "PDF → Word" },
      { href: "/convert/pdf-to-excel", en: "PDF → Excel", ro: "PDF → Excel" },
      { href: "/convert/pdf-to-pptx", en: "PDF → PPTX", ro: "PDF → PPTX" },
      { href: "/convert/pdf-to-jpg", en: "PDF → JPG", ro: "PDF → JPG" },
      { href: "/convert/pdf-to-png", en: "PDF → PNG", ro: "PDF → PNG" },
      { href: "/convert/pdf-to-html", en: "PDF → HTML", ro: "PDF → HTML" },
      { href: "/convert/pdf-to-txt", en: "PDF → TXT", ro: "PDF → TXT" },
      { href: "/convert/pdf-to-csv", en: "PDF → CSV", ro: "PDF → CSV" },
    ],
  },
  {
    id: "to-pdf", en: "Convert to PDF", ro: "Conversie în PDF", color: "from-orange-500 to-amber-500", border: "border-orange-400/30", hex: "#fb923c",
    items: [
      { href: "/convert/word-to-pdf", en: "Word → PDF", ro: "Word → PDF" },
      { href: "/convert/excel-to-pdf", en: "Excel → PDF", ro: "Excel → PDF" },
      { href: "/convert/pptx-to-pdf", en: "PPTX → PDF", ro: "PPTX → PDF" },
      { href: "/convert/jpg-to-pdf", en: "JPG → PDF", ro: "JPG → PDF" },
      { href: "/convert/png-to-pdf", en: "PNG → PDF", ro: "PNG → PDF" },
      { href: "/convert/html-to-pdf", en: "HTML → PDF", ro: "HTML → PDF" },
      { href: "/convert/txt-to-pdf", en: "TXT → PDF", ro: "TXT → PDF" },
      { href: "/convert/csv-to-pdf", en: "CSV → PDF", ro: "CSV → PDF" },
      { href: "/convert/markdown-to-pdf", en: "Markdown → PDF", ro: "Markdown → PDF" },
      { href: "/convert/image-to-pdf", en: "Image → PDF", ro: "Imagine → PDF" },
    ],
  },
  {
    id: "office", en: "Word & Office Conversions", ro: "Conversii Word & Office", color: "from-violet-500 to-purple-500", border: "border-violet-400/30", hex: "#8b5cf6",
    items: [
      { href: "/convert/word-to-excel", en: "Word → Excel", ro: "Word → Excel" },
      { href: "/convert/excel-to-word", en: "Excel → Word", ro: "Excel → Word" },
      { href: "/convert/word-to-pptx", en: "Word → PPTX", ro: "Word → PPTX" },
      { href: "/convert/pptx-to-word", en: "PPTX → Word", ro: "PPTX → Word" },
      { href: "/convert/word-to-html", en: "Word → HTML", ro: "Word → HTML" },
      { href: "/convert/html-to-word", en: "HTML → Word", ro: "HTML → Word" },
      { href: "/convert/word-to-txt", en: "Word → TXT", ro: "Word → TXT" },
      { href: "/convert/txt-to-word", en: "TXT → Word", ro: "TXT → Word" },
      { href: "/convert/word-to-jpg", en: "Word → JPG", ro: "Word → JPG" },
      { href: "/convert/word-to-png", en: "Word → PNG", ro: "Word → PNG" },
      { href: "/convert/jpg-to-word", en: "JPG → Word", ro: "JPG → Word" },
      { href: "/convert/png-to-word", en: "PNG → Word", ro: "PNG → Word" },
      { href: "/convert/excel-to-csv", en: "Excel → CSV", ro: "Excel → CSV" },
      { href: "/convert/csv-to-excel", en: "CSV → Excel", ro: "CSV → Excel" },
      { href: "/convert/excel-to-html", en: "Excel → HTML", ro: "Excel → HTML" },
      { href: "/convert/html-to-excel", en: "HTML → Excel", ro: "HTML → Excel" },
      { href: "/convert/excel-to-txt", en: "Excel → TXT", ro: "Excel → TXT" },
      { href: "/convert/pptx-to-html", en: "PPTX → HTML", ro: "PPTX → HTML" },
    ],
  },
]

export default function AllToolsPage() {
  usePing()
  const { classicMode: cm, lang, setLang, setClassicMode } = useApp()
  const { data: session, status } = useSession()
  const isOwner = (session?.user as { role?: string } | undefined)?.role === "owner"
  const l = lang === "RO" ? "ro" : "en"

  const [sections, setSections] = useState<Section[]>(defaultSections)
  const [editMode, setEditMode] = useState(false)
  const [search, setSearch] = useState("")
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragItem, setDragItem] = useState<{ sIdx: number; iIdx: number } | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [editBanner, setEditBanner] = useState<{ editsLeft: number } | null>(null)
  const [countdown, setCountdown] = useState("")

  useEffect(() => {
    if (status !== "authenticated") { setEditBanner(null); return }
    fetch("/api/user/profile").then(r => r.json()).then(d => {
      if (d && d.plan !== "premium" && d.plan !== "friend" && d.role !== "owner") {
        const today = new Date().toISOString().split("T")[0]
        const used = d.dailyEditsDate === today ? (d.dailyEditsUsed ?? 0) : 0
        const bonus = d.bonusEdits ?? 0
        const left = Math.max(0, 10 - used)
        if (left <= 3 && bonus <= 0) setEditBanner({ editsLeft: left })
      }
    }).catch(() => {})
  }, [status])

  useEffect(() => {
    if (!editBanner || editBanner.editsLeft > 0) return
    const tick = () => {
      const now = new Date()
      const reset = new Date(now)
      reset.setHours(8, 0, 0, 0)
      if (now >= reset) reset.setDate(reset.getDate() + 1)
      const diff = reset.getTime() - now.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`)
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [editBanner])

  const handleItemDragStart = (sIdx: number, iIdx: number, e: React.DragEvent) => {
    e.stopPropagation()
    setDragItem({ sIdx, iIdx })
  }
  const handleItemDragOver = (sIdx: number, iIdx: number, e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragItem || dragItem.sIdx !== sIdx || dragItem.iIdx === iIdx) return
    const copy = [...sections]
    const items = [...copy[sIdx].items]
    const [moved] = items.splice(dragItem.iIdx, 1)
    items.splice(iIdx, 0, moved)
    copy[sIdx] = { ...copy[sIdx], items }
    setSections(copy)
    setDragItem({ sIdx, iIdx })
  }
  const handleItemDragEnd = () => setDragItem(null)

  const renameSectionTitle = (sIdx: number, val: string) => {
    const copy = [...sections]
    copy[sIdx] = { ...copy[sIdx], [l]: val }
    setSections(copy)
  }

  const renameItemLabel = (sIdx: number, iIdx: number, val: string) => {
    const copy = [...sections]
    const items = [...copy[sIdx].items]
    items[iIdx] = { ...items[iIdx], [l]: val }
    copy[sIdx] = { ...copy[sIdx], items }
    setSections(copy)
  }

  const handleDragStart = (idx: number) => setDragIdx(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    setDropTarget(idx)
    const copy = [...sections]
    const [moved] = copy.splice(dragIdx, 1)
    copy.splice(idx, 0, moved)
    setSections(copy)
    setDragIdx(idx)
  }

  const pageTitle = l === "ro" ? "Toate Instrumentele & Conversiile" : "All Tools & Conversions"
  const pageSub = l === "ro" ? "Tot ce ai nevoie pentru a lucra cu documente, într-un singur loc." : "Everything you need to work with documents, all in one place."

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections
    const q = search.toLowerCase()
    return sections.map(s => ({
      ...s,
      items: s.items.filter(i => i.en.toLowerCase().includes(q) || i.ro.toLowerCase().includes(q) || i.href.toLowerCase().includes(q)),
    })).filter(s => s.items.length > 0)
  }, [sections, search])

  return (
    <div className={`min-h-screen ${cm ? "bg-gray-50 text-black" : "bg-[#0a0e1a] text-white"}`}>
      <Navbar lang={lang} setLang={setLang} classicMode={cm} setClassicMode={setClassicMode} />

      {editBanner && (
        <div className="fixed top-12 left-0 right-0 z-40 flex justify-center px-4 pt-2 pointer-events-none">
          <div className={`max-w-4xl w-full p-4 rounded-2xl border text-center pointer-events-auto backdrop-blur-md ${editBanner.editsLeft <= 0 ? (cm ? "bg-red-100/40 border-red-300/50" : "bg-red-500/5 border-red-400/15") : (cm ? "bg-amber-100/40 border-amber-300/50" : "bg-amber-500/5 border-amber-400/15")}`}>
            <p className={`text-sm font-bold ${editBanner.editsLeft <= 0 ? (cm ? "text-red-700" : "text-red-400") : (cm ? "text-amber-700" : "text-amber-400")}`}>{editBanner.editsLeft <= 0 ? "Daily edit limit reached (0/10)" : `${editBanner.editsLeft} edit${editBanner.editsLeft > 1 ? "s" : ""} remaining today (${editBanner.editsLeft}/10)`}</p>
            <p className={`text-xs mt-1 ${editBanner.editsLeft <= 0 ? (cm ? "text-red-500" : "text-red-400/60") : (cm ? "text-amber-500" : "text-amber-400/60")}`}>{editBanner.editsLeft <= 0 ? "Upgrade or watch ads to continue editing." : "Running low on free edits."}</p>
            {editBanner.editsLeft <= 0 && countdown && (
              <p className={`text-xs mt-2 font-mono ${cm ? "text-red-400" : "text-red-300/50"}`}>⏳ Resets in {countdown} (at 08:00)</p>
            )}
            {editBanner.editsLeft <= 0 && (
              <div className="flex flex-col sm:flex-row justify-center gap-2 mt-3">
                <Link href="/dashboard#upgrade" className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-105 active:scale-95 transition-all">⭐ Get Premium</Link>
                <Link href="/dashboard#ads" className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:scale-105 active:scale-95 transition-all">🎬 Watch Ads — +1 Edit</Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-20 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className={`text-3xl sm:text-4xl font-bold ${cm ? "text-gray-900" : "text-white"}`}>{pageTitle}</h1>
          <p className={`mt-2 text-sm ${cm ? "text-gray-500" : "text-white/40"}`}>{pageSub}</p>
          <div className="mt-5 max-w-md mx-auto relative">
            <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${cm ? "text-gray-400" : "text-white/30"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={l === "ro" ? "Caută instrumente..." : "Search tools..."}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 transition ${cm ? "bg-white border-gray-200 text-gray-700 focus:ring-blue-400/30 placeholder:text-gray-400" : "bg-white/5 border-white/10 text-white focus:ring-blue-500/30 placeholder:text-white/30"}`}
            />
            {search && <button onClick={() => setSearch("")} className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${cm ? "text-gray-400 hover:text-gray-600" : "text-white/30 hover:text-white"}`}>✕</button>}
          </div>
          {isOwner && (
            <button onClick={() => setEditMode(!editMode)} className={`mt-4 px-4 py-2 rounded-xl text-xs font-bold transition-all ${editMode ? "bg-green-500 text-white" : cm ? "bg-gray-200 text-gray-600 hover:bg-gray-300" : "bg-white/10 text-white/60 hover:bg-white/15"}`}>
              {editMode ? (l === "ro" ? "✓ Gata" : "✓ Done") : (l === "ro" ? "✏️ Editează Ordinea" : "✏️ Edit Order")}
            </button>
          )}
        </div>

        <div className="space-y-8">
          {filteredSections.map((section, sIdx) => (
            <div key={section.id}
              draggable={editMode}
              onDragStart={() => handleDragStart(sIdx)}
              onDragOver={(e) => handleDragOver(e, sIdx)}
              onDragEnd={() => { setDragIdx(null); setDropTarget(null) }}
              className={`${editMode ? "cursor-grab active:cursor-grabbing rounded-2xl p-4 -mx-4 transition-all border-2 border-dashed" : ""} ${editMode && dragIdx === sIdx ? "opacity-50" : ""} ${editMode ? (cm ? "border-gray-300 hover:border-gray-400 hover:bg-gray-100/50" : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]") : ""}`}
            >
              <div className="flex items-center gap-3 mb-4">
                {editMode && (
                  <svg className={`w-5 h-5 flex-shrink-0 ${cm ? "text-gray-400" : "text-white/30"}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                )}
                <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${section.color}`} />
                {editMode ? (
                  <input value={section[l]} onChange={(e) => renameSectionTitle(sIdx, e.target.value)} className={`text-lg font-bold bg-transparent border-b-2 outline-none ${cm ? "text-gray-800 border-gray-300 focus:border-blue-500" : "text-white border-white/20 focus:border-blue-400"}`} />
                ) : (
                  <h2 className={`text-lg font-bold ${cm ? "text-gray-800" : "text-white"}`}>{section[l]}</h2>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${cm ? "bg-gray-200 text-gray-500" : "bg-white/5 text-white/30"}`}>{section.items.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {section.items.map((item, iIdx) => (
                  editMode ? (
                    <div key={item.href}
                      draggable
                      onDragStart={(e) => handleItemDragStart(sIdx, iIdx, e)}
                      onDragOver={(e) => handleItemDragOver(sIdx, iIdx, e)}
                      onDragEnd={handleItemDragEnd}
                      className={`px-4 py-3 rounded-xl text-sm font-medium border-l-4 border cursor-grab active:cursor-grabbing transition-all ${dragItem?.sIdx === sIdx && dragItem?.iIdx === iIdx ? "opacity-50" : ""} ${cm ? "bg-white border-gray-200 hover:shadow-sm" : "bg-white/5 border-white/10 hover:bg-white/[0.07]"} flex items-center gap-2`} style={{ borderLeftColor: section.hex }}>
                      <svg className={`w-3.5 h-3.5 flex-shrink-0 ${cm ? "text-gray-300" : "text-white/20"}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                      <input value={item[l]} onChange={(e) => renameItemLabel(sIdx, iIdx, e.target.value)} className={`w-full bg-transparent text-xs outline-none border-b ${cm ? "text-gray-700 border-gray-200 focus:border-blue-400" : "text-white/80 border-white/10 focus:border-blue-400"}`} />
                    </div>
                  ) : (
                    <Link key={item.href} href={item.href}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] border-l-4 border ${cm ? "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md" : "bg-white/5 border-white/10 text-white/80 hover:bg-white/[0.08] hover:border-white/20"}`}
                      style={{ borderLeftColor: section.hex }}>
                      {item[l]}
                    </Link>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
      <Footer lang={lang} classicMode={cm} />
      <ScrollTop lang={lang} classicMode={cm} />
    </div>
  )
}
