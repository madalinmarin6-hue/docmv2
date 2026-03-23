"use client"

import { useState, useCallback } from "react"
import { PDFDocument } from "pdf-lib"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

export default function ScannerEffectPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [noise, setNoise] = useState(15)
  const [rotation, setRotation] = useState(1.5)
  const [brightness, setBrightness] = useState(-5)
  const [previewUrl, setPreviewUrl] = useState("")
  const [status, setStatus] = useState("")
  const [processing, setProcessing] = useState(false)

  const process = useCallback(async () => {
    if (!file) return
    setProcessing(true); setStatus("Applying scanner effect...")
    try {
      const buffer = await file.arrayBuffer()
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      const srcPdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
      const dest = await PDFDocument.create()

      for (let i = 0; i < srcPdf.numPages; i++) {
        setStatus(`Processing page ${i + 1} of ${srcPdf.numPages}...`)
        const page = await srcPdf.getPage(i + 1)
        const vp = page.getViewport({ scale: 2 })
        const canvas = document.createElement("canvas")
        canvas.width = vp.width; canvas.height = vp.height
        const ctx = canvas.getContext("2d")!

        ctx.fillStyle = "#f5f0e8"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.save()
        const angle = (Math.random() - 0.5) * rotation * (Math.PI / 180)
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate(angle)
        ctx.translate(-canvas.width / 2, -canvas.height / 2)
        await page.render({ canvasContext: ctx, viewport: vp }).promise
        ctx.restore()

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = imgData.data
        for (let p = 0; p < d.length; p += 4) {
          const n = (Math.random() - 0.5) * noise
          d[p] = Math.max(0, Math.min(255, d[p] + brightness + n))
          d[p + 1] = Math.max(0, Math.min(255, d[p + 1] + brightness + n))
          d[p + 2] = Math.max(0, Math.min(255, d[p + 2] + brightness + n))
          d[p] = Math.min(255, d[p] + 3)
          d[p + 2] = Math.max(0, d[p + 2] - 5)
        }
        ctx.putImageData(imgData, 0, 0)

        const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width * 0.35, canvas.width / 2, canvas.height / 2, canvas.width * 0.7)
        grad.addColorStop(0, "rgba(0,0,0,0)")
        grad.addColorStop(1, "rgba(0,0,0,0.08)")
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const imgBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/jpeg", 0.88))
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
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(blob))
      const outName = file.name.replace(".pdf", "_scanned.pdf")
      trackEdit({ fileName: outName, fileSize: blob.size, fileType: "application/pdf", toolUsed: "scanner-effect" })
      saveToCloud(blob, outName, "scanner-effect")
      setStatus("Scanner effect applied! Preview below.")
    } catch (err) { console.error(err); setStatus("Error applying effect") }
    setProcessing(false)
  }, [file, noise, rotation, brightness, previewUrl])

  const download = () => { if (!previewUrl) return; const a = document.createElement("a"); a.href = previewUrl; a.download = file!.name.replace(".pdf", "_scanned.pdf"); a.click() }

  return (
    <ToolLayout title="Scanner Effect" subtitle="Make your PDF look like it was scanned">
      <div className="space-y-5">
        {!file ? (
          <FileUploader accept=".pdf" onFile={f => setFile(f)} label="Upload a PDF to apply scanner effect" sublabel="Adds noise, slight rotation, paper tone for a scanned look" cloudFilterTypes={["pdf"]} />
        ) : (
          <>
            <div className="max-w-lg mx-auto rounded-xl bg-white/5 border border-white/10 p-5 space-y-3">
              <p className="text-sm text-white/60">{file.name}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><span className="text-[10px] text-white/30 w-16">Noise</span><input type="range" min={0} max={50} value={noise} onChange={e => setNoise(Number(e.target.value))} className="flex-1 accent-amber-500" /><span className="text-[10px] text-white/40 w-8">{noise}</span></div>
                <div className="flex items-center gap-2"><span className="text-[10px] text-white/30 w-16">Rotation</span><input type="range" min={0} max={5} step={0.1} value={rotation} onChange={e => setRotation(Number(e.target.value))} className="flex-1 accent-amber-500" /><span className="text-[10px] text-white/40 w-8">{rotation}°</span></div>
                <div className="flex items-center gap-2"><span className="text-[10px] text-white/30 w-16">Darken</span><input type="range" min={-30} max={10} value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="flex-1 accent-amber-500" /><span className="text-[10px] text-white/40 w-8">{brightness}</span></div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <button onClick={() => { setFile(null); setPreviewUrl(""); setStatus("") }} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/50">New File</button>
              <button onClick={process} disabled={processing}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-40">
                {processing ? "Applying..." : "Apply Scanner Effect"}
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
