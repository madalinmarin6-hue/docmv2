"use client"
import { useState, useRef } from "react"
import ToolLayout from "@/components/ToolLayout"
import { usePing } from "@/lib/usePing"

export default function UrlToPdfPage() {
  usePing()
  const [url, setUrl] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")
  const [landscape, setLandscape] = useState(false)
  const [scale, setScale] = useState(1)
  const [showIframe, setShowIframe] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const normalizeUrl = (input: string) => {
    let u = input.trim()
    if (!u) return ""
    if (!/^https?:\/\//i.test(u)) u = "https://" + u
    return u
  }

  const loadPreview = () => {
    const normalized = normalizeUrl(url)
    if (!normalized) return
    setPreviewUrl(normalized)
    setShowIframe(true)
    setStatus("Page loaded in preview. Click 'Save as PDF' to generate the PDF using your browser's print dialog.")
  }

  const generatePdf = async () => {
    if (!showIframe) return
    setLoading(true)
    setStatus("Opening print dialog... Use 'Save as PDF' as the destination.")
    try {
      // Use browser print - this is the most reliable cross-browser approach
      const printWindow = window.open(previewUrl, "_blank")
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          setTimeout(() => {
            printWindow.print()
          }, 1500)
        })
        setStatus("Print dialog opened in new tab. Select 'Save as PDF' to download.")
      } else {
        setStatus("Pop-up blocked. Please allow pop-ups for this site, or use Ctrl+P on the preview below.")
      }
    } catch (e: any) {
      setStatus("Error: " + e.message)
    }
    setLoading(false)
  }

  const reset = () => {
    setUrl("")
    setPreviewUrl("")
    setShowIframe(false)
    setStatus("")
  }

  return (
    <ToolLayout title="URL → PDF" subtitle="Convert any webpage to a PDF document">
      <div className="space-y-5">
        <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && loadPreview()}
              placeholder="Enter URL (e.g. example.com or https://example.com)"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-400/50 placeholder:text-white/30"
            />
            <button
              onClick={loadPreview}
              disabled={!url.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              Load Page
            </button>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
              <input type="checkbox" checked={landscape} onChange={e => setLandscape(e.target.checked)} className="accent-indigo-500 rounded" />
              Landscape
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Scale:</span>
              <input type="range" min={50} max={150} value={scale * 100} onChange={e => setScale(Number(e.target.value) / 100)} className="w-24 accent-indigo-500" />
              <span className="text-[10px] text-white/40 w-8">{Math.round(scale * 100)}%</span>
            </div>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {["https://google.com", "https://github.com", "https://wikipedia.org"].map(u => (
              <button key={u} onClick={() => { setUrl(u); }} className="px-2.5 py-1 rounded-lg text-[10px] bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60 transition">{u.replace("https://", "")}</button>
            ))}
          </div>
        </div>

        {showIframe && (
          <>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-white">Page Preview</h3>
                <span className="text-[10px] text-white/30 truncate flex-1">{previewUrl}</span>
                <button onClick={reset} className="text-xs text-white/30 hover:text-white transition">New URL</button>
              </div>
              <div className="rounded-lg border border-white/10 overflow-hidden bg-white" style={{ height: "60vh" }}>
                <iframe
                  ref={iframeRef}
                  src={previewUrl}
                  className="w-full h-full"
                  style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: `${100 / scale}%`, height: `${100 / scale}%` }}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center flex-wrap">
              <button onClick={reset} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/50">New URL</button>
              <button
                onClick={generatePdf}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                {loading ? "Opening..." : "Save as PDF"}
              </button>
            </div>
          </>
        )}

        {status && <p className={`text-xs text-center ${status.startsWith("Error") ? "text-red-400" : status.includes("dialog") ? "text-emerald-400" : "text-white/50"}`}>{status}</p>}

        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-[11px] text-white/30 space-y-1">
          <p><strong className="text-white/50">How it works:</strong> Enter a URL, preview it, then use the browser&apos;s built-in print function to save as PDF.</p>
          <p><strong className="text-white/50">Tip:</strong> You can also press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/50">Ctrl+P</kbd> while the preview is focused to print directly.</p>
          <p><strong className="text-white/50">Note:</strong> Some websites may block embedding. In that case, open the URL in a new tab and use Ctrl+P.</p>
        </div>
      </div>
    </ToolLayout>
  )
}
