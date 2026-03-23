"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type PageImg = { dataUrl: string; width: number; height: number }

export default function StampPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PageImg[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [stampType, setStampType] = useState<"text" | "image">("text")
  const [text, setText] = useState("APPROVED")
  const [stampImage, setStampImage] = useState<File | null>(null)
  const [stampPreview, setStampPreview] = useState("")
  const [fontSize, setFontSize] = useState(28)
  const [stampPos, setStampPos] = useState({ x: 70, y: 85 })
  const [rotation, setRotation] = useState(0)
  const [opacity, setOpacity] = useState(0.9)
  const [color, setColor] = useState("#cc0000")
  const [applyTo, setApplyTo] = useState<"all" | "first" | "last">("all")
  const [previewUrl, setPreviewUrl] = useState("")
  const [status, setStatus] = useState("")
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const pageRef = useRef<HTMLDivElement>(null)

  const handleFile = useCallback(async (f: File) => {
    setFile(f); setLoading(true); setStatus("Loading pages...")
    try {
      const buffer = await f.arrayBuffer()
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
      const imgs: PageImg[] = []
      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1)
        const vp = page.getViewport({ scale: 1.5 })
        const canvas = document.createElement("canvas")
        canvas.width = vp.width; canvas.height = vp.height
        const ctx = canvas.getContext("2d")!
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height)
        await page.render({ canvasContext: ctx, viewport: vp }).promise
        imgs.push({ dataUrl: canvas.toDataURL(), width: vp.width, height: vp.height })
      }
      setPages(imgs); setStatus(`${imgs.length} pages. Drag the stamp to position it.`)
    } catch { setStatus("Error loading PDF") }
    setLoading(false)
  }, [])

  const handleStampImage = (f: File) => { setStampImage(f); setStampPreview(URL.createObjectURL(f)) }

  const onDragStart = (e: React.MouseEvent) => {
    if (!pageRef.current) return
    const rect = pageRef.current.getBoundingClientRect()
    setDragOffset({ x: e.clientX - rect.left - (stampPos.x / 100) * rect.width, y: e.clientY - rect.top - (stampPos.y / 100) * rect.height })
    setDragging(true)
  }
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      if (!pageRef.current) return
      const rect = pageRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100))
      setStampPos({ x, y })
    }
    const onUp = () => setDragging(false)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
  }, [dragging, dragOffset])

  const process = useCallback(async () => {
    if (!file) return
    setProcessing(true); setStatus("Adding stamp...")
    try {
      const buffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer)
      const total = pdfDoc.getPageCount()

      for (let i = 0; i < total; i++) {
        if (applyTo === "first" && i !== 0) continue
        if (applyTo === "last" && i !== total - 1) continue
        const page = pdfDoc.getPage(i)
        const { width, height } = page.getSize()
        const x = (stampPos.x / 100) * width
        const y = height - (stampPos.y / 100) * height

        if (stampType === "text" && text.trim()) {
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
          const r = parseInt(color.slice(1, 3), 16) / 255
          const g = parseInt(color.slice(3, 5), 16) / 255
          const b = parseInt(color.slice(5, 7), 16) / 255
          const tw = font.widthOfTextAtSize(text, fontSize)
          page.drawText(text, { x: x - tw / 2, y, size: fontSize, font, color: rgb(r, g, b), opacity, rotate: degrees(rotation) })
        } else if (stampType === "image" && stampImage) {
          const imgBytes = new Uint8Array(await stampImage.arrayBuffer())
          let img
          if (stampImage.type === "image/png") img = await pdfDoc.embedPng(imgBytes)
          else img = await pdfDoc.embedJpg(imgBytes)
          const scale = fontSize / img.height * 4
          const sw = img.width * scale, sh = img.height * scale
          page.drawImage(img, { x: x - sw / 2, y: y - sh / 2, width: sw, height: sh, opacity, rotate: degrees(rotation) })
        }
      }

      const bytes = await pdfDoc.save()
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(blob))
      const outName = file.name.replace(".pdf", "_stamped.pdf")
      trackEdit({ fileName: outName, fileSize: blob.size, fileType: "application/pdf", toolUsed: "stamp" })
      saveToCloud(blob, outName, "stamp")
      setStatus("Stamp added! Preview below.")
    } catch (err) { console.error(err); setStatus("Error adding stamp") }
    setProcessing(false)
  }, [file, stampType, text, stampImage, fontSize, stampPos, rotation, opacity, color, applyTo, previewUrl])

  const download = () => { if (!previewUrl) return; const a = document.createElement("a"); a.href = previewUrl; a.download = file!.name.replace(".pdf", "_stamped.pdf"); a.click() }

  const presets = ["APPROVED", "REJECTED", "DRAFT", "CONFIDENTIAL", "FINAL", "COPY", "VOID", "RECEIVED"]

  return (
    <ToolLayout title="Add Stamp" subtitle="Add text or image stamps to PDF pages">
      <div className="space-y-5">
        {!file ? (
          <FileUploader accept=".pdf" onFile={handleFile} label="Upload a PDF to add stamps" sublabel="Add text or image stamps — drag to position them on the page" cloudFilterTypes={["pdf"]} />
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 py-12"><div className="w-10 h-10 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" /><p className="text-white/40 text-sm">{status}</p></div>
        ) : (
          <>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div className="flex gap-1.5 mb-2">
                <button onClick={() => setStampType("text")} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${stampType === "text" ? "bg-rose-500/30 text-rose-300 border border-rose-400/30" : "bg-white/5 text-white/40 border border-white/10"}`}>Text Stamp</button>
                <button onClick={() => setStampType("image")} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${stampType === "image" ? "bg-rose-500/30 text-rose-300 border border-rose-400/30" : "bg-white/5 text-white/40 border border-white/10"}`}>Image Stamp</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  {stampType === "text" ? (
                    <>
                      <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-400/50" placeholder="Stamp text" />
                      <div className="flex gap-1 flex-wrap">
                        {presets.map(p => (<button key={p} onClick={() => setText(p)} className={`px-2 py-1 rounded text-[8px] transition ${text === p ? "bg-rose-500/30 text-rose-300" : "bg-white/5 text-white/30 hover:bg-white/10"}`}>{p}</button>))}
                      </div>
                      <div className="flex items-center gap-2"><span className="text-[9px] text-white/30">Color</span><input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" /></div>
                    </>
                  ) : (
                    <div>
                      <input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) handleStampImage(e.target.files[0]) }} className="text-xs text-white/40" />
                      {stampPreview && <img src={stampPreview} className="mt-2 h-16 object-contain rounded" />}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2"><span className="text-[9px] text-white/30 w-12">Size</span><input type="range" min={8} max={72} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="flex-1 accent-rose-500" /><span className="text-[10px] text-white/40 w-6">{fontSize}</span></div>
                  <div className="flex items-center gap-2"><span className="text-[9px] text-white/30 w-12">Angle</span><input type="range" min={-180} max={180} value={rotation} onChange={e => setRotation(Number(e.target.value))} className="flex-1 accent-rose-500" /><span className="text-[10px] text-white/40 w-6">{rotation}°</span></div>
                  <div className="flex items-center gap-2"><span className="text-[9px] text-white/30 w-12">Opacity</span><input type="range" min={10} max={100} value={Math.round(opacity * 100)} onChange={e => setOpacity(Number(e.target.value) / 100)} className="flex-1 accent-rose-500" /><span className="text-[10px] text-white/40 w-6">{Math.round(opacity * 100)}%</span></div>
                  <div className="flex gap-1 mt-1">
                    {(["all", "first", "last"] as const).map(v => (<button key={v} onClick={() => setApplyTo(v)} className={`flex-1 px-2 py-1.5 rounded-lg text-[9px] transition ${applyTo === v ? "bg-rose-500/20 text-rose-300 border border-rose-400/30" : "bg-white/5 text-white/30 border border-white/10"}`}>{v === "all" ? "All pages" : v === "first" ? "First only" : "Last only"}</button>))}
                  </div>
                  <div className="mt-2">
                    <span className="text-[9px] text-white/30 block mb-1">Quick Position</span>
                    <div className="grid grid-cols-3 gap-1">
                      {([
                        { label: "↖", x: 15, y: 12 },
                        { label: "↑", x: 50, y: 12 },
                        { label: "↗", x: 85, y: 12 },
                        { label: "←", x: 15, y: 50 },
                        { label: "●", x: 50, y: 50 },
                        { label: "→", x: 85, y: 50 },
                        { label: "↙", x: 15, y: 88 },
                        { label: "↓", x: 50, y: 88 },
                        { label: "↘", x: 85, y: 88 },
                      ] as const).map(p => (
                        <button key={p.label} onClick={() => setStampPos({ x: p.x, y: p.y })}
                          className={`px-1 py-1.5 rounded text-[10px] transition ${stampPos.x === p.x && stampPos.y === p.y ? "bg-rose-500/30 text-rose-300 border border-rose-400/30" : "bg-white/5 text-white/30 border border-white/10 hover:bg-white/10"}`}>{p.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-white">Drag Stamp to Position</h3>
                <div className="flex-1" />
                {pages.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white/40 disabled:opacity-30">←</button>
                    <span className="text-[10px] text-white/40">{currentPage + 1}/{pages.length}</span>
                    <button onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))} disabled={currentPage >= pages.length - 1} className="px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white/40 disabled:opacity-30">→</button>
                  </div>
                )}
              </div>
              <div ref={pageRef} className="relative inline-block rounded-lg overflow-hidden border border-white/10 select-none" style={{ maxHeight: "55vh" }}>
                {pages[currentPage] && <img src={pages[currentPage].dataUrl} className="max-h-[55vh] w-auto" draggable={false} />}
                <div
                  onMouseDown={onDragStart}
                  className={`absolute cursor-move transition-shadow ${dragging ? "shadow-lg shadow-rose-500/30" : ""}`}
                  style={{
                    left: `${stampPos.x}%`, top: `${stampPos.y}%`,
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                    border: `2px dashed ${dragging ? "rgba(244,63,94,0.8)" : "rgba(244,63,94,0.4)"}`,
                    borderRadius: "4px", padding: "2px 6px",
                  }}
                >
                  {stampType === "text" ? (
                    <span style={{ fontSize: `${fontSize * 0.55}px`, fontWeight: "bold", color, opacity: Math.max(opacity, 0.4), whiteSpace: "nowrap" }}>{text}</span>
                  ) : stampPreview ? (
                    <img src={stampPreview} style={{ height: `${fontSize * 1.5}px`, opacity: Math.max(opacity, 0.4) }} draggable={false} />
                  ) : (
                    <span className="text-xs text-rose-400">No image</span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-white/30">Click and drag the stamp to reposition it on the page.</p>
            </div>

            <div className="flex items-center gap-3 justify-center">
              <button onClick={() => { setFile(null); setPages([]); setPreviewUrl(""); setStatus("") }} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/50">New File</button>
              <button onClick={process} disabled={processing}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-rose-500 to-red-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-40">
                {processing ? "Applying..." : "Add Stamp"}
              </button>
            </div>
            {status && <p className="text-xs text-center text-emerald-400">{status}</p>}
            {previewUrl && (
              <div className="space-y-3">
                <div className="flex items-center gap-3"><h3 className="text-sm font-semibold text-white">Preview</h3><div className="flex-1" />
                  <button onClick={download} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">Download</button>
                </div>
                <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5"><iframe src={previewUrl} className="w-full h-[65vh]" /></div>
              </div>
            )}
          </>
        )}
      </div>
    </ToolLayout>
  )
}
