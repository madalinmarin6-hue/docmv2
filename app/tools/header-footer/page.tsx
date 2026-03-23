"use client"
import { useState } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

export default function HeaderFooterPage() {
  usePing()
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")
  const [headerText, setHeaderText] = useState("")
  const [footerText, setFooterText] = useState("")
  const [fontSize, setFontSize] = useState(9)
  const [align, setAlign] = useState<"left" | "center" | "right">("center")

  const process = async () => {
    if (!file) return
    setLoading(true); setStatus("Adding header/footer...")
    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib")
      const doc = await PDFDocument.load(await file.arrayBuffer())
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const pages = doc.getPages()
      pages.forEach((page, i) => {
        const { width, height } = page.getSize()
        const hText = headerText.replace("{page}", `${i + 1}`).replace("{total}", `${pages.length}`)
        const fText = footerText.replace("{page}", `${i + 1}`).replace("{total}", `${pages.length}`)
        if (hText) {
          const tw = font.widthOfTextAtSize(hText, fontSize)
          const x = align === "center" ? (width - tw) / 2 : align === "right" ? width - tw - 30 : 30
          page.drawText(hText, { x, y: height - 25, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) })
        }
        if (fText) {
          const tw = font.widthOfTextAtSize(fText, fontSize)
          const x = align === "center" ? (width - tw) / 2 : align === "right" ? width - tw - 30 : 30
          page.drawText(fText, { x, y: 15, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) })
        }
      })
      const bytes = await doc.save()
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob); setPreviewUrl(url)
      const outName = file.name.replace(/\.pdf$/i, "") + "_hf.pdf"
      const a = document.createElement("a"); a.href = url; a.download = outName; a.click()
      trackEdit({ fileName: outName, fileSize: blob.size, fileType: "application/pdf", toolUsed: "header-footer" })
      saveToCloud(blob, outName, "header-footer")
      setStatus("Done!")
    } catch (e: any) { setStatus("Error: " + e.message) }
    setLoading(false)
  }

  return (
    <ToolLayout title="Header & Footer" subtitle="Add custom headers and footers to PDF pages">
      <div className="space-y-5">
        {!file ? (
          <FileUploader accept=".pdf" onFile={f => setFile(f)} label="Upload a PDF to add headers & footers" sublabel="Use {page} and {total} as placeholders" cloudFilterTypes={["pdf"]} />
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 flex items-center justify-between">
              <span className="truncate">{file.name}</span>
              <button onClick={() => { setFile(null); setPreviewUrl(""); setStatus("") }} className="text-xs text-white/30 hover:text-white ml-3">✕</button>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Header & Footer Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-[10px] text-white/40">Header text</label><input type="text" value={headerText} onChange={e => setHeaderText(e.target.value)} placeholder="My Document - {page}/{total}" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-400/50" /></div>
                <div><label className="text-[10px] text-white/40">Footer text</label><input type="text" value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="Page {page} of {total}" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-400/50" /></div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <select value={align} onChange={e => setAlign(e.target.value as "left" | "center" | "right")} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none">
                  <option value="left" className="bg-[#0b1333]">Left</option>
                  <option value="center" className="bg-[#0b1333]">Center</option>
                  <option value="right" className="bg-[#0b1333]">Right</option>
                </select>
                <div className="flex items-center gap-1"><label className="text-[10px] text-white/40">Size:</label><input type="number" value={fontSize} onChange={e => setFontSize(+e.target.value)} min={6} max={18} className="w-14 px-2 py-1 rounded bg-white/5 border border-white/10 text-sm text-white focus:outline-none" /></div>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <button onClick={process} disabled={loading || (!headerText && !footerText)} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 to-blue-500 text-white disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-lg">{loading ? "Processing..." : "Apply"}</button>
            </div>
            {status && <p className={`text-xs text-center ${status.startsWith("Error") ? "text-red-400" : status === "Done!" ? "text-emerald-400" : "text-white/50"}`}>{status}</p>}
            {previewUrl && <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5"><iframe src={previewUrl} className="w-full h-[65vh]" /></div>}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
