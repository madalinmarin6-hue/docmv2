"use client"

import { useState, useCallback } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type SlideLayout = "title" | "content" | "two-col" | "blank" | "section" | "image"

type Slide = {
  title: string
  subtitle: string
  content: string
  contentRight: string
  notes: string
  bg: string
  titleColor: string
  contentColor: string
  layout: SlideLayout
  titleSize: number
  contentSize: number
  titleBold: boolean
  titleItalic: boolean
  contentBold: boolean
  contentItalic: boolean
  titleAlign: "left" | "center" | "right"
  contentAlign: "left" | "center" | "right"
  imageUrl: string
}

function makeSlide(overrides?: Partial<Slide>): Slide {
  return {
    title: "New Slide", subtitle: "", content: "", contentRight: "", notes: "",
    bg: "#1e293b", titleColor: "#60a5fa", contentColor: "#cbd5e1",
    layout: "content", titleSize: 32, contentSize: 18,
    titleBold: true, titleItalic: false, contentBold: false, contentItalic: false,
    titleAlign: "left", contentAlign: "left", imageUrl: "",
    ...overrides,
  }
}

const bgOptions = ["#1e293b", "#0f172a", "#1a1a2e", "#16213e", "#0d1b2a", "#ffffff", "#f8fafc", "#fef3c7", "#1e3a5f", "#2d1b4e", "#0a2f1e", "#3b0d0d"]

const layoutOptions: { value: SlideLayout; label: string; icon: string }[] = [
  { value: "title", label: "Title", icon: "T" },
  { value: "content", label: "Title + Content", icon: "TC" },
  { value: "two-col", label: "Two Columns", icon: "2C" },
  { value: "section", label: "Section", icon: "S" },
  { value: "image", label: "Image", icon: "I" },
  { value: "blank", label: "Blank", icon: "B" },
]

const themes = [
  { name: "Dark Blue", bg: "#1e293b", title: "#60a5fa", content: "#cbd5e1" },
  { name: "Deep Navy", bg: "#0f172a", title: "#a78bfa", content: "#e2e8f0" },
  { name: "Midnight", bg: "#1a1a2e", title: "#34d399", content: "#d1d5db" },
  { name: "Ocean", bg: "#1e3a5f", title: "#67e8f9", content: "#e0f2fe" },
  { name: "Royal", bg: "#2d1b4e", title: "#f0abfc", content: "#e9d5ff" },
  { name: "Light", bg: "#ffffff", title: "#1e40af", content: "#374151" },
  { name: "Soft", bg: "#f8fafc", title: "#7c3aed", content: "#4b5563" },
  { name: "Warm", bg: "#fef3c7", title: "#b45309", content: "#78350f" },
]

