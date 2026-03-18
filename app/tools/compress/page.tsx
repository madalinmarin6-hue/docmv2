"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import ToolLayout from "../../../components/ToolLayout"
import FileUploader from "../../../components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type OutputFormat = "same" | "jpeg" | "png" | "webp"

export default function CompressPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [compressing, setCompressing] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; name: string; originalSize: number; newSize: number } | null>(null)
  const [statusMsg, setStatusMsg] = useState("")
  const [quality, setQuality] = useState<"low" | "medium" | "high" | "custom">("medium")
  const [customQuality, setCustomQuality] = useState(60)
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("same")
  const [maxWidth, setMaxWidth] = useState(0)
  const [maxHeight, setMaxHeight] = useState(0)
  const [grayscale, setGrayscale] = useState(false)
  const [stripMetadata, setStripMetadata] = useState(true)
  const [imgDimensions, setImgDimensions] = useState<{ w: number; h: number } | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(true)

  const isImage = (f: File) => f.type?.startsWith("image") || /\.(jpg|jpeg|png|webp|bmp|gif)$/i.test(f.name)
  const isPdf = (f: File) => f.type === "application/pdf" || f.name.endsWith(".pdf")

  async function handleFile(f: File) {
    setFile(f)
    setResult(null)
    setImgDimensions(null)
    setStatusMsg(`File loaded: ${f.name} (${formatSize(f.size)})`)

    if (isImage(f)) {
      const url = URL.createObjectURL(f)
      const img = new (globalThis as any).Image() as HTMLImageElement
      img.onload = () => { setImgDimensions({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url) }
      img.src = url
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  function getQualityValue(): number {
    if (quality === "custom") return customQuality / 100
    return { low: 0.3, medium: 0.55, high: 0.8 }[quality]
  }

  function getScale(): number {
    if (maxWidth > 0 || maxHeight > 0) return 1
    if (quality === "custom") return 1
    return { low: 0.5, medium: 0.75, high: 0.9 }[quality]
  }

  function getOutputMime(): string {
    if (outputFormat === "jpeg") return "image/jpeg"
    if (outputFormat === "png") return "image/png"
    if (outputFormat === "webp") return "image/webp"
    if (file?.name.endsWith(".png")) return "image/png"
    if (file?.name.endsWith(".webp")) return "image/webp"
    return "image/jpeg"
  }

  function getOutputExt(): string {
    if (outputFormat === "jpeg") return ".jpg"
    if (outputFormat === "png") return ".png"
    if (outputFormat === "webp") return ".webp"
    if (file?.name.endsWith(".png")) return ".png"
    if (file?.name.endsWith(".webp")) return ".webp"
    return ".jpg"
  }

  async function compress() {
    if (!file) return
    setCompressing(true)
    setStatusMsg("Compressing...")

    try {
      if (isPdf(file)) {
        const buffer = await file.arrayBuffer()
        const pdfjsLib = await import("pdfjs-dist")
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
        const srcPdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise

        const dest = await PDFDocument.create()
        const jpegQuality = quality === "low" ? 0.4 : quality === "medium" ? 0.65 : quality === "high" ? 0.85 : customQuality / 100
        const pdfScale = quality === "low" ? 1 : quality === "medium" ? 1.5 : quality === "high" ? 2 : 1.5

        for (let i = 0; i < srcPdf.numPages; i++) {
          setStatusMsg(`Compressing page ${i + 1} of ${srcPdf.numPages}...`)
          const page = await srcPdf.getPage(i + 1)
          const vp = page.getViewport({ scale: pdfScale })
          const canvas = document.createElement("canvas")
          canvas.width = vp.width; canvas.height = vp.height
          const ctx = canvas.getContext("2d")!
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          await page.render({ canvasContext: ctx, viewport: vp }).promise

          const imgBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/jpeg", jpegQuality))
          if (imgBlob) {
            const imgBytes = new Uint8Array(await imgBlob.arrayBuffer())
            const img = await dest.embedJpg(imgBytes)
            const origVp = page.getViewport({ scale: 1 })
            const pdfPage = dest.addPage([origVp.width, origVp.height])
            pdfPage.drawImage(img, { x: 0, y: 0, width: origVp.width, height: origVp.height })
          }
        }

        const bytes = await dest.save()
        const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
        setResult({ blob, name: file.name.replace(".pdf", "_compressed.pdf"), originalSize: file.size, newSize: blob.size })
      } else if (isImage(file)) {
        const qualityVal = getQualityValue()
        const scale = getScale()
        const img = new (globalThis as any).Image() as HTMLImageElement
        const url = URL.createObjectURL(file)

        await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = url })

        let w = img.naturalWidth, h = img.naturalHeight

        // Apply scale
        w = Math.round(w * scale)
        h = Math.round(h * scale)

        // Apply max dimensions
        if (maxWidth > 0 && w > maxWidth) { const r = maxWidth / w; w = maxWidth; h = Math.round(h * r) }
        if (maxHeight > 0 && h > maxHeight) { const r = maxHeight / h; h = maxHeight; w = Math.round(w * r) }

        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)

        // Grayscale
        if (grayscale) {
          const imageData = ctx.getImageData(0, 0, w, h)
          const d = imageData.data
          for (let i = 0; i < d.length; i += 4) {
            const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114
            d[i] = d[i + 1] = d[i + 2] = gray
          }
          ctx.putImageData(imageData, 0, 0)
        }

        const mime = getOutputMime()
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), mime, mime === "image/png" ? undefined : qualityVal)
        })

        const ext = getOutputExt()
        setResult({ blob, name: file.name.replace(/\.[^.]+$/, `_compressed${ext}`), originalSize: file.size, newSize: blob.size })
      } else {
        setStatusMsg("Unsupported file type. Supports PDF, JPG, PNG, WEBP, BMP, GIF.")
        setCompressing(false)
        return
      }
      setStatusMsg("Compression complete!")
    } catch (err) {
      console.error(err)
      setStatusMsg("Error compressing file")
    }
    setCompressing(false)
  }

  async function download() {
    if (!result) return
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement("a")
    a.href = url; a.download = result.name; a.click()
    URL.revokeObjectURL(url)
    const editResult = await trackEdit({ fileName: result.name, fileSize: result.newSize, fileType: "compressed", toolUsed: "compress" })
    if (!editResult.allowed) { alert(editResult.error || "Edit limit reached"); return }
    saveToCloud(result.blob, result.name, "compress")
  }

  function reset() { setFile(null); setResult(null); setStatusMsg(""); setImgDimensions(null) }

  const savings = result ? Math.max(0, Math.round((1 - result.newSize / result.originalSize) * 100)) : 0
  const isImg = file && isImage(file)

  const optCls = (active: boolean) => `flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${active ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"}`
  const labelCls = "text-xs text-white/40 block mb-1"
  const inputCls = "w-full h-8 px-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-emerald-400/50"

  return (
    <ToolLayout title="Compress Files" subtitle="Reduce file size for PDF and images">
      <div className="space-y-6">
        {!file ? (
          <FileUploader accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp,.gif" onFile={handleFile} label="Upload a PDF or image to compress" sublabel="Supports PDF, JPG, PNG, WEBP, BMP, GIF" cloudFilterTypes={["pdf", "jpg", "jpeg", "png", "webp", "bmp", "gif"]} />
        ) : !result ? (
          <div className="space-y-5">
            {/* FILE INFO */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/80 font-medium">{file.name}</p>
                  <p className="text-white/40 text-sm">{formatSize(file.size)} {imgDimensions ? `• ${imgDimensions.w} × ${imgDimensions.h} px` : ""}</p>
                </div>
                <button onClick={reset} className="text-xs text-red-400/60 hover:text-red-400 transition">Remove</button>
              </div>

              {/* QUALITY PRESETS */}
              <div className="space-y-3">
                <p className="text-sm text-white/50">Compression Level</p>
                <div className="flex gap-3">
                  {(["low", "medium", "high", "custom"] as const).map((q) => (
                    <button key={q} onClick={() => setQuality(q)} className={optCls(quality === q)}>
                      <span className="capitalize">{q}</span>
                      <span className="block text-xs mt-0.5 opacity-60">
                        {q === "low" ? "Max compression" : q === "medium" ? "Balanced" : q === "high" ? "Best quality" : "Manual"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CUSTOM QUALITY SLIDER */}
              {quality === "custom" && isImg && (
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs text-white/40">Quality:</span>
                  <input type="range" min={5} max={100} value={customQuality} onChange={e => setCustomQuality(Number(e.target.value))} className="flex-1 accent-emerald-500" />
                  <span className="text-xs text-white/60 w-8 text-right">{customQuality}%</span>
                </div>
              )}
            </div>

            {/* ADVANCED OPTIONS */}
            {isImg && (
              <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                <div className="px-5 py-3 text-sm text-white/60 font-medium border-b border-white/10">Advanced Options</div>
                {true && (
                  <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
                    {/* Output Format */}
                    <div>
                      <label className={labelCls}>Output Format</label>
                      <div className="flex gap-2">
                        {([["same", "Same as input"], ["jpeg", "JPEG"], ["png", "PNG"], ["webp", "WebP"]] as [OutputFormat, string][]).map(([val, lbl]) => (
                          <button key={val} onClick={() => setOutputFormat(val)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition border ${outputFormat === val ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"}`}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Max Dimensions */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Max Width (px) — 0 = no limit</label>
                        <input type="number" value={maxWidth} onChange={e => setMaxWidth(Number(e.target.value))} className={inputCls} min={0} placeholder="e.g. 1920" />
                      </div>
                      <div>
                        <label className={labelCls}>Max Height (px) — 0 = no limit</label>
                        <input type="number" value={maxHeight} onChange={e => setMaxHeight(Number(e.target.value))} className={inputCls} min={0} placeholder="e.g. 1080" />
                      </div>
                    </div>

                    {/* Quick resize presets */}
                    <div>
                      <label className={labelCls}>Quick Resize</label>
                      <div className="flex gap-2 flex-wrap">
                        {[[640, 480, "640×480"], [1280, 720, "720p"], [1920, 1080, "1080p"], [3840, 2160, "4K"], [800, 800, "800×800"]].map(([w, h, l]) => (
                          <button key={l as string} onClick={() => { setMaxWidth(w as number); setMaxHeight(h as number) }}
                            className="px-2.5 py-1 rounded-lg text-[10px] bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60 transition">
                            {l as string}
                          </button>
                        ))}
                        <button onClick={() => { setMaxWidth(0); setMaxHeight(0) }}
                          className="px-2.5 py-1 rounded-lg text-[10px] bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60 transition">
                          Original
                        </button>
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/50">
                        <input type="checkbox" checked={grayscale} onChange={e => setGrayscale(e.target.checked)} className="accent-emerald-500 rounded" />
                        Convert to Grayscale
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/50">
                        <input type="checkbox" checked={stripMetadata} onChange={e => setStripMetadata(e.target.checked)} className="accent-emerald-500 rounded" />
                        Strip Metadata (EXIF)
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center">
              <button onClick={compress} disabled={compressing}
                className="px-8 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
                {compressing ? "Compressing..." : "Compress File"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white/5 border border-emerald-400/20 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-3xl font-bold text-emerald-400">{savings}%</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-300">Compression Complete!</p>
              <p className="text-sm text-white/40 mt-1">{formatSize(result.originalSize)} → {formatSize(result.newSize)}</p>
              <p className="text-xs text-white/30 mt-1">Saved {formatSize(result.originalSize - result.newSize)}</p>
            </div>
            <div className="flex justify-center gap-3">
              <button onClick={download} className="px-8 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">Download</button>
              <button onClick={reset} className="px-6 py-3 rounded-xl text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/60">Compress Another</button>
            </div>
          </div>
        )}
        {statusMsg && !result && <p className="text-sm text-center text-white/50">{statusMsg}</p>}
      </div>
    </ToolLayout>
  )
}
