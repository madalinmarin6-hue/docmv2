"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import { Extension } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Highlight from "@tiptap/extension-highlight"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import FontFamily from "@tiptap/extension-font-family"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import Placeholder from "@tiptap/extension-placeholder"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import { useState, useCallback, useEffect, useRef } from "react"
import OfficeRibbon, { type RibbonTab } from "./OfficeRibbon"

/* Custom FontSize extension — @tiptap/extension-text-style v3 doesn't export FontSize */
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() { return { types: ["textStyle"] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.fontSize || null,
          renderHTML: (attrs: Record<string, any>) => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: { chain: any }) => chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }: { chain: any }) => chain().setMark("textStyle", { fontSize: null }).run(),
    } as any
  },
})

interface Props {
  initialContent?: string
  fileName: string
  onExport: (html: string) => void
  onExportHTML: (html: string) => void
  onExportTXT: (text: string) => void
  onPrint: (html: string) => void
  onClose: () => void
  status: string
}

/* A4 page dimensions in px at 96 DPI */
const PAGE_W = 794
const PAGE_H = 1123
const MARGIN_TOP = 96
const MARGIN_BOTTOM = 96
const MARGIN_LEFT = 72
const MARGIN_RIGHT = 72
/* ruler constants */
const RULER_SIZE = 22
const RULER_CM = 37.795 /* 1 cm in px at 96dpi */

