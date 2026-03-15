"use client"

import { type Editor } from "@tiptap/react"
import { useState, useRef } from "react"

const FONTS = [
  "Arial", "Calibri", "Cambria", "Comic Sans MS", "Courier New", "Georgia",
  "Garamond", "Impact", "Lucida Console", "Segoe UI", "Tahoma",
  "Times New Roman", "Trebuchet MS", "Verdana",
]
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72]

export type RibbonTab = "file" | "home" | "insert" | "layout" | "references" | "collaboration" | "protection" | "view" | "plugins"

interface RibbonProps {
  editor: Editor
  activeTab: RibbonTab
  onTabChange: (tab: RibbonTab) => void
  fileName: string
  onSave: () => void
  onSaveHTML: () => void
  onSaveTXT: () => void
  onPrint: () => void
  onClose: () => void
  zoom: number
  onZoomChange: (z: number) => void
}

export default function OfficeRibbon({
  editor, activeTab, onTabChange, fileName,
  onSave, onSaveHTML, onSaveTXT, onPrint, onClose,
  zoom, onZoomChange,
}: RibbonProps) {
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [tableHover, setTableHover] = useState<[number, number]>([0, 0])
  const [showFileMenu, setShowFileMenu] = useState(false)
  const imageRef = useRef<HTMLInputElement>(null)

  const tabs: RibbonTab[] = ["file", "home", "insert", "layout", "references", "collaboration", "protection", "view", "plugins"]

  const handleInsertImage = () => {
    const input = document.createElement("input")
    input.type = "file"; input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => editor.chain().focus().setImage({ src: reader.result as string }).run()
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleInsertLink = () => {
    const url = prompt("Enter URL:")
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  const handleInsertTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    setShowTablePicker(false)
  }

  /* shared button classes */
  const btnBase = "w-[26px] h-[26px] flex items-center justify-center rounded-[3px] transition-colors duration-100"
  const btnNormal = "hover:bg-[#d6e4f0] text-[#444]"
  const btnActive = "bg-[#c4d5e8] text-[#1a5276]"
  const sepV = "w-px h-[38px] bg-[#d1d1d1] mx-[6px] self-center"
  const groupLabel = "text-[9px] text-[#666] text-center mt-[2px] tracking-wide select-none"
  const selBase = "h-[24px] px-[6px] border border-[#c0c0c0] rounded-[3px] text-[12px] bg-white text-[#333] outline-none focus:border-[#5b9bd5]"

  return (
    <>
      {/* RIBBON TABS BAR */}
      <div className="h-[32px] flex items-end bg-white border-b border-[#d1d1d1] px-1 select-none">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => { if (t === "file") setShowFileMenu(!showFileMenu); else { setShowFileMenu(false); onTabChange(t) } }}
            className={`px-[14px] py-[5px] text-[12px] font-medium capitalize transition-colors rounded-t-[3px] ${
              t === "file"
                ? "bg-[#2b579a] text-white hover:bg-[#1e3f73] mr-[2px]"
                : activeTab === t
                  ? "bg-white text-[#2b579a] border-t-[3px] border-x border-[#d1d1d1] border-t-[#2b579a] -mb-px"
                  : "text-[#444] hover:bg-[#eef3f8]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* FILE DROPDOWN */}
      {showFileMenu && (
        <div className="absolute left-0 top-[76px] z-50 w-[280px] bg-[#2b579a] shadow-2xl border border-[#1a3a66] text-white">
          <div className="p-2 space-y-[2px]">
            {[
              { label: "Save as .doc", action: onSave, icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" },
              { label: "Save as .html", action: onSaveHTML, icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25" },
              { label: "Save as .txt", action: onSaveTXT, icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
              { label: "Print", action: onPrint, icon: "M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18" },
              { label: "Close", action: () => { setShowFileMenu(false); onClose() }, icon: "M6 18L18 6M6 6l12 12" },
            ].map((item, i) => (
              <button key={i} onClick={() => { item.action(); setShowFileMenu(false) }}
                className="w-full flex items-center gap-3 px-4 py-[10px] text-[13px] rounded hover:bg-white/10 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RIBBON CONTENT */}
      <div className="min-h-[76px] bg-[#f6f7f8] border-b border-[#d1d1d1] flex items-start px-[10px] py-[4px] gap-[2px] overflow-x-auto select-none">
        {/* ──────── HOME TAB ──────── */}
        {activeTab === "home" && (
          <>
            {/* Clipboard Group */}
            <div className="flex flex-col items-center px-[6px]">
              <div className="flex items-center gap-[2px]">
                <button onClick={() => document.execCommand("paste")} className={`${btnBase} w-[40px] h-[40px] ${btnNormal}`} title="Paste">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                </button>
                <div className="flex flex-col gap-[1px]">
                  <button onClick={() => document.execCommand("cut")} className={`${btnBase} ${btnNormal} w-[22px] h-[18px]`} title="Cut">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.121 14.121L7.05 9.88m0 4.242l7.07-4.243M9.879 9.879a3 3 0 11-4.243-4.243 3 3 0 014.243 4.243zm4.242 4.242a3 3 0 104.243 4.243 3 3 0 00-4.243-4.243z" /></svg>
                  </button>
                  <button onClick={() => document.execCommand("copy")} className={`${btnBase} ${btnNormal} w-[22px] h-[18px]`} title="Copy">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
                  </button>
                </div>
              </div>
              <div className={groupLabel}>Clipboard</div>
            </div>
            <div className={sepV} />

            {/* Font Group */}
            <div className="flex flex-col items-center px-[4px]">
              <div className="flex items-center gap-[3px] flex-wrap">
                <select
                  value={editor.getAttributes("textStyle").fontFamily || "Arial"}
                  onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}
                  className={`${selBase} w-[120px]`}
                >
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select
                  value={editor.getAttributes("textStyle").fontSize?.replace("px", "") || "12"}
                  onChange={e => editor.chain().focus().setFontSize(e.target.value + "px").run()}
                  className={`${selBase} w-[52px]`}
                >
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-[1px] mt-[3px]">
                <button onClick={() => editor.chain().focus().toggleBold().run()} className={`${btnBase} ${editor.isActive("bold") ? btnActive : btnNormal}`} title="Bold (Ctrl+B)">
                  <span className="text-[13px] font-bold">B</span>
                </button>
                <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btnBase} ${editor.isActive("italic") ? btnActive : btnNormal}`} title="Italic (Ctrl+I)">
                  <span className="text-[13px] italic font-serif">I</span>
                </button>
                <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${btnBase} ${editor.isActive("underline") ? btnActive : btnNormal}`} title="Underline (Ctrl+U)">
                  <span className="text-[13px] underline">U</span>
                </button>
                <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`${btnBase} ${editor.isActive("strike") ? btnActive : btnNormal}`} title="Strikethrough">
                  <span className="text-[13px] line-through">ab</span>
                </button>
                <button onClick={() => editor.chain().focus().toggleSubscript().run()} className={`${btnBase} ${editor.isActive("subscript") ? btnActive : btnNormal}`} title="Subscript">
                  <span className="text-[10px]">X<sub className="text-[7px]">2</sub></span>
                </button>
                <button onClick={() => editor.chain().focus().toggleSuperscript().run()} className={`${btnBase} ${editor.isActive("superscript") ? btnActive : btnNormal}`} title="Superscript">
                  <span className="text-[10px]">X<sup className="text-[7px]">2</sup></span>
                </button>
                <div className="relative">
                  <input type="color" onChange={e => editor.chain().focus().setColor(e.target.value).run()} className="absolute inset-0 opacity-0 w-[26px] h-[26px] cursor-pointer" />
                  <div className={`${btnBase} ${btnNormal}`}>
                    <div className="flex flex-col items-center">
                      <span className="text-[12px] font-bold leading-none" style={{ color: editor.getAttributes("textStyle").color || "#000" }}>A</span>
                      <div className="w-[14px] h-[3px] rounded-sm mt-[1px]" style={{ background: editor.getAttributes("textStyle").color || "#000" }} />
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <input type="color" defaultValue="#ffff00" onChange={e => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} className="absolute inset-0 opacity-0 w-[26px] h-[26px] cursor-pointer" />
                  <div className={`${btnBase} ${btnNormal}`}>
                    <div className="flex flex-col items-center">
                      <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none"><rect x="2" y="16" width="20" height="5" rx="1" fill="#fef08a" /><path d="M7 16V10l5-5 5 5v6" stroke="#666" strokeWidth="1.5" /></svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className={groupLabel}>Font</div>
            </div>
            <div className={sepV} />

            {/* Paragraph Group */}
            <div className="flex flex-col items-center px-[4px]">
              <div className="flex items-center gap-[1px]">
                <button onClick={() => editor.chain().focus().setTextAlign("left").run()} className={`${btnBase} ${editor.isActive({ textAlign: "left" }) ? btnActive : btnNormal}`} title="Align Left">
                  <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h10M3 18h14" /></svg>
                </button>
                <button onClick={() => editor.chain().focus().setTextAlign("center").run()} className={`${btnBase} ${editor.isActive({ textAlign: "center" }) ? btnActive : btnNormal}`} title="Center">
                  <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M7 12h10M5 18h14" /></svg>
                </button>
                <button onClick={() => editor.chain().focus().setTextAlign("right").run()} className={`${btnBase} ${editor.isActive({ textAlign: "right" }) ? btnActive : btnNormal}`} title="Align Right">
                  <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M11 12h10M7 18h14" /></svg>
                </button>
                <button onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={`${btnBase} ${editor.isActive({ textAlign: "justify" }) ? btnActive : btnNormal}`} title="Justify">
                  <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
                </button>
              </div>
              <div className="flex items-center gap-[1px] mt-[3px]">
                <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btnBase} ${editor.isActive("bulletList") ? btnActive : btnNormal}`} title="Bullet List">
                  <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                </button>
                <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${btnBase} ${editor.isActive("orderedList") ? btnActive : btnNormal}`} title="Numbered List">
                  <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 6h11M10 12h11M10 18h11M3 5l2 1V4M3 11h2l-2 2M3 17h1.5l.5-.5.5.5H7" /></svg>
                </button>
                <button onClick={() => editor.chain().focus().sinkListItem("listItem").run()} className={`${btnBase} ${btnNormal}`} title="Increase Indent">
                  <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M11 12h10M11 18h10M3 10.5l3 1.5-3 1.5" /></svg>
                </button>
                <button onClick={() => editor.chain().focus().liftListItem("listItem").run()} className={`${btnBase} ${btnNormal}`} title="Decrease Indent">
                  <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M11 12h10M11 18h10M6 10.5L3 12l3 1.5" /></svg>
                </button>
              </div>
              <div className={groupLabel}>Paragraph</div>
            </div>
            <div className={sepV} />

            {/* Styles Group */}
            <div className="flex flex-col items-center px-[4px]">
              <div className="flex items-center gap-[2px]">
                {([1, 2, 3] as const).map(level => (
                  <button key={level} onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
                    className={`px-[8px] h-[26px] rounded-[3px] text-[11px] font-semibold transition ${editor.isActive("heading", { level }) ? btnActive : btnNormal}`}>
                    H{level}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-[2px] mt-[3px]">
                <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${btnBase} ${editor.isActive("blockquote") ? btnActive : btnNormal}`} title="Blockquote">
                  <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 11H6a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 011 1v3zm0 0a4 4 0 01-4 4m14-4h-4a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 011 1v3zm0 0a4 4 0 01-4 4" /></svg>
                </button>
                <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`${btnBase} ${editor.isActive("codeBlock") ? btnActive : btnNormal}`} title="Code Block">
                  <span className="text-[10px] font-mono">&lt;/&gt;</span>
                </button>
              </div>
              <div className={groupLabel}>Styles</div>
            </div>
          </>
        )}

        {/* ──────── INSERT TAB ──────── */}
        {activeTab === "insert" && (
          <>
            <div className="flex flex-col items-center px-[6px] relative">
              <button onClick={() => setShowTablePicker(!showTablePicker)} className={`${btnBase} w-[44px] h-[44px] ${btnNormal} flex-col gap-[2px]`} title="Insert Table">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg>
                <span className="text-[9px]">Table</span>
              </button>
              {showTablePicker && (
                <div className="absolute top-full left-0 mt-1 p-2 rounded shadow-xl z-50 bg-white border border-[#d1d1d1]">
                  <div className="grid grid-cols-8 gap-[2px]">
                    {Array.from({ length: 64 }, (_, i) => {
                      const r = Math.floor(i / 8), c = i % 8
                      return (
                        <button key={i} className={`w-[18px] h-[18px] border rounded-sm ${r <= tableHover[0] && c <= tableHover[1] ? "bg-[#5b9bd5] border-[#4a8ac4]" : "border-[#d1d1d1]"}`}
                          onMouseEnter={() => setTableHover([r, c])} onClick={() => handleInsertTable(r + 1, c + 1)} />
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-center mt-1 text-[#666]">{tableHover[0] + 1} × {tableHover[1] + 1}</p>
                </div>
              )}
              <div className={groupLabel}>Table</div>
            </div>
            <div className={sepV} />
            <div className="flex flex-col items-center px-[6px]">
              <div className="flex items-center gap-[4px]">
                <button onClick={handleInsertImage} className={`${btnBase} w-[44px] h-[44px] ${btnNormal} flex-col gap-[2px]`} title="Insert Image">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                  <span className="text-[9px]">Image</span>
                </button>
                <button onClick={handleInsertLink} className={`${btnBase} w-[44px] h-[44px] ${btnNormal} flex-col gap-[2px]`} title="Insert Link">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-4.07a4.5 4.5 0 00-6.364-6.364L4.5 6.257" /></svg>
                  <span className="text-[9px]">Link</span>
                </button>
              </div>
              <div className={groupLabel}>Media</div>
            </div>
            <div className={sepV} />
            <div className="flex flex-col items-center px-[6px]">
              <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className={`${btnBase} w-[44px] h-[44px] ${btnNormal} flex-col gap-[2px]`} title="Page Break">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
                <span className="text-[9px]">Break</span>
              </button>
              <div className={groupLabel}>Pages</div>
            </div>
          </>
        )}

        {/* ──────── LAYOUT TAB ──────── */}
        {activeTab === "layout" && (
          <>
            <div className="flex flex-col items-center px-[6px]">
              <div className="flex items-center gap-[4px]">
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[10px] text-[#555]">Margins</span>
                  <select className={`${selBase} w-[110px]`}>
                    <option>Normal (2.54cm)</option>
                    <option>Narrow (1.27cm)</option>
                    <option>Wide (3.18cm)</option>
                    <option>Custom</option>
                  </select>
                </div>
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[10px] text-[#555]">Orientation</span>
                  <select className={`${selBase} w-[100px]`}>
                    <option>Portrait</option>
                    <option>Landscape</option>
                  </select>
                </div>
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[10px] text-[#555]">Size</span>
                  <select className={`${selBase} w-[110px]`}>
                    <option>A4 (21×29.7cm)</option>
                    <option>Letter (21.6×27.9cm)</option>
                    <option>Legal (21.6×35.6cm)</option>
                  </select>
                </div>
              </div>
              <div className={groupLabel}>Page Setup</div>
            </div>
          </>
        )}

        {/* ──────── REFERENCES TAB ──────── */}
        {activeTab === "references" && (
          <div className="flex items-center px-[12px] h-[60px]">
            <span className="text-[12px] text-[#888]">Table of Contents, Footnotes, and Citations will appear here.</span>
          </div>
        )}

        {/* ──────── COLLABORATION TAB ──────── */}
        {activeTab === "collaboration" && (
          <div className="flex items-center px-[12px] h-[60px]">
            <span className="text-[12px] text-[#888]">Comments, Track Changes, and Sharing options will appear here.</span>
          </div>
        )}

        {/* ──────── PROTECTION TAB ──────── */}
        {activeTab === "protection" && (
          <div className="flex items-center px-[12px] h-[60px]">
            <span className="text-[12px] text-[#888]">Document protection and permissions settings.</span>
          </div>
        )}

        {/* ──────── VIEW TAB ──────── */}
        {activeTab === "view" && (
          <>
            <div className="flex flex-col items-center px-[6px]">
              <div className="flex items-center gap-[4px]">
                <button onClick={() => onZoomChange(Math.max(50, zoom - 10))} className={`${btnBase} ${btnNormal}`}>
                  <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" /></svg>
                </button>
                <span className="text-[12px] text-[#555] w-[40px] text-center">{zoom}%</span>
                <button onClick={() => onZoomChange(Math.min(200, zoom + 10))} className={`${btnBase} ${btnNormal}`}>
                  <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
                </button>
                <button onClick={() => onZoomChange(100)} className={`px-[8px] h-[26px] rounded-[3px] text-[11px] ${btnNormal}`}>100%</button>
              </div>
              <div className={groupLabel}>Zoom</div>
            </div>
          </>
        )}

        {/* ──────── PLUGINS TAB ──────── */}
        {activeTab === "plugins" && (
          <div className="flex items-center px-[12px] h-[60px]">
            <span className="text-[12px] text-[#888]">Plugin extensions and add-ons.</span>
          </div>
        )}
      </div>
    </>
  )
}
