"use client"

import { useState } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

export default function ExtractImagesPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)

  const process = async () => {
    if (!file) return
    setLoading(true); setImages([]); setStatus("Rendering pages as images...")
    try {
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
      const imgs: string[] = []
      for (let i = 1; i <= pdf.numPages; i++) {
        setStatus(`Rendering page ${i}/${pdf.numPages}...`)
        const page = await pdf.getPage(i)
        const vp = page.getViewport({ scale: 2 })
        const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height
        await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise
        imgs.push(c.toDataURL("image/png"))
      }
      setImages(imgs)
      setStatus(`Done! ${imgs.length} page image(s) extracted`)
      const editResult = await trackEdit({ fileName: file.name.replace(".pdf", "_images"), fileSize: file.size, fileType: "png", toolUsed: "extract-images" })
      if (!editResult.allowed) { setStatus(editResult.error || "Edit limit reached") }
    } catch (e: any) { setStatus("Error: " + e.message) }
    setLoading(false)
  }

  const downloadAll = () => {
    images.forEach((img, i) => {
      const a = document.createElement("a"); a.href = img; a.download = `page_${i + 1}.png`; a.click()
    })
  }

  const downloadOne = (img: string, idx: number) => {
    const a = document.createElement("a"); a.href = img; a.download = `page_${idx + 1}.png`; a.click()
  }

  return (
    <ToolLayout title="Extract Images" subtitle="Extract page images from a PDF file">
      <div className="space-y-5">
        {!file ? (
          <FileUploader accept=".pdf" onFile={f => setFile(f)} label="Upload a PDF to extract images" sublabel="Each page will be rendered as a high-quality PNG image" cloudFilterTypes={["pdf"]} />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 flex-1">{file.name}</div>
              <button onClick={process} disabled={loading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-white disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-lg">
                {loading ? "Extracting..." : "Extract Images"}
              </button>
              {images.length > 0 && (
                <button onClick={downloadAll}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:scale-105 transition">
                  Download All ({images.length})
                </button>
              )}
              <button onClick={() => { setFile(null); setImages([]); setStatus("") }}
                className="px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/50">
                Clear
              </button>
            </div>

            {status && (
              <p className={`text-xs ${status.startsWith("Error") ? "text-red-400" : status.startsWith("Done") ? "text-emerald-400" : "text-white/50"}`}>
                {status}
              </p>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10 bg-white/5">
                    <img src={img} alt={`Page ${i + 1}`} className="w-full" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <button onClick={() => downloadOne(img, i)}
                        className="px-3 py-1.5 rounded-lg bg-white/90 text-black text-xs font-semibold opacity-0 group-hover:opacity-100 transition hover:bg-white">
                        Save PNG
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Page {i + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