export default function PowerPointEditorPage() {
  usePing()
  const [slides, setSlides] = useState<Slide[]>([])
  const [activeSlide, setActiveSlide] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState("")
  const [fileName, setFileName] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [tab, setTab] = useState<"design" | "format" | "layout">("design")

  const handleImport = useCallback(async (file: File) => {
    setFileName(file.name)
    setStatus("Loading presentation...")
    try {
      const text = await file.text()
      const lines = text.split("\n").filter(l => l.trim())
      const importedSlides: Slide[] = []
      for (let i = 0; i < lines.length; i += 2) {
        importedSlides.push(makeSlide({
          title: lines[i] || `Slide ${importedSlides.length + 1}`,
          content: lines[i + 1] || "",
        }))
      }
      if (importedSlides.length === 0) importedSlides.push(makeSlide())
      setSlides(importedSlides)
      setLoaded(true)
      setStatus(`Loaded ${importedSlides.length} slides`)
      window.dispatchEvent(new Event("docm-collapse-sidebar"))
    } catch {
      setStatus("Error loading file")
    }
  }, [])

  const handleNewDoc = () => {
    setSlides([
      makeSlide({ title: "My Presentation", subtitle: "Created with DocM", layout: "title", titleAlign: "center", contentAlign: "center", titleSize: 44 }),
      makeSlide({ title: "Overview", content: "• Point one\n• Point two\n• Point three", layout: "content", bg: "#0f172a", titleColor: "#a78bfa" }),
      makeSlide({ title: "Details", content: "Left column content", contentRight: "Right column content", layout: "two-col", bg: "#1a1a2e", titleColor: "#34d399" }),
      makeSlide({ title: "Thank You", subtitle: "Questions?", layout: "section", titleAlign: "center", contentAlign: "center", bg: "#16213e", titleColor: "#f0abfc" }),
    ])
    setFileName("presentation.pptx")
    setLoaded(true)
    setStatus("New presentation created")
    window.dispatchEvent(new Event("docm-collapse-sidebar"))
  }

  const handleExport = useCallback(async () => {
    setStatus("Exporting...")
    try {
      const PptxGenJS = (await import("pptxgenjs")).default
      const pptx = new PptxGenJS()
      pptx.layout = "LAYOUT_WIDE"

      for (const slide of slides) {
        const s = pptx.addSlide()
        s.background = { fill: slide.bg.replace("#", "") }
        const isLight = ["#ffffff", "#f8fafc", "#fef3c7"].includes(slide.bg)

        if (slide.layout === "title" || slide.layout === "section") {
          s.addText(slide.title, {
            x: 0.5, y: 1.5, w: "90%", h: 1.5,
            fontSize: slide.titleSize, bold: slide.titleBold, italic: slide.titleItalic,
            color: slide.titleColor.replace("#", ""),
            align: slide.titleAlign,
          })
          if (slide.subtitle) {
            s.addText(slide.subtitle, {
              x: 0.5, y: 3.2, w: "90%",
              fontSize: 22, color: isLight ? "666666" : "999999",
              align: slide.titleAlign,
            })
          }
        } else if (slide.layout === "two-col") {
          s.addText(slide.title, {
            x: 0.5, y: 0.3, w: "90%",
            fontSize: slide.titleSize, bold: slide.titleBold, italic: slide.titleItalic,
            color: slide.titleColor.replace("#", ""), align: slide.titleAlign,
          })
          s.addText(slide.content, {
            x: 0.5, y: 1.5, w: "45%", h: 4,
            fontSize: slide.contentSize, bold: slide.contentBold, italic: slide.contentItalic,
            color: slide.contentColor.replace("#", ""), align: slide.contentAlign, valign: "top",
          })
          s.addText(slide.contentRight, {
            x: 5.5, y: 1.5, w: "45%", h: 4,
            fontSize: slide.contentSize, bold: slide.contentBold, italic: slide.contentItalic,
            color: slide.contentColor.replace("#", ""), align: slide.contentAlign, valign: "top",
          })
        } else if (slide.layout !== "blank") {
          s.addText(slide.title, {
            x: 0.5, y: 0.3, w: "90%",
            fontSize: slide.titleSize, bold: slide.titleBold, italic: slide.titleItalic,
            color: slide.titleColor.replace("#", ""), align: slide.titleAlign,
          })
          if (slide.content) {
            s.addText(slide.content, {
              x: 0.5, y: 1.5, w: "90%", h: 4,
              fontSize: slide.contentSize, bold: slide.contentBold, italic: slide.contentItalic,
              color: slide.contentColor.replace("#", ""), align: slide.contentAlign, valign: "top",
            })
          }
        }
        if (slide.notes) s.addNotes(slide.notes)
      }

      const outName = (fileName.replace(/\.[^.]+$/, "") || "presentation") + ".pptx"
      const pptxBuf = await pptx.write({ outputType: "arraybuffer" }) as ArrayBuffer
      const blob = new Blob([pptxBuf], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = outName; a.click(); URL.revokeObjectURL(url)
      setStatus("Exported as .pptx!")
      const editResult = await trackEdit({ fileName: outName, fileSize: blob.size, fileType: "pptx", toolUsed: "powerpoint-editor" })
      if (!editResult.allowed) { setStatus(editResult.error || "Edit limit reached"); return }
      saveToCloud(blob, outName, "powerpoint-editor")
    } catch (e) {
      console.error(e)
      setStatus("Error exporting")
    }
  }, [slides, fileName])

  const update = (field: keyof Slide, value: any) => {
    setSlides(prev => prev.map((s, i) => i === activeSlide ? { ...s, [field]: value } : s))
  }

  const addSlide = (layout: SlideLayout = "content") => {
    const newSlide = makeSlide({ title: `Slide ${slides.length + 1}`, layout })
    setSlides(prev => [...prev.slice(0, activeSlide + 1), newSlide, ...prev.slice(activeSlide + 1)])
    setActiveSlide(activeSlide + 1)
  }

  const duplicateSlide = () => {
    const copy = { ...slides[activeSlide] }
    setSlides(prev => [...prev.slice(0, activeSlide + 1), copy, ...prev.slice(activeSlide + 1)])
    setActiveSlide(activeSlide + 1)
  }

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) return
    setSlides(prev => prev.filter((_, i) => i !== index))
    if (activeSlide >= slides.length - 1) setActiveSlide(Math.max(0, slides.length - 2))
  }

  const moveSlide = (from: number, dir: -1 | 1) => {
    const to = from + dir
    if (to < 0 || to >= slides.length) return
    setSlides(prev => {
      const copy = [...prev]
      ;[copy[from], copy[to]] = [copy[to], copy[from]]
      return copy
    })
    setActiveSlide(to)
  }

  const applyTheme = (theme: typeof themes[0]) => {
    update("bg", theme.bg)
    update("titleColor", theme.title)
    update("contentColor", theme.content)
  }

  const applyThemeAll = (theme: typeof themes[0]) => {
    setSlides(prev => prev.map(s => ({ ...s, bg: theme.bg, titleColor: theme.title, contentColor: theme.content })))
  }

  const current = slides[activeSlide]
  const isLight = current && ["#ffffff", "#f8fafc", "#fef3c7"].includes(current.bg)

  const btnCls = "px-2.5 py-1.5 rounded-lg text-xs transition"
  const btnN = `${btnCls} bg-white/5 hover:bg-white/10 text-white/60`
  const btnA = `${btnCls} bg-orange-500/20 text-orange-300 border border-orange-400/30`

  return (
    <ToolLayout title="PowerPoint Editor" subtitle="Create and export presentations (.pptx)">
      {!loaded ? (
        <div className="space-y-4">
          <FileUploader accept=".pptx,.ppt,.txt" label="Import a presentation" sublabel="Supports .pptx, .ppt, .txt files" onFile={handleImport} cloudFilterTypes={["pptx", "ppt"]} />
          <div className="flex justify-center">
            <button onClick={handleNewDoc} className="px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-400/30 hover:scale-105 transition-all">
              Or create a new presentation
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">

          {/* TOP TOOLBAR */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 flex-wrap">
            <div className="flex items-center gap-1">
              <button onClick={() => addSlide("content")} className={btnN}>+ Slide</button>
              <button onClick={duplicateSlide} className={btnN} title="Duplicate">⧉</button>
              <button onClick={() => moveSlide(activeSlide, -1)} className={btnN} title="Move Up">↑</button>
              <button onClick={() => moveSlide(activeSlide, 1)} className={btnN} title="Move Down">↓</button>
            </div>
            <div className="w-px h-6 bg-white/10" />

            {/* TABS */}
            <div className="flex gap-1">
              {(["design", "format", "layout"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className={tab === t ? btnA : btnN}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="w-px h-6 bg-white/10" />

            <button onClick={() => setShowNotes(!showNotes)} className={showNotes ? btnA : btnN}>Notes</button>

            <div className="flex-1" />
            <span className="text-[10px] text-white/30">{activeSlide + 1} / {slides.length}</span>
            {status && <span className="text-xs text-emerald-400">{status}</span>}
            <button onClick={handleExport} className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-orange-500/20">
              Export .pptx
            </button>
            <button onClick={() => { setLoaded(false); setSlides([]); setStatus("") }} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition">Close</button>
          </div>

          {/* TAB CONTENT */}
          {current && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 flex-wrap">
              {tab === "design" && (
                <>
                  <span className="text-[10px] text-white/40 mr-1">Themes:</span>
                  {themes.map(t => (
                    <button key={t.name} onClick={() => applyTheme(t)} onDoubleClick={() => applyThemeAll(t)}
                      className={`w-8 h-8 rounded-lg border-2 transition flex items-center justify-center text-[8px] font-bold ${current.bg === t.bg ? "border-orange-400 scale-110" : "border-white/10 hover:border-white/30"}`}
                      style={{ backgroundColor: t.bg, color: t.title }} title={`${t.name} (double-click = all slides)`}>
                      Aa
                    </button>
                  ))}
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <span className="text-[10px] text-white/40">Custom:</span>
                  <label className="text-[9px] text-white/30">BG</label>
                  <input type="color" value={current.bg} onChange={e => update("bg", e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
                  <label className="text-[9px] text-white/30">Title</label>
                  <input type="color" value={current.titleColor} onChange={e => update("titleColor", e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
                  <label className="text-[9px] text-white/30">Text</label>
                  <input type="color" value={current.contentColor} onChange={e => update("contentColor", e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
                </>
              )}
              {tab === "format" && (
                <>
                  <span className="text-[10px] text-white/40 mr-1">Title:</span>
                  <input type="number" value={current.titleSize} onChange={e => update("titleSize", Number(e.target.value))} className="w-12 h-7 px-1 rounded bg-white/5 border border-white/10 text-xs text-white text-center" title="Title font size" />
                  <button onClick={() => update("titleBold", !current.titleBold)} className={current.titleBold ? btnA : btnN} title="Bold"><b>B</b></button>
                  <button onClick={() => update("titleItalic", !current.titleItalic)} className={current.titleItalic ? btnA : btnN} title="Italic"><i>I</i></button>
                  {(["left", "center", "right"] as const).map(a => (
                    <button key={a} onClick={() => update("titleAlign", a)} className={current.titleAlign === a ? btnA : btnN} title={a}>
                      {a === "left" ? "⇐" : a === "center" ? "⇔" : "⇒"}
                    </button>
                  ))}
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <span className="text-[10px] text-white/40 mr-1">Content:</span>
                  <input type="number" value={current.contentSize} onChange={e => update("contentSize", Number(e.target.value))} className="w-12 h-7 px-1 rounded bg-white/5 border border-white/10 text-xs text-white text-center" title="Content font size" />
                  <button onClick={() => update("contentBold", !current.contentBold)} className={current.contentBold ? btnA : btnN} title="Bold"><b>B</b></button>
                  <button onClick={() => update("contentItalic", !current.contentItalic)} className={current.contentItalic ? btnA : btnN} title="Italic"><i>I</i></button>
                  {(["left", "center", "right"] as const).map(a => (
                    <button key={`c${a}`} onClick={() => update("contentAlign", a)} className={current.contentAlign === a ? btnA : btnN} title={a}>
                      {a === "left" ? "⇐" : a === "center" ? "⇔" : "⇒"}
                    </button>
                  ))}
                </>
              )}
              {tab === "layout" && (
                <>
                  <span className="text-[10px] text-white/40 mr-1">Slide Layout:</span>
                  {layoutOptions.map(l => (
                    <button key={l.value} onClick={() => update("layout", l.value)}
                      className={`${current.layout === l.value ? btnA : btnN} min-w-[60px]`}>
                      <span className="text-[9px] opacity-50 mr-1">{l.icon}</span>{l.label}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* MAIN AREA */}
          <div className="flex gap-3 overflow-auto" style={{ height: showNotes ? "calc(70vh - 40px)" : "70vh" }}>

            {/* SLIDE THUMBNAILS */}
            <div className="w-36 flex-shrink-0 space-y-2 overflow-y-auto pr-1">
              {slides.map((slide, i) => (
                <div key={i} className="relative group">
                  <button onClick={() => setActiveSlide(i)}
                    className={`w-full aspect-video rounded-xl border-2 transition-all p-2 text-left overflow-hidden ${i === activeSlide ? "border-orange-400 ring-2 ring-orange-400/20" : "border-white/10 hover:border-white/20"}`}
                    style={{ backgroundColor: slide.bg }}>
                    <p className="text-[9px] font-bold truncate" style={{ color: slide.titleColor }}>{slide.title}</p>
                    <p className="text-[7px] opacity-50 truncate mt-0.5" style={{ color: slide.contentColor }}>{slide.content || slide.subtitle}</p>
                    <span className="absolute bottom-0.5 right-1.5 text-[7px] text-white/20">{slide.layout}</span>
                  </button>
                  <span className="absolute top-0.5 left-1 text-[8px] text-white/30 font-mono">{i + 1}</span>
                  {slides.length > 1 && (
                    <button onClick={() => deleteSlide(i)}
                      className="absolute top-0.5 right-1 w-4 h-4 rounded-full bg-red-500/80 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      &times;
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addSlide()} className="w-full aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 flex items-center justify-center text-white/20 text-xl transition hover:text-white/40">+</button>
            </div>

            {/* SLIDE CANVAS */}
            {current && (
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div className="flex-1 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col transition-colors"
                  style={{ backgroundColor: current.bg }}>

                  {/* Slide content based on layout */}
                  {current.layout === "title" || current.layout === "section" ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10">
                      <input value={current.title} onChange={e => update("title", e.target.value)}
                        className="bg-transparent outline-none border-b border-transparent hover:border-white/20 focus:border-blue-400/50 pb-2 mb-4 transition w-full max-w-2xl"
                        style={{ color: current.titleColor, fontSize: `${current.titleSize}px`, fontWeight: current.titleBold ? 700 : 400, fontStyle: current.titleItalic ? "italic" : "normal", textAlign: current.titleAlign }}
                        placeholder="Title" />
                      <input value={current.subtitle} onChange={e => update("subtitle", e.target.value)}
                        className="bg-transparent outline-none border-b border-transparent hover:border-white/20 focus:border-blue-400/50 pb-1 transition w-full max-w-xl text-center"
                        style={{ color: isLight ? "#666" : "#999", fontSize: "20px" }}
                        placeholder="Subtitle" />
                    </div>
                  ) : current.layout === "two-col" ? (
                    <div className="flex-1 flex flex-col p-8">
                      <input value={current.title} onChange={e => update("title", e.target.value)}
                        className="bg-transparent outline-none border-b border-transparent hover:border-white/20 focus:border-blue-400/50 pb-2 mb-4 transition"
                        style={{ color: current.titleColor, fontSize: `${current.titleSize}px`, fontWeight: current.titleBold ? 700 : 400, fontStyle: current.titleItalic ? "italic" : "normal", textAlign: current.titleAlign }}
                        placeholder="Title" />
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <textarea value={current.content} onChange={e => update("content", e.target.value)}
                          className="bg-transparent outline-none resize-none rounded-lg p-2 hover:bg-white/5 focus:bg-white/5 transition"
                          style={{ color: current.contentColor, fontSize: `${current.contentSize}px`, fontWeight: current.contentBold ? 700 : 400, fontStyle: current.contentItalic ? "italic" : "normal", textAlign: current.contentAlign }}
                          placeholder="Left column" />
                        <textarea value={current.contentRight} onChange={e => update("contentRight", e.target.value)}
                          className="bg-transparent outline-none resize-none rounded-lg p-2 hover:bg-white/5 focus:bg-white/5 transition"
                          style={{ color: current.contentColor, fontSize: `${current.contentSize}px`, fontWeight: current.contentBold ? 700 : 400, fontStyle: current.contentItalic ? "italic" : "normal", textAlign: current.contentAlign }}
                          placeholder="Right column" />
                      </div>
                    </div>
                  ) : current.layout === "blank" ? (
                    <div className="flex-1 p-8">
                      <textarea value={current.content} onChange={e => update("content", e.target.value)}
                        className="w-full h-full bg-transparent outline-none resize-none"
                        style={{ color: current.contentColor, fontSize: `${current.contentSize}px` }}
                        placeholder="Free-form content" />
                    </div>
                  ) : current.layout === "image" ? (
                    <div className="flex-1 flex flex-col p-8">
                      <input value={current.title} onChange={e => update("title", e.target.value)}
                        className="bg-transparent outline-none border-b border-transparent hover:border-white/20 focus:border-blue-400/50 pb-2 mb-4 transition"
                        style={{ color: current.titleColor, fontSize: `${current.titleSize}px`, fontWeight: current.titleBold ? 700 : 400, textAlign: current.titleAlign }}
                        placeholder="Title" />
                      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl relative">
                        {current.imageUrl ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <img src={current.imageUrl} alt="" className="max-w-full max-h-full object-contain rounded" />
                            <button onClick={() => update("imageUrl", "")} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 text-white text-sm flex items-center justify-center hover:bg-red-600 transition" title="Remove image">&times;</button>
                          </div>
                        ) : (
                          <label className="cursor-pointer text-center p-6">
                            <p className={`text-sm ${isLight ? "text-gray-400" : "text-white/30"}`}>Click to add image</p>
                            <input type="file" accept="image/*" className="hidden" onChange={e => {
                              const f = e.target.files?.[0]
                              if (f) {
                                const img = new Image()
                                const url = URL.createObjectURL(f)
                                img.onload = () => {
                                  const MAX = 1200
                                  let w = img.width, h = img.height
                                  if (w > MAX || h > MAX) {
                                    if (w > h) { h = Math.round(h * MAX / w); w = MAX }
                                    else { w = Math.round(w * MAX / h); h = MAX }
                                  }
                                  const canvas = document.createElement("canvas")
                                  canvas.width = w; canvas.height = h
                                  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
                                  const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
                                  update("imageUrl", dataUrl)
                                  URL.revokeObjectURL(url)
                                }
                                img.src = url
                              }
                            }} />
                          </label>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* default: content layout */
                    <div className="flex-1 flex flex-col p-8">
                      <input value={current.title} onChange={e => update("title", e.target.value)}
                        className="bg-transparent outline-none border-b border-transparent hover:border-white/20 focus:border-blue-400/50 pb-2 mb-4 transition"
                        style={{ color: current.titleColor, fontSize: `${current.titleSize}px`, fontWeight: current.titleBold ? 700 : 400, fontStyle: current.titleItalic ? "italic" : "normal", textAlign: current.titleAlign }}
                        placeholder="Title" />
                      <textarea value={current.content} onChange={e => update("content", e.target.value)}
                        className="flex-1 bg-transparent outline-none resize-none rounded-lg p-2 hover:bg-white/5 focus:bg-white/5 transition"
                        style={{ color: current.contentColor, fontSize: `${current.contentSize}px`, fontWeight: current.contentBold ? 700 : 400, fontStyle: current.contentItalic ? "italic" : "normal", textAlign: current.contentAlign }}
                        placeholder="Click to add content" />
                    </div>
                  )}
                </div>

                {/* NOTES */}
                {showNotes && (
                  <div className="h-24 rounded-xl border border-white/10 bg-white/5 overflow-hidden flex flex-col">
                    <div className="px-3 py-1 bg-white/5 border-b border-white/10 text-[10px] text-white/30">Speaker Notes</div>
                    <textarea value={current.notes} onChange={e => update("notes", e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-transparent text-xs text-white/70 outline-none resize-none"
                      placeholder="Add speaker notes..." />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BOTTOM STATUS */}
          <div className="flex items-center gap-4 text-[10px] text-white/30 px-1">
            <span>Slides: <strong className="text-white/50">{slides.length}</strong></span>
            <span>Current: <strong className="text-white/50">{activeSlide + 1}</strong></span>
            <span>Layout: <strong className="text-white/50">{current?.layout}</strong></span>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
