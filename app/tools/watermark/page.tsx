"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type PageImg = { dataUrl: string; width: number; height: number }

export default function WatermarkPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PageImg[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [text, setText] = useState("CONFIDENTIAL")
  const [fontSize, setFontSize] = useState(48)
  const [opacity, setOpacity] = useState(0.15)
  const [rotation, setRotation] = useState(-45)
  const [color, setColor] = useState("#ff0000")
  const [wmPos, setWmPos] = useState({ x: 50, y: 50 })
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [previewUrl, setPreviewUrl] = useState("")
  const [status, setStatus] = useState("")
  const [processing, setProcessing] = useState(false)
  const [pageLoading, setPageLoading] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)

  const handleFile = useCallback(async (f: File) => {
    setFile(f); setPageLoading(true); setStatus("Loading pages...")
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
      setPages(imgs); setStatus(`${imgs.length} pages. Drag watermark to position.`)
    } catch { setStatus("Error loading PDF") }
    setPageLoading(false)
  }, [])

  const onDragStart = (e: React.MouseEvent) => {
    if (!pageRef.current) return
    const rect = pageRef.current.getBoundingClientRect()
    setDragOffset({ x: e.clientX - rect.left - (wmPos.x / 100) * rect.width, y: e.clientY - rect.top - (wmPos.y / 100) * rect.height })
    setDragging(true)
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      if (!pageRef.current) return
      const rect = pageRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100))
      setWmPos({ x, y })
    }
    const onUp = () => setDragging(false)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
  }, [dragging, dragOffset])

  const process = useCallback(async () => {
    if (!file || !text.trim()) return
    setProcessing(true); setStatus("Adding watermark...")
    try {
      const buffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer)
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const r = parseInt(color.slice(1, 3), 16) / 255
      const g = parseInt(color.slice(3, 5), 16) / 255
      const b = parseInt(color.slice(5, 7), 16) / 255

      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i)
        const { width, height } = page.getSize()
        const tw = font.widthOfTextAtSize(text, fontSize)
        const x = (wmPos.x / 100) * width - tw / 2
        const y = height - (wmPos.y / 100) * height
        page.drawText(text, { x, y, size: fontSize, font, color: rgb(r, g, b), opacity, rotate: degrees(rotation) })
      }

      const bytes = await pdfDoc.save()
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(blob))
      setStatus("Watermark added! Preview below.")
      const outName = file.name.replace(".pdf", "_watermarked.pdf")
      const editResult = await trackEdit({ fileName: outName, fileSize: blob.size, fileType: "pdf", toolUsed: "watermark" })
      if (!editResult.allowed) { setStatus(editResult.error || "Edit limit reached"); setProcessing(false); return }
      saveToCloud(blob, outName, "watermark")
    } catch (err) { console.error(err); setStatus("Error adding watermark") }
    setProcessing(false)
  }, [file, text, fontSize, opacity, rotation, color, wmPos, previewUrl])

  const download = () => { if (!previewUrl) return; const a = document.createElement("a"); a.href = previewUrl; a.download = file!.name.replace(".pdf", "_watermarked.pdf"); a.click() }

  return (
    <ToolLayout title="Add Watermark" subtitle="Add customizable text watermark to your PDF">
      <div className="space-y-5">
        {!file ? (
          <FileUploader accept=".pdf" onFile={handleFile} label="Upload a PDF to add watermark" sublabel="Drag the watermark text to position it on the page" cloudFilterTypes={["pdf"]} />
        ) : pageLoading ? (
          <div className="flex flex-col items-center gap-3 py-12"><div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /><p className="text-white/40 text-sm">{status}</p></div>
        ) : (
          <>
            {/* Settings */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Watermark Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400/50" />
                  <div className="flex gap-1 flex-wrap">
                    {["CONFIDENTIAL", "DRAFT", "SAMPLE", "DO NOT COPY", "ORIGINAL", "VOID"].map(t => (
                      <button key={t} onClick={() => setText(t)} className={`px-2 py-1 rounded text-[8px] transition ${text === t ? "bg-purple-500/30 text-purple-300" : "bg-white/5 text-white/30 hover:bg-white/10"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2"><span className="text-[9px] text-white/30 w-12">Size</span><input type="range" min={12} max={96} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="flex-1 accent-purple-500" /><span className="text-[10px] text-white/40 w-6">{fontSize}</span></div>
                  <div className="flex items-center gap-2"><span className="text-[9px] text-white/30 w-12">Opacity</span><input type="range" min={5} max={80} value={Math.round(opacity * 100)} onChange={e => setOpacity(Number(e.target.value) / 100)} className="flex-1 accent-purple-500" /><span className="text-[10px] text-white/40 w-6">{Math.round(opacity * 100)}%</span></div>
                  <div className="flex items-center gap-2"><span className="text-[9px] text-white/30 w-12">Angle</span><input type="range" min={-90} max={90} value={rotation} onChange={e => setRotation(Number(e.target.value))} className="flex-1 accent-purple-500" /><span className="text-[10px] text-white/40 w-6">{rotation}&deg;</span></div>
                  <div className="flex items-center gap-2"><span className="text-[9px] text-white/30 w-12">Color</span><input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" /><span className="text-[10px] text-white/40">{color}</span></div>
                </div>
              </div>
            </div>

            {/* Page preview with draggable watermark */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-white">Drag Watermark to Position</h3>
                <div className="flex-1" />
                {pages.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white/40 disabled:opacity-30">&larr;</button>
                    <span className="text-[10px] text-white/40">{currentPage + 1}/{pages.length}</span>
                    <button onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))} disabled={currentPage >= pages.length - 1} className="px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white/40 disabled:opacity-30">&rarr;</button>
                  </div>
                )}
              </div>
              <div ref={pageRef} className="relative inline-block rounded-lg overflow-hidden border border-white/10 select-none" style={{ maxHeight: "55vh" }}>
                {pages[currentPage] && <img src={pages[currentPage].dataUrl} className="max-h-[55vh] w-auto" draggable={false} />}
                {text.trim() && (
                  <div
                    onMouseDown={onDragStart}
                    className={`absolute cursor-move px-2 py-1 transition-shadow ${dragging ? "shadow-lg shadow-purple-500/30" : ""}`}
                    style={{
                      left: `${wmPos.x}%`, top: `${wmPos.y}%`,
                      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                      fontSize: `${fontSize * 0.6}px`, fontWeight: "bold",
                      color: color, opacity: Math.max(opacity, 0.3),
                      textShadow: "0 0 2px rgba(0,0,0,0.1)",
                      border: `2px dashed ${dragging ? "rgba(168,85,247,0.8)" : "rgba(168,85,247,0.4)"}`,
                      borderRadius: "4px", whiteSpace: "nowrap",
                    }}
                  >{text}</div>
                )}
              </div>
              <p className="text-[10px] text-white/30">Click and drag the watermark text to reposition. Applied to all pages.</p>
            </div>

            <div className="flex items-center gap-3 justify-center">
              <button onClick={() => { setFile(null); setPages([]); setPreviewUrl(""); setStatus("") }} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/50">New File</button>
              <button onClick={process} disabled={processing || !text.trim()}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-40">
                {processing ? "Applying..." : "Add Watermark"}
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
