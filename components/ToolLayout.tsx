"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useApp } from "@/components/AppContext"
import { usePinnedTools } from "@/lib/usePinnedTools"
import { useToolOrder, applySectionOrder, SectionOrder } from "@/lib/useToolOrder"
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const convertIcon = "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"

const sidebarSections = [
{
label: "Viewers",
items: [
{ href: "/tools/pdf-viewer", label: "PDF Viewer", icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
{ href: "/tools/word-viewer", label: "Word Viewer", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
{ href: "/tools/excel-viewer", label: "Excel Viewer", icon: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625" },
{ href: "/tools/pptx-viewer", label: "PowerPoint Viewer", icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3" },
{ href: "/tools/image-viewer", label: "Image Viewer", icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" },
]
},
{
label: "PDF Tools",
items: [
{ href: "/tools/pdf-editor", label: "PDF Editor", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
{ href: "/tools/pdf-creator", label: "PDF Creator", icon: "M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" },
{ href: "/tools/split-pdf", label: "Split PDF", icon: "M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12H9" },
{ href: "/tools/merge-pdf", label: "Merge PDF", icon: "M12 4.5v15m7.5-7.5h-15" },
{ href: "/tools/rotate-pdf", label: "Rotate PDF", icon: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" },
{ href: "/tools/compress", label: "Compress", icon: "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" },
{ href: "/tools/watermark", label: "Add Watermark", icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" },
{ href: "/tools/encrypt-pdf", label: "Encrypt / Decrypt", icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" },
{ href: "/tools/extract-images", label: "Extract Images", icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" },
{ href: "/tools/delete-pages", label: "Delete Pages", icon: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" },
]
},
{
label: "Document Editors",
items: [
{ href: "/tools/word-editor", label: "Word Editor", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
{ href: "/tools/excel-editor", label: "Excel Editor", icon: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12h7.5m-7.5 0c.621 0 1.125.504 1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" },
{ href: "/tools/powerpoint-editor", label: "PowerPoint Editor", icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" },
{ href: "/tools/txt-editor", label: "TXT / Code Editor", icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" },
{ href: "/tools/csv-editor", label: "CSV Editor", icon: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125" },
]
},
{
label: "Utilities",
items: [
{ href: "/tools/ocr", label: "OCR (Image → Text)", icon: "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" },
{ href: "/tools/remove-bg", label: "Remove Background", icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5" },
]
},
{
label: "Convert from PDF",
items: [
{ href: "/convert/pdf-to-word", label: "PDF → Word", icon: convertIcon },
{ href: "/convert/pdf-to-excel", label: "PDF → Excel", icon: convertIcon },
{ href: "/convert/pdf-to-pptx", label: "PDF → PPTX", icon: convertIcon },
{ href: "/convert/pdf-to-jpg", label: "PDF → JPG", icon: convertIcon },
{ href: "/convert/pdf-to-png", label: "PDF → PNG", icon: convertIcon },
{ href: "/convert/pdf-to-html", label: "PDF → HTML", icon: convertIcon },
{ href: "/convert/pdf-to-txt", label: "PDF → TXT", icon: convertIcon },
{ href: "/convert/pdf-to-csv", label: "PDF → CSV", icon: convertIcon },
]
},
{
label: "Convert to PDF",
items: [
{ href: "/convert/word-to-pdf", label: "Word → PDF", icon: convertIcon },
{ href: "/convert/excel-to-pdf", label: "Excel → PDF", icon: convertIcon },
{ href: "/convert/pptx-to-pdf", label: "PPTX → PDF", icon: convertIcon },
{ href: "/convert/jpg-to-pdf", label: "JPG → PDF", icon: convertIcon },
{ href: "/convert/png-to-pdf", label: "PNG → PDF", icon: convertIcon },
{ href: "/convert/html-to-pdf", label: "HTML → PDF", icon: convertIcon },
{ href: "/convert/txt-to-pdf", label: "TXT → PDF", icon: convertIcon },
{ href: "/convert/csv-to-pdf", label: "CSV → PDF", icon: convertIcon },
{ href: "/convert/markdown-to-pdf", label: "Markdown → PDF", icon: convertIcon },
{ href: "/convert/image-to-pdf", label: "Image → PDF", icon: convertIcon },
]
},
{
label: "Word & Office",
items: [
{ href: "/convert/word-to-excel", label: "Word → Excel", icon: convertIcon },
{ href: "/convert/excel-to-word", label: "Excel → Word", icon: convertIcon },
{ href: "/convert/word-to-pptx", label: "Word → PPTX", icon: convertIcon },
{ href: "/convert/pptx-to-word", label: "PPTX → Word", icon: convertIcon },
{ href: "/convert/word-to-html", label: "Word → HTML", icon: convertIcon },
{ href: "/convert/html-to-word", label: "HTML → Word", icon: convertIcon },
{ href: "/convert/word-to-txt", label: "Word → TXT", icon: convertIcon },
{ href: "/convert/txt-to-word", label: "TXT → Word", icon: convertIcon },
{ href: "/convert/word-to-jpg", label: "Word → JPG", icon: convertIcon },
{ href: "/convert/word-to-png", label: "Word → PNG", icon: convertIcon },
{ href: "/convert/jpg-to-word", label: "JPG → Word", icon: convertIcon },
{ href: "/convert/png-to-word", label: "PNG → Word", icon: convertIcon },
{ href: "/convert/excel-to-csv", label: "Excel → CSV", icon: convertIcon },
{ href: "/convert/csv-to-excel", label: "CSV → Excel", icon: convertIcon },
{ href: "/convert/excel-to-html", label: "Excel → HTML", icon: convertIcon },
{ href: "/convert/html-to-excel", label: "HTML → Excel", icon: convertIcon },
{ href: "/convert/excel-to-txt", label: "Excel → TXT", icon: convertIcon },
{ href: "/convert/pptx-to-html", label: "PPTX → HTML", icon: convertIcon },
]
}
]

function LimitBlock({ classicMode }: { classicMode: boolean }) {
  const [cd, setCd] = useState("")
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const reset = new Date(now)
      reset.setHours(8, 0, 0, 0)
      if (now >= reset) reset.setDate(reset.getDate() + 1)
      const diff = reset.getTime() - now.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCd(`${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`)
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])
  const cm = classicMode
  return (
    <div className={`p-8 rounded-2xl border text-center ${cm ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-400/20"}`}>
      <svg className={`w-12 h-12 mx-auto mb-4 ${cm ? "text-red-400" : "text-red-400/60"}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
      <p className={`text-lg font-bold ${cm ? "text-red-700" : "text-red-400"}`}>Daily edit limit reached (0/10)</p>
      <p className={`text-sm mt-2 ${cm ? "text-red-500" : "text-red-400/60"}`}>You've used all your free edits for today. Upgrade for unlimited access or watch ads to earn a free edit.</p>
      {cd && <p className={`text-sm mt-3 font-mono ${cm ? "text-red-400" : "text-red-300/50"}`}>⏳ Resets in {cd} (at 08:00)</p>}
      <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
        <Link href="/dashboard#upgrade" className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20">⭐ Get Premium — Unlimited & No Ads</Link>
        <Link href="/dashboard#ads" className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20">🎬 Watch Ads — +1 Free Edit</Link>
      </div>
    </div>
  )
}

function SortableSectionHeader({ id, label, classicMode }: { id: string; label: string; classicMode: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`text-[10px] font-bold tracking-widest uppercase mb-2 px-3 flex items-center gap-1.5 cursor-grab active:cursor-grabbing ${classicMode ? "text-gray-400" : "text-white/30"}`}>
      <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
      {label}
    </div>
  )
}

function SortableToolItem({ id, item, active: isActive, classicMode, onPin }: { id: string; item: { href: string; label: string; icon: string }; active: boolean; classicMode: boolean; onPin: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  return (
    <div ref={setNodeRef} style={style} className="flex items-center mb-0.5 group">
      <div {...attributes} {...listeners} className={`w-6 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing flex-shrink-0 ${classicMode ? "text-gray-300" : "text-white/15"}`}>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
      </div>
      <Link href={item.href} className={`flex-1 flex items-center gap-3 px-2 py-2 rounded-xl text-sm transition-all ${
        isActive
        ? classicMode ? "bg-blue-50 text-blue-700 border border-blue-200 font-medium" : "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/30"
        : classicMode ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : "text-white/60 hover:text-white hover:bg-white/5"
      }`}>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
        <span className="truncate">{item.label}</span>
      </Link>
    </div>
  )
}

type Props = {
children: React.ReactNode
title: string
subtitle?: string
}

export default function ToolLayout({ children, title }: Props) {

const pathname = usePathname()
const [collapsed, setCollapsed] = useState(false)
const { classicMode, setClassicMode } = useApp()
const { data: session, status } = useSession()
const userRole = (session?.user as { role?: string } | undefined)?.role
const isAdminOrOwner = userRole === "owner" || userRole === "admin"
const { pinned, toggle: togglePin, isPinned } = usePinnedTools()
const { order: savedOrder, saveOrder } = useToolOrder()
const [reorderMode, setReorderMode] = useState(false)
const [localSections, setLocalSections] = useState<typeof sidebarSections | null>(null)

const orderedSections = useMemo(() => {
  if (localSections) return localSections
  return applySectionOrder(sidebarSections, savedOrder)
}, [savedOrder, localSections])

const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
  const { active, over } = event
  if (!over || active.id === over.id) return
  const oldIdx = orderedSections.findIndex(s => `section-${s.label}` === active.id)
  const newIdx = orderedSections.findIndex(s => `section-${s.label}` === over.id)
  if (oldIdx === -1 || newIdx === -1) return
  const newSections = arrayMove([...orderedSections], oldIdx, newIdx)
  setLocalSections(newSections)
  saveOrder(newSections.map(s => ({ label: s.label, items: s.items.map(i => i.href) })))
}, [orderedSections, saveOrder])

const handleItemDragEnd = useCallback((sectionLabel: string) => (event: DragEndEvent) => {
  const { active, over } = event
  if (!over || active.id === over.id) return
  const sectionIdx = orderedSections.findIndex(s => s.label === sectionLabel)
  if (sectionIdx === -1) return
  const section = orderedSections[sectionIdx]
  const oldIdx = section.items.findIndex(i => i.href === active.id)
  const newIdx = section.items.findIndex(i => i.href === over.id)
  if (oldIdx === -1 || newIdx === -1) return
  const newItems = arrayMove([...section.items], oldIdx, newIdx)
  const newSections = [...orderedSections]
  newSections[sectionIdx] = { ...section, items: newItems }
  setLocalSections(newSections)
  saveOrder(newSections.map(s => ({ label: s.label, items: s.items.map(i => i.href) })))
}, [orderedSections, saveOrder])

const [cloudEnabled, setCloudEnabled] = useState(true)
const [cloudToast, setCloudToast] = useState<string | null>(null)
const [editInfo, setEditInfo] = useState<{ editsLeft: number; bonusEdits: number; unlimited: boolean } | null>(null)

const collapseSidebar = useCallback(() => setCollapsed(true), [])

useEffect(() => {
  window.addEventListener("docm-collapse-sidebar", collapseSidebar)
  return () => window.removeEventListener("docm-collapse-sidebar", collapseSidebar)
}, [collapseSidebar])

useEffect(() => {
  if (status !== "authenticated") return
  fetch("/api/user/profile").then(r => r.json()).then(d => {
    if (typeof d.cloudEnabled === "boolean") setCloudEnabled(d.cloudEnabled)
    if (d && d.id) {
      const today = new Date().toISOString().split("T")[0]
      const used = d.dailyEditsDate === today ? (d.dailyEditsUsed ?? 0) : 0
      const unlimited = d.plan === "premium" || d.plan === "friend" || d.role === "owner"
      setEditInfo({ editsLeft: unlimited ? -1 : Math.max(0, 10 - used), bonusEdits: d.bonusEdits ?? 0, unlimited })
    }
  }).catch(() => {})
}, [status])

const toggleCloud = async () => {
  const newVal = !cloudEnabled
  setCloudEnabled(newVal)
  setCloudToast(newVal ? "Cloud auto-save enabled" : "Cloud auto-save disabled")
  setTimeout(() => setCloudToast(null), 2500)
  try {
    await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cloudEnabled: newVal }) })
  } catch { setCloudEnabled(!newVal); setCloudToast(null) }
}

/* Auth gate — require login to use tools */
if (status === "loading") {
  return (
    <div className={`min-h-screen flex items-center justify-center ${classicMode ? "bg-[#f0f2f5] text-gray-900" : "bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e] text-white"}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className={`text-sm ${classicMode ? "text-gray-500" : "text-white/40"}`}>Loading...</p>
      </div>
    </div>
  )
}

if (status === "unauthenticated") {
  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${classicMode ? "bg-[#f0f2f5] text-gray-900" : "bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e] text-white"}`}>
      <div className={`max-w-md w-full rounded-2xl p-8 text-center space-y-6 ${classicMode ? "bg-white border border-gray-200 shadow-lg" : "bg-white/5 border border-white/10 backdrop-blur-xl"}`}>
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
        </div>
        <div>
          <h2 className={`text-2xl font-bold mb-2 ${classicMode ? "text-gray-900" : ""}`}>Account Required</h2>
          <p className={`text-sm ${classicMode ? "text-gray-500" : "text-white/50"}`}>
            Create a free account or log in to start using <strong>{title}</strong> and all DocM editing tools. Free accounts get 10 edits per day!
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/register" className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20 block">
            Create Free Account
          </Link>
          <Link href="/login" className={`w-full py-3 rounded-xl text-sm font-semibold transition-all block ${classicMode ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200" : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"}`}>
            Log In
          </Link>
        </div>
        <Link href="/" className={`inline-flex items-center gap-1 text-xs ${classicMode ? "text-gray-400 hover:text-gray-600" : "text-white/30 hover:text-white/50"} transition`}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Back to Home
        </Link>
      </div>
    </div>
  )
}

return (

<div className={`min-h-screen ${classicMode ? "bg-[#f0f2f5] text-gray-900" : "bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e] text-white"}`}>

{/* TOP BAR */}
<div className={`fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-xl border-b flex items-center px-4 gap-2 ${classicMode ? "bg-white/90 border-gray-200" : "bg-[#0a0f2e]/90 border-white/10"}`}>

<Link href="/" className="flex items-center gap-2 mr-1">
<img src="/logo.png" className="w-24 h-auto object-contain" alt="DocM" />
</Link>

<button onClick={() => setCollapsed(!collapsed)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${classicMode ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
</svg>
</button>

{/* NAV LINKS — More items shown directly */}
<div className="hidden md:flex items-center gap-1 ml-2">
{[{href:"/about",label:"About"},{href:"/reviews",label:"Reviews"},{href:"/blog",label:"Blog"},{href:"/help",label:"Help"},{href:"/report-bug",label:"Report Bug"}].map(i=>(
<Link key={i.href} href={i.href} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all ${classicMode ? "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900" : "bg-white/[0.04] text-white/60 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"}`}>{i.label}</Link>
))}
</div>

<div className="flex-1" />

<span className={`text-sm font-semibold hidden sm:block ${classicMode ? "text-gray-800" : "text-white/80"}`}>{title}</span>

<div className="flex-1" />

<div className="flex gap-2 items-center">
{status === "authenticated" && (
<div className="flex items-center gap-1.5">
{isAdminOrOwner && (
<Link href="/dmc-ctrl" className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${classicMode ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" : "bg-red-500/15 text-red-300 border border-red-400/20 hover:bg-red-500/25"}`}>
<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
Panel
</Link>
)}
<Link href="/cloud" className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${classicMode ? "bg-violet-50 text-purple-700 border border-purple-200 hover:bg-violet-100" : "bg-purple-500/15 text-purple-300 border border-purple-400/20 hover:bg-purple-500/25"}`}>
<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" /></svg>
Cloud
</Link>
<div className="relative">
<button onClick={toggleCloud} title={cloudEnabled ? "Cloud auto-save ON" : "Cloud auto-save OFF"} className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${cloudEnabled ? "bg-emerald-500" : classicMode ? "bg-gray-300" : "bg-white/20"}`}>
<span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${cloudEnabled ? "translate-x-4" : "translate-x-0"}`} />
</button>
{cloudToast && (
<div className={`absolute top-full right-0 mt-2 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap shadow-lg z-50 animate-in fade-in slide-in-from-top-1 ${cloudEnabled ? classicMode ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" : classicMode ? "bg-gray-100 text-gray-600 border border-gray-200" : "bg-white/10 text-white/60 border border-white/10"}`}>
{cloudEnabled ? "\u2601 " : ""}{cloudToast}
</div>
)}
</div>
</div>
)}
{status === "authenticated" && (
<Link href="/dashboard" className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${classicMode ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
Profile
</Link>
)}
<button onClick={() => setClassicMode(!classicMode)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${classicMode ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-white/5 border border-white/10 hover:bg-white/10 text-white/50"}`} title={classicMode ? "Dark mode" : "Light mode"}>
{classicMode ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>}
</button>
<Link href="/" className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${classicMode ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
Home
</Link>
</div>

</div>

<div className="flex pt-14">

{/* SIDEBAR */}
<aside className={`fixed top-14 left-0 bottom-0 backdrop-blur-xl border-r overflow-y-auto transition-all duration-300 z-40 ${classicMode ? "bg-white/80 border-gray-200" : "bg-[#080d28]/80 border-white/10"} ${collapsed ? "w-0 opacity-0 overflow-hidden" : "w-64 opacity-100"}`}>

<div className="p-4 space-y-6">

{/* PINNED SECTION */}
{pinned.length > 0 && (() => {
  const allItems = sidebarSections.flatMap(s => s.items)
  const pinnedItems = pinned.map(href => allItems.find(i => i.href === href)).filter(Boolean) as typeof allItems
  if (pinnedItems.length === 0) return null
  return (
    <div>
      <p className={`text-[10px] font-bold tracking-widest uppercase mb-2 px-3 flex items-center gap-1.5 ${classicMode ? "text-amber-500" : "text-amber-400/70"}`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
        Pinned
      </p>
      {pinnedItems.map((item, ii) => {
        const active = pathname === item.href
        return (
          <div key={ii} className="flex items-center mb-0.5 group">
            <Link href={item.href} className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
              active
              ? classicMode ? "bg-amber-50 text-amber-700 border border-amber-200 font-medium" : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-white border border-amber-400/30"
              : classicMode ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : "text-white/60 hover:text-white hover:bg-white/5"
            }`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
              <span className="truncate">{item.label}</span>
            </Link>
            <button onClick={() => togglePin(item.href)} className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ml-0.5 transition opacity-0 group-hover:opacity-100 ${classicMode ? "text-amber-500 hover:bg-amber-50" : "text-amber-400 hover:bg-white/10"}`} title="Unpin">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
            </button>
          </div>
        )
      })}
    </div>
  )
})()}

{/* Reorder mode toggle for admin/owner */}
{isAdminOrOwner && (
<div className="flex items-center justify-between px-3 mb-2">
  <button onClick={() => setReorderMode(r => !r)} className={`text-[10px] px-2 py-1 rounded-lg font-medium transition flex items-center gap-1 ${reorderMode ? classicMode ? "bg-blue-100 text-blue-700 border border-blue-300" : "bg-blue-500/20 text-blue-400 border border-blue-400/30" : classicMode ? "bg-gray-100 text-gray-400 hover:text-gray-600" : "bg-white/5 text-white/25 hover:text-white/50 border border-white/10"}`}>
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
    {reorderMode ? "Done" : "Reorder"}
  </button>
</div>
)}

{reorderMode && isAdminOrOwner ? (
/* ── REORDER MODE: sections are draggable ── */
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
<SortableContext items={orderedSections.map(s => `section-${s.label}`)} strategy={verticalListSortingStrategy}>
{orderedSections.map((section) => (
<div key={section.label}>
  <SortableSectionHeader id={`section-${section.label}`} label={section.label} classicMode={classicMode} />
  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd(section.label)}>
  <SortableContext items={section.items.map(i => i.href)} strategy={verticalListSortingStrategy}>
  {section.items.map((item) => (
    <SortableToolItem key={item.href} id={item.href} item={item} active={pathname === item.href} classicMode={classicMode} onPin={() => togglePin(item.href)} />
  ))}
  </SortableContext>
  </DndContext>
</div>
))}
</SortableContext>
</DndContext>
) : (
/* ── NORMAL MODE: standard sidebar ── */
<>
{orderedSections.map((section, si) => (

<div key={si}>

<p className={`text-[10px] font-bold tracking-widest uppercase mb-2 px-3 ${classicMode ? "text-gray-400" : "text-white/30"}`}>
{section.label}
</p>

{section.items.filter(item => !isPinned(item.href)).map((item, ii) => {

const active = pathname === item.href

return (
<div key={ii} className="flex items-center mb-0.5 group">
<Link
href={item.href}
className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
active
? classicMode ? "bg-blue-50 text-blue-700 border border-blue-200 font-medium" : "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/30"
: classicMode ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : "text-white/60 hover:text-white hover:bg-white/5"
}`}
>
<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
</svg>
<span className="truncate">{item.label}</span>
</Link>
<button onClick={() => togglePin(item.href)} className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ml-0.5 transition-all opacity-0 group-hover:opacity-100 ${classicMode ? "text-gray-300 hover:text-amber-500 hover:bg-amber-50" : "text-white/15 hover:text-amber-400 hover:bg-amber-400/10"}`} title="Pin">
<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
</button>
</div>
)

})}

</div>

))}
</>
)}

</div>

</aside>

{/* MAIN CONTENT */}
<main className={`flex-1 transition-all duration-300 ${collapsed ? "ml-0" : "ml-64"}`}>

<div className="p-6">

{editInfo && !editInfo.unlimited && editInfo.editsLeft <= 0 && editInfo.bonusEdits <= 0 ? (
<LimitBlock classicMode={classicMode} />
) : (
<>
{editInfo && !editInfo.unlimited && editInfo.editsLeft > 0 && editInfo.editsLeft <= 3 && (
<div className={`mb-4 px-4 py-3 rounded-xl border text-center ${classicMode ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-400/20"}`}>
<p className={`text-sm font-bold ${classicMode ? "text-amber-700" : "text-amber-400"}`}>{editInfo.editsLeft} edit{editInfo.editsLeft > 1 ? "s" : ""} remaining today{editInfo.bonusEdits > 0 ? ` (+${editInfo.bonusEdits} bonus)` : ""}</p>
</div>
)}

{children}
</>
)}

</div>

</main>

</div>

</div>

)

}
