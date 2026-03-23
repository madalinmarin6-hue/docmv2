"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { PDFDocument } from "pdf-lib"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type PageImg = { dataUrl: string; width: number; height: number }

export default function SignPdfPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PageImg[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [signatureDataUrl, setSignatureDataUrl] = useState("")
  const [sigPos, setSigPos] = useState({ x: 60, y: 75 })
  const [sigSize, setSigSize] = useState(100)
  const [pageIdx, setPageIdx] = useState<"last" | "first" | "all">("last")
  const [previewUrl, setPreviewUrl] = useState("")
  const [status, setStatus] = useState("")
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const pagePreviewRef = useRef<HTMLDivElement>(null)

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
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        await page.render({ canvasContext: ctx, viewport: vp }).promise
        imgs.push({ dataUrl: canvas.toDataURL(), width: vp.width, height: vp.height })
      }
      setPages(imgs)
      setCurrentPage(imgs.length - 1)
      setStatus(`${imgs.length} pages loaded. Draw your signature, then drag it on the page.`)
    } catch { setStatus("Error loading PDF") }
    setLoading(false)
  }, [])

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    drawingRef.current = true
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const pos = "touches" in e ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top } : { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height
    lastPosRef.current = { x: pos.x * scaleX, y: pos.y * scaleY }
  }
  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    const rect = canvas.getBoundingClientRect()
    const pos = "touches" in e ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top } : { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height
    const cur = { x: pos.x * scaleX, y: pos.y * scaleY }
    ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = 3; ctx.lineCap = "round"
    ctx.beginPath(); ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y); ctx.lineTo(cur.x, cur.y); ctx.stroke()
    lastPosRef.current = cur
  }
  const endDraw = () => {
    drawingRef.current = false
    if (canvasRef.current) setSignatureDataUrl(canvasRef.current.toDataURL("image/png"))
  }
  const clearSignature = () => {
    const canvas = canvasRef.current
    if (canvas) { const ctx = canvas.getContext("2d")!; ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height) }
    setSignatureDataUrl("")
  }

  const onDragStart = (e: React.MouseEvent) => {
    if (!pagePreviewRef.current) return
    const rect = pagePreviewRef.current.getBoundingClientRect()
    setDragOffset({ x: e.clientX - rect.left - (sigPos.x / 100) * rect.width, y: e.clientY - rect.top - (sigPos.y / 100) * rect.height })
    setDragging(true)
  }
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      if (!pagePreviewRef.current) return
      const rect = pagePreviewRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100))
      setSigPos({ x, y })
    }
    const onUp = () => setDragging(false)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
  }, [dragging, dragOffset])

  const process = useCallback(async () => {
    if (!file || !signatureDataUrl) return
    setProcessing(true); setStatus("Signing PDF...")
    try {
      const buffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer)
      const pngBytes = await fetch(signatureDataUrl).then(r => r.arrayBuffer())
      const sigImg = await pdfDoc.embedPng(new Uint8Array(pngBytes))
      const scaleFactor = sigSize / 100
      const sigW = sigImg.width * scaleFactor * 0.5
      const sigH = sigImg.height * scaleFactor * 0.5

      const applyToPage = (i: number) => {
        const page = pdfDoc.getPage(i)
        const { width, height } = page.getSize()
        const x = (sigPos.x / 100) * width - sigW / 2
        const y = height - (sigPos.y / 100) * height - sigH / 2
        page.drawImage(sigImg, { x: Math.max(0, x), y: Math.max(0, y), width: sigW, height: sigH })
      }

      if (pageIdx === "all") for (let i = 0; i < pdfDoc.getPageCount(); i++) applyToPage(i)
      else if (pageIdx === "first") applyToPage(0)
      else applyToPage(pdfDoc.getPageCount() - 1)

      const bytes = await pdfDoc.save()
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(blob))
      const outName = file.name.replace(".pdf", "_signed.pdf")
      trackEdit({ fileName: outName, fileSize: blob.size, fileType: "application/pdf", toolUsed: "sign-pdf" })
      saveToCloud(blob, outName, "sign-pdf")
      setStatus("Signed! Preview below.")
    } catch (err) { console.error(err); setStatus("Error signing") }
    setProcessing(false)
  }, [file, signatureDataUrl, sigPos, sigSize, pageIdx, previewUrl])

  const download = () => { if (!previewUrl) return; const a = document.createElement("a"); a.href = previewUrl; a.download = file!.name.replace(".pdf", "_signed.pdf"); a.click() }

  const sigDisplayW = sigSize * 1.2
  const sigDisplayH = sigSize * 0.5

  return (
    <ToolLayout title="Sign PDF" subtitle="Draw and place your signature on a PDF">
      <div className="space-y-5">
        {!file ? (
          <FileUploader accept=".pdf" onFile={handleFile} label="Upload a PDF to sign" sublabel="Draw your signature, then drag to position it on the page" cloudFilterTypes={["pdf"]} />
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 py-12"><div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /><p className="text-white/40 text-sm">{status}</p></div>
        ) : (
          <>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">1. Draw Your Signature</h3>
              <div className="relative rounded-xl overflow-hidden border border-white/20 bg-white max-w-md">
                <canvas ref={canvasRef} width={500} height={200} className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
                  onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw} />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearSignature} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition">Clear</button>
                <div className="flex items-center gap-2 ml-4"><span className="text-[9px] text-white/30">Size</span><input type="range" min={30} max={250} value={sigSize} onChange={e => setSigSize(Number(e.target.value))} className="w-24 accent-blue-500" /><span className="text-[10px] text-white/40">{sigSize}%</span></div>
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-white">2. Drag Signature on Page</h3>
                <div className="flex-1" />
                <div className="flex gap-1">
                  {(["last", "first", "all"] as const).map(v => (
                    <button key={v} onClick={() => { setPageIdx(v); if (v === "first") setCurrentPage(0); else if (v === "last") setCurrentPage(pages.length - 1) }}
                      className={`px-2 py-1 rounded-lg text-[9px] transition ${pageIdx === v ? "bg-blue-500/20 text-blue-300 border border-blue-400/30" : "bg-white/5 text-white/30 border border-white/10"}`}>
                      {v === "last" ? "Last page" : v === "first" ? "First page" : "All pages"}
                    </button>
                  ))}
                </div>
              </div>
              {pages.length > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="px-2 py-1 rounded-lg text-xs bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 disabled:opacity-30">←</button>
                  <span className="text-xs text-white/40">Page {currentPage + 1} / {pages.length}</span>
                  <button onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))} disabled={currentPage >= pages.length - 1} className="px-2 py-1 rounded-lg text-xs bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 disabled:opacity-30">→</button>
                </div>
              )}
              <div ref={pagePreviewRef} className="relative inline-block rounded-lg overflow-hidden border border-white/10 select-none max-w-full" style={{ maxHeight: "60vh" }}>
                {pages[currentPage] && <img src={pages[currentPage].dataUrl} className="max-h-[60vh] w-auto" draggable={false} />}
                {signatureDataUrl && (
                  <div
                    onMouseDown={onDragStart}
                    className={`absolute border-2 ${dragging ? "border-blue-400 shadow-lg shadow-blue-500/30" : "border-blue-400/50 hover:border-blue-400"} rounded cursor-move transition-shadow`}
                    style={{
                      left: `calc(${sigPos.x}% - ${sigDisplayW / 2}px)`,
                      top: `calc(${sigPos.y}% - ${sigDisplayH / 2}px)`,
                      width: `${sigDisplayW}px`,
                      height: `${sigDisplayH}px`,
                    }}
                  >
                    <img src={signatureDataUrl} className="w-full h-full object-contain" draggable={false} />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-white/30">Click and drag the signature to reposition it on the page.</p>
            </div>

            <div className="flex items-center gap-3 justify-center">
              <button onClick={() => { setFile(null); setPages([]); setPreviewUrl(""); setStatus(""); clearSignature() }} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/50">New File</button>
              <button onClick={process} disabled={processing || !signatureDataUrl}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-40">
                {processing ? "Signing..." : "Sign & Preview"}
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
