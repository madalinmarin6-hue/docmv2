"use client"

import { useState, useCallback, useRef } from "react"
import ToolLayout from "@/components/ToolLayout"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type ImageItem = { id: string; file: File; url: string; name: string; w: number; h: number }

type Props = {
  title: string
  subtitle: string
  acceptTypes: string
}

export default function MultiImageToPdf({ title, subtitle, acceptTypes }: Props) {
  usePing()
  const [images, setImages] = useState<ImageItem[]>([])
  const [status, setStatus] = useState("")
  const [processing, setProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const items: ImageItem[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue
      const url = URL.createObjectURL(file)
      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new Image()
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
        img.onerror = () => resolve({ w: 800, h: 600 })
        img.src = url
      })
      items.push({ id: Math.random().toString(36).slice(2), file, url, name: file.name, w: dims.w, h: dims.h })
    }
    setImages(prev => [...prev, ...items])
    setPreviewUrl("")
  }, [])

  const remove = (id: string) => {
    setImages(prev => {
      const item = prev.find(p => p.id === id)
      if (item) URL.revokeObjectURL(item.url)
      return prev.filter(p => p.id !== id)
    })
    setPreviewUrl("")
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return
    setImages(prev => { const c = [...prev]; [c[from], c[to]] = [c[to], c[from]]; return c })
    setPreviewUrl("")
  }

  const handleDragStart = (i: number) => setDragIdx(i)
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== i) { move(dragIdx, i); setDragIdx(i) } }
  const handleDragEnd = () => setDragIdx(null)

  const createPdf = useCallback(async () => {
    if (images.length === 0) return
    setProcessing(true)
    setStatus("Creating PDF...")
    try {
      const { PDFDocument } = await import("pdf-lib")
      const pdfDoc = await PDFDocument.create()

      for (let i = 0; i < images.length; i++) {
        setStatus(`Processing image ${i + 1}/${images.length}...`)
        const img = images[i]
        const buffer = await img.file.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        const fname = img.name.toLowerCase()

        let pdfImage
        if (fname.endsWith(".jpg") || fname.endsWith(".jpeg")) {
          pdfImage = await pdfDoc.embedJpg(bytes)
        } else if (fname.endsWith(".png")) {
          pdfImage = await pdfDoc.embedPng(bytes)
        } else {
          // Convert other formats via canvas
          const canvas = document.createElement("canvas")
          canvas.width = img.w; canvas.height = img.h
          const ctx = canvas.getContext("2d")!
          ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height)
          const imgEl = new (globalThis as any).Image() as HTMLImageElement
          await new Promise<void>(resolve => { imgEl.onload = () => resolve(); imgEl.onerror = () => resolve(); imgEl.src = img.url })
          ctx.drawImage(imgEl, 0, 0)
          const jpegBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/jpeg", 0.92))
          if (jpegBlob) {
            const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer())
            pdfImage = await pdfDoc.embedJpg(jpegBytes)
          }
        }

        if (pdfImage) {
          const { width, height } = pdfImage.scaleToFit(595, 842)
          const page = pdfDoc.addPage([595, 842])
          page.drawImage(pdfImage, {
            x: (595 - width) / 2,
            y: (842 - height) / 2,
            width, height,
          })
        }
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setStatus(`Created PDF with ${images.length} page${images.length > 1 ? "s" : ""}.`)

      const editResult = await trackEdit({ fileName: "images.pdf", fileSize: blob.size, fileType: "pdf", toolUsed: "image-to-pdf" })
      if (!editResult.allowed) { setStatus(editResult.error || "Edit limit reached"); setProcessing(false); return }
      saveToCloud(blob, "images.pdf", "image-to-pdf")
    } catch (err) {
      console.error(err)
      setStatus("Error creating PDF")
    }
    setProcessing(false)
  }, [images])

  const download = () => {
    if (!previewUrl) return
    const a = document.createElement("a"); a.href = previewUrl; a.download = "images.pdf"; a.click()
  }

  return (
    <ToolLayout title={title} subtitle={subtitle}>
      <div className="space-y-5">
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-white/20 hover:border-purple-400/40 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-white/5">
          <input ref={inputRef} type="file" accept={acceptTypes} multiple className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = "" }} />
          <p className="text-white/60 text-sm font-medium">Click or drag images here</p>
          <p className="text-white/30 text-xs mt-1">Select multiple images — each will become a page in the PDF</p>
        </div>

        {images.length > 0 && (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-white/60"><strong className="text-white">{images.length}</strong> image{images.length > 1 ? "s" : ""}</span>
              <button onClick={() => inputRef.current?.click()} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">+ Add more</button>
              <div className="flex-1" />
              {status && <span className="text-xs text-emerald-400">{status}</span>}
              <button onClick={createPdf} disabled={processing}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-40">
                {processing ? "Creating PDF..." : "Create PDF"}
              </button>
            </div>

            <p className="text-[10px] text-white/30">Drag to reorder. Images will appear as pages in this order.</p>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {images.map((img, i) => (
                <div key={img.id} draggable onDragStart={() => handleDragStart(i)} onDragOver={e => handleDragOver(e, i)} onDragEnd={handleDragEnd}
                  className={`rounded-xl border-2 overflow-hidden flex flex-col transition-all cursor-grab active:cursor-grabbing ${dragIdx === i ? "border-purple-400 bg-purple-500/10 scale-[0.97]" : "border-white/10 bg-white/5"}`}>
                  <div className="relative aspect-[3/4] bg-white/5 flex items-center justify-center overflow-hidden">
                    <img src={img.url} alt={img.name} className="max-w-full max-h-full object-contain" />
                    <button onClick={() => remove(img.id)} className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-red-500/80 text-white text-xs flex items-center justify-center opacity-0 hover:opacity-100 transition">&times;</button>
                  </div>
                  <div className="px-2 py-1.5 bg-white/5">
                    <p className="text-[9px] text-white/40 truncate">{img.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[8px] text-white/30">{img.w}×{img.h}</span>
                      <div className="flex gap-0.5">
                        {i > 0 && <button onClick={() => move(i, i - 1)} className="w-5 h-5 rounded bg-white/5 text-white/30 hover:bg-white/10 text-[9px] flex items-center justify-center">&#8592;</button>}
                        {i < images.length - 1 && <button onClick={() => move(i, i + 1)} className="w-5 h-5 rounded bg-white/5 text-white/30 hover:bg-white/10 text-[9px] flex items-center justify-center">&#8594;</button>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {previewUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-white">Preview</h3>
              <div className="flex-1" />
              <button onClick={() => window.open(previewUrl, "_blank")} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Open
              </button>
              <button onClick={download} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">Download PDF</button>
            </div>
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
              <iframe src={previewUrl} className="w-full h-[60vh]" />
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