export default function TipTapEditor({
  initialContent, fileName, onExport, onExportHTML, onExportTXT, onPrint, onClose, status,
}: Props) {
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>("home")
  const [zoom, setZoom] = useState(100)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [showRightPanel, setShowRightPanel] = useState(false)
  const [rightPanelTab, setRightPanelTab] = useState<"nav" | "comments" | "settings">("nav")
  const [marginLeft, setMarginLeft] = useState(MARGIN_LEFT)
  const [marginRight, setMarginRight] = useState(MARGIN_RIGHT)
  const [draggingMargin, setDraggingMargin] = useState<"left" | "right" | null>(null)
  const editorAreaRef = useRef<HTMLDivElement>(null)
  const topRulerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: true }),
      TextStyle,
      FontSize,
      Color,
      FontFamily,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: "Start typing your document…" }),
      Subscript,
      Superscript,
    ],
    content: initialContent || "<p></p>",
    editorProps: {
      attributes: { class: "outline-none min-h-full" },
    },
    onUpdate: ({ editor: e }) => {
      const text = e.getText()
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0)
      setCharCount(text.length)
    },
  })

  /* keyboard shortcuts */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); if (editor) onExport(editor.getHTML()) }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") { e.preventDefault(); if (editor) onPrint(editor.getHTML()) }
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [editor, onExport, onPrint])

  /* calculate page count from editor height */
  useEffect(() => {
    const interval = setInterval(() => {
      const el = document.querySelector(".ProseMirror")
      if (el) {
        const contentH = el.scrollHeight
        const usable = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM
        setPageCount(Math.max(1, Math.ceil(contentH / usable)))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  /* margin drag handlers */
  const handleMarginDrag = useCallback((e: MouseEvent) => {
    if (!draggingMargin || !topRulerRef.current) return
    const rect = topRulerRef.current.getBoundingClientRect()
    const scale = zoom / 100
    const x = (e.clientX - rect.left) / scale
    if (draggingMargin === "left") {
      setMarginLeft(Math.max(18, Math.min(200, x)))
    } else {
      setMarginRight(Math.max(18, Math.min(200, PAGE_W - x)))
    }
  }, [draggingMargin, zoom])

  const handleMarginUp = useCallback(() => { setDraggingMargin(null) }, [])

  useEffect(() => {
    if (draggingMargin) {
      window.addEventListener("mousemove", handleMarginDrag)
      window.addEventListener("mouseup", handleMarginUp)
      return () => { window.removeEventListener("mousemove", handleMarginDrag); window.removeEventListener("mouseup", handleMarginUp) }
    }
  }, [draggingMargin, handleMarginDrag, handleMarginUp])

  if (!editor) return null

  const scale = zoom / 100
  const scaledW = PAGE_W * scale
  const totalPageH = PAGE_H * pageCount * scale

  /* Build ruler ticks */
  const rulerTicks = []
  const totalCm = Math.ceil(PAGE_W / RULER_CM)
  for (let i = 0; i <= totalCm; i++) {
    rulerTicks.push(
      <div key={i} className="absolute top-0" style={{ left: `${i * RULER_CM * scale}px` }}>
        <div className="w-px h-[10px] bg-[#888]" />
        <span className="absolute top-[10px] text-[8px] text-[#777] -translate-x-1/2 select-none">{i}</span>
      </div>
    )
    if (i < totalCm) {
      for (let j = 1; j < 10; j++) {
        const x = (i + j / 10) * RULER_CM * scale
        rulerTicks.push(
          <div key={`${i}-${j}`} className="absolute top-0" style={{ left: `${x}px` }}>
            <div className={`w-px ${j === 5 ? "h-[7px]" : "h-[4px]"} bg-[#bbb]`} />
          </div>
        )
      }
    }
  }

  /* Left ruler ticks (vertical) */
  const leftTicks = []
  const leftCm = Math.ceil((PAGE_H * pageCount) / RULER_CM)
  for (let i = 0; i <= leftCm; i++) {
    leftTicks.push(
      <div key={i} className="absolute left-0" style={{ top: `${i * RULER_CM * scale}px` }}>
        <div className="h-px w-[10px] bg-[#888]" />
        {i > 0 && <span className="absolute left-[11px] text-[8px] text-[#777] -translate-y-1/2 select-none">{i}</span>}
      </div>
    )
    if (i < leftCm) {
      for (let j = 1; j < 10; j++) {
        const y = (i + j / 10) * RULER_CM * scale
        leftTicks.push(
          <div key={`l${i}-${j}`} className="absolute left-0" style={{ top: `${y}px` }}>
            <div className={`h-px ${j === 5 ? "w-[7px]" : "w-[4px]"} bg-[#bbb]`} />
          </div>
        )
      }
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-lg overflow-hidden shadow-xl border border-[#c0c0c0] relative" style={{ fontFamily: "Segoe UI, Arial, sans-serif" }}>

      {/* ═══════ 1. BLUE HEADER BAR ═══════ */}
      <div className="h-[44px] bg-[#2b579a] flex items-center px-3 gap-2 select-none flex-shrink-0">
        {/* Doc icon */}
        <svg className="w-5 h-5 text-white/80" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z" /></svg>
        <span className="text-[13px] font-medium text-white truncate max-w-[220px]">{fileName}</span>

        {/* Quick access: undo/redo/save */}
        <div className="flex items-center gap-[2px] ml-4">
          <button onClick={() => editor.chain().focus().undo().run()} className="w-[28px] h-[28px] flex items-center justify-center rounded hover:bg-white/10 text-white/70 transition" title="Undo (Ctrl+Z)">
            <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
          </button>
          <button onClick={() => editor.chain().focus().redo().run()} className="w-[28px] h-[28px] flex items-center justify-center rounded hover:bg-white/10 text-white/70 transition" title="Redo (Ctrl+Y)">
            <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>
          </button>
          <button onClick={() => onExport(editor.getHTML())} className="w-[28px] h-[28px] flex items-center justify-center rounded hover:bg-white/10 text-white/70 transition" title="Save (Ctrl+S)">
            <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          </button>
        </div>

        <div className="flex-1" />
        {status && <span className="text-[11px] text-emerald-300 mr-2">{status}</span>}

        {/* Right-side header buttons */}
        <button onClick={() => setShowRightPanel(!showRightPanel)} className="w-[28px] h-[28px] flex items-center justify-center rounded hover:bg-white/10 text-white/70 transition" title="Toggle Panel">
          <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
        </button>
        <button onClick={onClose} className="px-3 py-1 rounded text-[12px] text-white/60 hover:bg-white/10 transition">✕</button>
      </div>

      {/* ═══════ 2 & 3. RIBBON ═══════ */}
      <OfficeRibbon
        editor={editor}
        activeTab={ribbonTab}
        onTabChange={setRibbonTab}
        fileName={fileName}
        onSave={() => onExport(editor.getHTML())}
        onSaveHTML={() => onExportHTML(editor.getHTML())}
        onSaveTXT={() => onExportTXT(editor.getText())}
        onPrint={() => onPrint(editor.getHTML())}
        onClose={onClose}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      {/* ═══════ MAIN AREA: rulers + editor + right toolbar ═══════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT RULER ── */}
        <div className="flex-shrink-0 overflow-hidden bg-[#f6f7f8] border-r border-[#d1d1d1]" style={{ width: `${RULER_SIZE}px` }}>
          <div className="relative" style={{ height: `${totalPageH + 40}px` }}>
            {leftTicks}
          </div>
        </div>

        {/* ── CENTER: top ruler + editor ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* TOP RULER */}
          <div className="flex-shrink-0 bg-[#f6f7f8] border-b border-[#d1d1d1] overflow-hidden" style={{ height: `${RULER_SIZE}px` }}>
            <div className="flex justify-center">
              <div ref={topRulerRef} className="relative" style={{ width: `${scaledW}px`, height: `${RULER_SIZE}px` }}>
                {/* ruler background zones */}
                <div className="absolute inset-0 bg-[#e0e0e0]" />
                <div className="absolute top-0 bottom-0 bg-white" style={{ left: `${marginLeft * scale}px`, right: `${marginRight * scale}px` }} />
                {/* ticks */}
                {rulerTicks}
                {/* margin handles */}
                <div
                  className="absolute top-0 bottom-0 w-[6px] cursor-col-resize z-10 hover:bg-blue-400/30"
                  style={{ left: `${marginLeft * scale - 3}px` }}
                  onMouseDown={() => setDraggingMargin("left")}
                  title="Left margin"
                />
                <div
                  className="absolute top-0 bottom-0 w-[6px] cursor-col-resize z-10 hover:bg-blue-400/30"
                  style={{ right: `${marginRight * scale - 3}px` }}
                  onMouseDown={() => setDraggingMargin("right")}
                  title="Right margin"
                />
              </div>
            </div>
          </div>

          {/* EDITOR AREA (gray background, centered white pages) */}
          <div ref={editorAreaRef} className="flex-1 overflow-auto bg-[#d4d4d4]">
            <div className="flex justify-center py-[20px]" style={{ minHeight: "100%" }}>
              <div style={{ width: `${scaledW}px` }}>
                <div
                  className="origin-top-left relative"
                  style={{
                    width: `${PAGE_W}px`,
                    transform: `scale(${scale})`,
                  }}
                >
                  {/* Visual page separators via CSS on the content area */}
                  <style>{`
                    .word-editor-pages {
                      background: white;
                      position: relative;
                    }
                    .word-editor-pages .ProseMirror {
                      outline: none;
                      min-height: ${PAGE_H - MARGIN_TOP - MARGIN_BOTTOM}px;
                    }
                    /* Draw page break lines and gaps every PAGE_H pixels */
                    .word-editor-page-container {
                      position: relative;
                      background:
                        repeating-linear-gradient(
                          to bottom,
                          white 0px,
                          white ${PAGE_H - 1}px,
                          #d4d4d4 ${PAGE_H - 1}px,
                          #d4d4d4 ${PAGE_H + 8}px
                        );
                      padding-bottom: 8px;
                    }
                    /* Page shadow overlay every PAGE_H px */
                    .word-editor-page-container::before {
                      content: '';
                      position: absolute;
                      top: 0; left: 0; right: 0; bottom: 0;
                      pointer-events: none;
                      background:
                        repeating-linear-gradient(
                          to bottom,
                          transparent 0px,
                          transparent ${PAGE_H - 2}px,
                          rgba(0,0,0,0.08) ${PAGE_H - 2}px,
                          rgba(0,0,0,0.08) ${PAGE_H - 1}px,
                          transparent ${PAGE_H - 1}px,
                          transparent ${PAGE_H + 8}px
                        );
                      z-index: 2;
                    }
                  `}</style>
                  <div
                    className="word-editor-page-container"
                    style={{
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div
                      className="word-editor-pages"
                      style={{
                        paddingTop: `${MARGIN_TOP}px`,
                        paddingBottom: `${MARGIN_BOTTOM}px`,
                        paddingLeft: `${marginLeft}px`,
                        paddingRight: `${marginRight}px`,
                        minHeight: `${PAGE_H}px`,
                      }}
                    >
                      <EditorContent
                        editor={editor}
                        className="prose prose-sm max-w-none text-black
                          [&_table]:border-collapse [&_td]:border [&_td]:border-gray-300 [&_td]:p-2
                          [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-50
                          [&_img]:max-w-full [&_img]:rounded
                          [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[800px]"
                      />
                    </div>
                  </div>
                  {/* Page number overlays */}
                  {Array.from({ length: pageCount }, (_, i) => (
                    <div key={i} className="absolute left-1/2 -translate-x-1/2 text-[9px] text-[#999] select-none pointer-events-none" style={{ top: `${(i + 1) * PAGE_H - 18 + i * 9}px`, zIndex: 3 }}>
                      Page {i + 1} of {pageCount}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT TOOLBAR ── */}
        <div className="flex-shrink-0 flex">
          {/* Icons column */}
          <div className="w-[36px] bg-[#f6f7f8] border-l border-[#d1d1d1] flex flex-col items-center pt-2 gap-1">
            <button
              onClick={() => { setRightPanelTab("comments"); setShowRightPanel(!showRightPanel || rightPanelTab !== "comments") }}
              className={`w-[28px] h-[28px] flex items-center justify-center rounded-[3px] transition ${rightPanelTab === "comments" && showRightPanel ? "bg-[#c4d5e8] text-[#2b579a]" : "text-[#666] hover:bg-[#e0e0e0]"}`}
              title="Comments"
            >
              <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
            </button>
            <button
              onClick={() => { setRightPanelTab("nav"); setShowRightPanel(!showRightPanel || rightPanelTab !== "nav") }}
              className={`w-[28px] h-[28px] flex items-center justify-center rounded-[3px] transition ${rightPanelTab === "nav" && showRightPanel ? "bg-[#c4d5e8] text-[#2b579a]" : "text-[#666] hover:bg-[#e0e0e0]"}`}
              title="Navigation"
            >
              <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
            </button>
            <button
              onClick={() => { setRightPanelTab("settings"); setShowRightPanel(!showRightPanel || rightPanelTab !== "settings") }}
              className={`w-[28px] h-[28px] flex items-center justify-center rounded-[3px] transition ${rightPanelTab === "settings" && showRightPanel ? "bg-[#c4d5e8] text-[#2b579a]" : "text-[#666] hover:bg-[#e0e0e0]"}`}
              title="Settings"
            >
              <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>

          {/* Expanded right panel */}
          {showRightPanel && (
            <div className="w-[220px] bg-white border-l border-[#d1d1d1] overflow-y-auto">
              <div className="p-3 border-b border-[#e0e0e0] flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#333] capitalize">{rightPanelTab}</span>
                <button onClick={() => setShowRightPanel(false)} className="text-[#999] hover:text-[#333]">
                  <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-3 text-[11px] text-[#666]">
                {rightPanelTab === "comments" && <p>No comments yet. Select text and add a comment.</p>}
                {rightPanelTab === "nav" && (
                  <div className="space-y-2">
                    <p className="font-medium text-[#333]">Document Headings</p>
                    <p className="text-[10px] text-[#999]">Headings from your document will appear here for quick navigation.</p>
                  </div>
                )}
                {rightPanelTab === "settings" && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-medium text-[#333] mb-1">Zoom</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="text-[#555] hover:text-[#000]">−</button>
                        <input type="range" min={50} max={200} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="flex-1 accent-[#2b579a]" />
                        <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="text-[#555] hover:text-[#000]">+</button>
                        <span className="text-[10px] w-[32px] text-center">{zoom}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-[#333] mb-1">Statistics</p>
                      <p>Words: {wordCount}</p>
                      <p>Characters: {charCount}</p>
                      <p>Pages: {pageCount}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ 7. STATUS BAR ═══════ */}
      <div className="h-[24px] bg-[#2b579a] flex items-center px-3 text-[11px] text-white/80 select-none flex-shrink-0">
        <span>Page {pageCount} of {pageCount}</span>
        <div className="w-px h-[12px] mx-3 bg-white/20" />
        <span>{wordCount} words</span>
        <div className="w-px h-[12px] mx-3 bg-white/20" />
        <span>{charCount} characters</span>
        <div className="w-px h-[12px] mx-3 bg-white/20" />
        <span>English</span>
        <div className="flex-1" />
        <div className="flex items-center gap-[6px]">
          <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="hover:text-white transition">
            <svg className="w-[12px] h-[12px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14" /></svg>
          </button>
          <input type="range" min={50} max={200} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-[80px] accent-white h-[3px]" />
          <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="hover:text-white transition">
            <svg className="w-[12px] h-[12px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" /></svg>
          </button>
          <span className="w-[36px] text-center text-[10px]">{zoom}%</span>
        </div>
      </div>
    </div>
  )
}
