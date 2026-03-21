"use client"

import { useState, useRef, useCallback } from "react"
import ToolLayout from "../../../components/ToolLayout"
import FileUploader from "../../../components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type Tool = "eraser" | "restore" | "magic"

export default function RemoveBgPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [processing, setProcessing] = useState(false)
  const [statusMsg, setStatusMsg] = useState("")
  const [tool, setTool] = useState<Tool>("eraser")
  const [brushSize, setBrushSize] = useState(20)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasResult, setHasResult] = useState(false)
  const [undoStack, setUndoStack] = useState<ImageData[]>([])
  const [magicTolerance, setMagicTolerance] = useState(25)
  const [progress, setProgress] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const displayCanvasRef = useRef<HTMLCanvasElement>(null)
  const originalImageRef = useRef<HTMLImageElement | null>(null)

  const saveUndo = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setUndoStack(prev => [...prev.slice(-20), imgData])
  }, [])

  const updateDisplay = useCallback(() => {
    const src = canvasRef.current
    const dst = displayCanvasRef.current
    if (!src || !dst) return
    dst.width = src.width
    dst.height = src.height
    const dCtx = dst.getContext("2d")!
    dCtx.clearRect(0, 0, dst.width, dst.height)
    dCtx.drawImage(src, 0, 0)
    setHasResult(true)
  }, [])

  const undo = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || undoStack.length === 0) return
    const ctx = canvas.getContext("2d")!
    const last = undoStack[undoStack.length - 1]
    ctx.putImageData(last, 0, 0)
    setUndoStack(prev => prev.slice(0, -1))
    const dst = displayCanvasRef.current
    if (dst) {
      dst.width = canvas.width
      dst.height = canvas.height
      const dCtx = dst.getContext("2d")!
      dCtx.clearRect(0, 0, dst.width, dst.height)
      dCtx.drawImage(canvas, 0, 0)
    }
  }, [undoStack])

  async function handleFile(f: File) {
    setFile(f)
    setHasResult(false)
    setStatusMsg("")
    setUndoStack([])
    setProgress(0)
    const url = URL.createObjectURL(f)
    setPreview(url)

    const img = new (globalThis as any).Image() as HTMLImageElement
    img.crossOrigin = "anonymous"
    img.onload = () => {
      originalImageRef.current = img
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext("2d")!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      removeBg(f)
    }
    img.onerror = () => setStatusMsg("Error loading image")
    img.src = url
  }

  async function removeBg(imageFile: File) {
    setProcessing(true)
    setStatusMsg("Loading AI model (first time may take ~30s)...")
    setProgress(10)

    try {
      const bgRemoval = await import("@imgly/background-removal")
      const removeBackground = bgRemoval.removeBackground || bgRemoval.default

      setStatusMsg("Removing background with AI...")
      setProgress(30)

      const resultBlob = await removeBackground(imageFile, {
        publicPath: "https://staticimgly.com/@imgly/background-removal-data/1.4.5/dist/",
        model: "medium" as any,
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const pct = Math.round(30 + (current / total) * 60)
            setProgress(pct)
            if (key === "compute:inference") setStatusMsg("AI processing image...")
            else if (key === "fetch:onnx") setStatusMsg("Downloading AI model...")
          }
        },
      })

      setProgress(90)
      setStatusMsg("Rendering result...")

      const resultUrl = URL.createObjectURL(resultBlob)
      const resultImg = new (globalThis as any).Image() as HTMLImageElement
      resultImg.crossOrigin = "anonymous"
      resultImg.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = resultImg.naturalWidth || resultImg.width
        canvas.height = resultImg.naturalHeight || resultImg.height
        const ctx = canvas.getContext("2d")!
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(resultImg, 0, 0)
        saveUndo()
        updateDisplay()
        setProgress(100)
        setStatusMsg("Done! Use eraser, restore, or magic wand to refine edges.")
        setProcessing(false)
        URL.revokeObjectURL(resultUrl)
      }
      resultImg.onerror = () => {
        setStatusMsg("Error rendering result")
        setProcessing(false)
      }
      resultImg.src = resultUrl
    } catch (err) {
      console.error("RemoveBg error:", err)
      setStatusMsg("Error: " + (err instanceof Error ? err.message : "unknown"))
      setProcessing(false)
      setProgress(0)
    }
  }

  function getCanvasCoords(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = displayCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  function applyBrush(x: number, y: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const r = brushSize * (canvas.width / (displayCanvasRef.current?.getBoundingClientRect().width || canvas.width))

    if (tool === "eraser") {
      ctx.save()
      ctx.globalCompositeOperation = "destination-out"
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    } else if (tool === "restore") {
      const orig = originalImageRef.current
      if (!orig) return
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(orig, 0, 0, canvas.width, canvas.height)
      ctx.restore()
    }
    updateDisplay()
  }

  function handleMagicClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (tool !== "magic") return
    const canvas = canvasRef.current
    if (!canvas) return
    const { x, y } = getCanvasCoords(e)
    const ctx = canvas.getContext("2d")!
    const ix = Math.floor(x), iy = Math.floor(y)
    saveUndo()

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const d = imageData.data
    const cw = canvas.width, ch = canvas.height

    const targetIdx = (iy * cw + ix) * 4
    const tR = d[targetIdx], tG = d[targetIdx + 1], tB = d[targetIdx + 2]
    if (d[targetIdx + 3] === 0) return

    const vis = new Uint8Array(cw * ch)
    const stack = [ix + iy * cw]
    vis[ix + iy * cw] = 1
    const tol = magicTolerance * magicTolerance * 3

    while (stack.length > 0) {
      const pos = stack.pop()!
      const px = pos % cw, py = Math.floor(pos / cw)
      const idx = pos * 4
      const dr = d[idx] - tR, dg = d[idx+1] - tG, db = d[idx+2] - tB
      if (dr*dr + dg*dg + db*db < tol && d[idx+3] > 0) {
        d[idx + 3] = 0
        const nb = [px > 0 ? pos - 1 : -1, px < cw-1 ? pos + 1 : -1, py > 0 ? pos - cw : -1, py < ch-1 ? pos + cw : -1]
        for (const n of nb) { if (n >= 0 && !vis[n]) { vis[n] = 1; stack.push(n) } }
      }
    }
    ctx.putImageData(imageData, 0, 0)
    updateDisplay()
    setStatusMsg("Area removed!")
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (tool === "magic") { handleMagicClick(e); return }
    if (tool !== "eraser" && tool !== "restore") return
    saveUndo()
    setIsDrawing(true)
    const { x, y } = getCanvasCoords(e)
    applyBrush(x, y)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || (tool !== "eraser" && tool !== "restore")) return
    const { x, y } = getCanvasCoords(e)
    applyBrush(x, y)
  }

  function handleMouseUp() { setIsDrawing(false) }

  async function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"))
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const outName = (file?.name.replace(/\.[^.]+$/, "") || "image") + "_no_bg.png"
    a.download = outName
    a.click()
    URL.revokeObjectURL(url)
    const editResult = await trackEdit({ fileName: outName, fileSize: blob.size, fileType: "png", toolUsed: "remove-bg" })
    if (!editResult.allowed) { alert(editResult.error || "Edit limit reached"); return }
    saveToCloud(blob, outName, "remove-bg")
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null); setPreview(""); setHasResult(false); setStatusMsg(""); setUndoStack([]); setProgress(0)
  }

  const toolBtn = (t: Tool) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${tool === t ? "bg-purple-500/30 text-purple-300 border border-purple-400/30" : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white"}`

  const cursorStyle = tool === "eraser" || tool === "restore"
    ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${brushSize*2}' height='${brushSize*2}'%3E%3Ccircle cx='${brushSize}' cy='${brushSize}' r='${brushSize-1}' fill='none' stroke='white' stroke-width='2'/%3E%3C/svg%3E") ${brushSize} ${brushSize}, crosshair`
    : tool === "magic" ? "crosshair" : "default"

  return (
    <ToolLayout title="Remove Background" subtitle="AI-powered background removal with manual refinement tools">
      <div className="space-y-4">
        <canvas ref={canvasRef} className="hidden" />

        {!file ? (
          <FileUploader accept=".jpg,.jpeg,.png,.webp,.bmp" onFile={handleFile} label="Upload an image to remove its background" cloudFilterTypes={["jpg", "jpeg", "png", "webp", "bmp"]} />
        ) : (
          <>
            {/* TOOLBAR */}
            {hasResult && (
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                <button onClick={() => setTool("eraser")} className={toolBtn("eraser")}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" /><circle cx="12" cy="12" r="3" /></svg>
                  Eraser
                </button>

                <button onClick={() => setTool("restore")} className={toolBtn("restore")}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                  Restore
                </button>

                <button onClick={() => setTool("magic")} className={toolBtn("magic")}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672z" /></svg>
                  Magic Wand
                </button>

                <div className="w-px h-7 bg-white/10" />

                {(tool === "eraser" || tool === "restore") && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40">Size:</span>
                    <input type="range" min={5} max={80} value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-20 accent-purple-500" />
                    <span className="text-[10px] text-white/30 w-5">{brushSize}</span>
                  </div>
                )}

                {tool === "magic" && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40">Tolerance:</span>
                    <input type="range" min={5} max={60} value={magicTolerance} onChange={e => setMagicTolerance(Number(e.target.value))} className="w-20 accent-purple-500" />
                    <span className="text-[10px] text-white/30 w-5">{magicTolerance}</span>
                  </div>
                )}

                <div className="w-px h-7 bg-white/10" />

                <button onClick={undo} disabled={undoStack.length === 0}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 transition disabled:opacity-30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                  Undo
                </button>

                <div className="flex-1" />

                <button onClick={() => file && removeBg(file)} disabled={processing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                  {processing ? "Processing..." : "Re-run AI"}
                </button>
                <button onClick={reset} className="px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition">
                  New Image
                </button>
              </div>
            )}

            {/* Hint */}
            {hasResult && (
              <div className="text-[11px] text-white/30 px-1">
                {tool === "eraser" && "Click and drag to erase (make transparent) areas."}
                {tool === "restore" && "Click and drag to restore areas from the original image."}
                {tool === "magic" && "Click on a colored area to remove all connected similar pixels."}
              </div>
            )}

            {/* Progress bar */}
            {processing && (
              <div className="space-y-2">
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-center text-white/40">{statusMsg}</p>
              </div>
            )}

            {/* PREVIEW */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Original</p>
                <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center min-h-[300px]">
                  {preview && <img src={preview} alt="Original" className="max-w-full max-h-[500px] object-contain" />}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Result</p>
                <div className="rounded-2xl border border-white/10 overflow-hidden min-h-[300px] flex items-center justify-center"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='10' height='10' fill='%23222'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23222'/%3E%3Crect x='10' width='10' height='10' fill='%23333'/%3E%3Crect y='10' width='10' height='10' fill='%23333'/%3E%3C/svg%3E\")" }}>
                  {hasResult ? (
                    <canvas ref={displayCanvasRef} className="max-w-full max-h-[500px] object-contain"
                      style={{ cursor: cursorStyle }}
                      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-10">
                      {processing ? (
                        <>
                          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                          <p className="text-white/30 text-sm">AI is processing your image...</p>
                        </>
                      ) : (
                        <p className="text-white/20 text-sm">Upload an image to start</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {hasResult && (
              <div className="flex justify-center gap-3">
                <button onClick={download}
                  className="px-8 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">
                  Download PNG
                </button>
              </div>
            )}

            {statusMsg && !processing && <p className="text-sm text-center text-white/50">{statusMsg}</p>}
          </>
        )}
      </div>
    </ToolLayout>
  )
}
