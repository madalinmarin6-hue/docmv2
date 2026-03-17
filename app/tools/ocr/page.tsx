"use client"
import { useState, useCallback, useRef } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

const LANGUAGES = [
  { code: "eng", label: "English" },
  { code: "ron", label: "Romanian" },
  { code: "deu", label: "German" },
  { code: "fra", label: "French" },
  { code: "spa", label: "Spanish" },
  { code: "ita", label: "Italian" },
  { code: "por", label: "Portuguese" },
  { code: "rus", label: "Russian" },
  { code: "pol", label: "Polish" },
  { code: "hun", label: "Hungarian" },
  { code: "tur", label: "Turkish" },
  { code: "nld", label: "Dutch" },
  { code: "chi_sim", label: "Chinese (Simplified)" },
  { code: "jpn", label: "Japanese" },
  { code: "kor", label: "Korean" },
  { code: "ara", label: "Arabic" },
]

export default function OCRPage() {
  usePing()
  const [image, setImage] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState("")
  const [status, setStatus] = useState("")
  const [lang, setLang] = useState("eng")
  const [scale, setScale] = useState(2)
  const workerRef = useRef<any>(null)

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name); setText(""); setProgress(0); setStatus("")
    if (file.type === "application/pdf") {
      setStatus("Rendering PDF page 1...")
      try {
        const pdfjsLib = await import("pdfjs-dist")
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
        const page = await pdf.getPage(1)
        const vp = page.getViewport({ scale: 2 })
        const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height
        await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise
        setImage(c.toDataURL("image/png")); setStatus("PDF rendered — select language and extract text")
      } catch { setStatus("Error rendering PDF") }
    } else {
      const r = new FileReader()
      r.onload = () => { setImage(r.result as string); setStatus("Image loaded — select language and extract text") }
      r.readAsDataURL(file)
    }
  }, [])

  const runOCR = useCallback(async () => {
    if (!image) return
    setLoading(true); setProgress(0); setText(""); setStatus(`Loading ${lang} language data...`)
    try {
      const T = await import("tesseract.js")

      /* Terminate previous worker if language changed */
      if (workerRef.current) {
        try { await workerRef.current.terminate() } catch {}
        workerRef.current = null
      }

      /* Create a fresh worker with the selected language */
      const worker = await T.createWorker(lang, 1, {
        logger: (m: { status: string; progress: number }) => {
          setStatus(m.status)
          if (m.progress) setProgress(Math.round(m.progress * 100))
        },
      })
      workerRef.current = worker

      // Preprocess image: resize, grayscale, contrast boost, adaptive threshold
      setStatus("Preprocessing image...")
      const resizedImage = await new Promise<string>((resolve) => {
        const img = new Image()
        img.onload = () => {
          const w = Math.round(img.width * (scale / 2))
          const h = Math.round(img.height * (scale / 2))
          const c = document.createElement("canvas")
          c.width = w; c.height = h
          const ctx = c.getContext("2d")!
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          ctx.drawImage(img, 0, 0, w, h)

          // Convert to grayscale + boost contrast + binarize for handwriting
          const imageData = ctx.getImageData(0, 0, w, h)
          const d = imageData.data
          for (let i = 0; i < d.length; i += 4) {
            // Grayscale
            let gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
            // Contrast boost (factor 1.6)
            gray = Math.min(255, Math.max(0, ((gray - 128) * 1.6) + 128))
            // Simple threshold for cleaner text
            gray = gray < 140 ? 0 : 255
            d[i] = gray; d[i + 1] = gray; d[i + 2] = gray
          }
          ctx.putImageData(imageData, 0, 0)
          resolve(c.toDataURL("image/png"))
        }
        img.src = image
      })

      setStatus(`Recognizing text in ${LANGUAGES.find(l => l.code === lang)?.label || lang}...`)
      const { data } = await worker.recognize(resizedImage)
      setText(data.text)
      const wc = data.text.split(/\s+/).filter(Boolean).length
      setStatus(`Done! ${wc} words extracted (${LANGUAGES.find(l => l.code === lang)?.label || lang})`)

      await worker.terminate()
      workerRef.current = null
    } catch (err) {
      console.error("OCR error:", err)
      setStatus("OCR failed: " + (err instanceof Error ? err.message : "unknown error"))
    }
    setLoading(false)
  }, [image, lang])

  const exportText = async () => {
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    const outName = (fileName.replace(/\.[^.]+$/, "") || "ocr") + ".txt"
    a.download = outName
    a.click(); URL.revokeObjectURL(url)
    const editResult = await trackEdit({ fileName: outName, fileSize: blob.size, fileType: "txt", toolUsed: "ocr" })
    if (!editResult.allowed) { alert(editResult.error || "Edit limit reached"); return }
    saveToCloud(blob, outName, "ocr")
  }

  return (
    <ToolLayout title="OCR Tool" subtitle="Extract text from images and scanned PDFs using Tesseract.js">
      {!image ? (
        <FileUploader accept=".png,.jpg,.jpeg,.bmp,.webp,.tiff,.pdf" label="Upload an image or scanned PDF" sublabel="Supports PNG, JPG, BMP, WebP, TIFF, PDF" onFile={handleFile} cloudFilterTypes={["png", "jpg", "jpeg", "bmp", "webp", "tiff", "pdf"]} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 flex-wrap">
            <span className="text-sm text-white/70 truncate max-w-[200px]">{fileName}</span>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col">
              <label className="text-[9px] text-white/30 mb-0.5">Document Language</label>
              <select value={lang} onChange={e => setLang(e.target.value)} className="h-8 px-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white" disabled={loading}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-gray-900">{l.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] text-white/30 mb-0.5">Image Scale: {scale}x</label>
              <input type="range" min="1" max="4" step="0.5" value={scale} onChange={e => setScale(Number(e.target.value))} disabled={loading} className="w-20 h-8 accent-purple-500" />
            </div>
            <button onClick={runOCR} disabled={loading} className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50">
              {loading ? "Processing..." : "Extract Text"}
            </button>
            <div className="flex-1" />
            {text && <button onClick={exportText} className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:scale-105 transition">Export .txt</button>}
            {text && <button onClick={() => navigator.clipboard.writeText(text)} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition">Copy</button>}
            <button onClick={() => { setImage(null); setText(""); setStatus("") }} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition">Close</button>
          </div>

          {loading && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-white/50"><span>{status}</span><span>{progress}%</span></div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} /></div>
            </div>
          )}
          {!loading && status && <p className="text-xs text-emerald-400">{status}</p>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 overflow-hidden bg-black/20">
              <div className="px-3 py-1.5 bg-white/5 border-b border-white/10 text-xs text-white/40">Source Image</div>
              <div className="p-2 flex items-center justify-center max-h-[55vh] overflow-auto">
                <img src={image} alt="Source" className="max-w-full max-h-[50vh] object-contain rounded" />
              </div>
            </div>
            <div className="rounded-xl border border-white/10 overflow-hidden bg-black/20 flex flex-col">
              <div className="px-3 py-1.5 bg-white/5 border-b border-white/10 text-xs text-white/40">Extracted Text ({LANGUAGES.find(l => l.code === lang)?.label})</div>
              <textarea value={text} onChange={e => setText(e.target.value)} className="flex-1 px-4 py-3 bg-transparent text-white/90 text-sm font-mono leading-relaxed resize-none outline-none min-h-[50vh]" placeholder={loading ? "Processing..." : "Click 'Extract Text' to start OCR..."} />
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
