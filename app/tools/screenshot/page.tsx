"use client"
import { useState, useRef, useCallback } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { usePing } from "@/lib/usePing"

export default function ScreenshotPage() {
  usePing()
  const [mode, setMode] = useState<"url" | "html">("url")
  const [url, setUrl] = useState("")
  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")
  const [screenshotUrl, setScreenshotUrl] = useState("")
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png")
  const [quality, setQuality] = useState(90)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const normalizeUrl = (input: string) => {
    let u = input.trim()
    if (!u) return ""
    if (!/^https?:\/\//i.test(u)) u = "https://" + u
    return u
  }

  const loadUrlPreview = () => {
    const normalized = normalizeUrl(url)
    if (!normalized) return
    setPreviewUrl(normalized)
    setScreenshotUrl("")
    setStatus("Page loaded. Click 'Take Screenshot' to capture.")
  }

  const loadHtmlPreview = useCallback(async (f: File) => {
    setHtmlFile(f)
    const text = await f.text()
    const blob = new Blob([text], { type: "text/html" })
    const blobUrl = URL.createObjectURL(blob)
    setPreviewUrl(blobUrl)
    setScreenshotUrl("")
    setStatus("HTML loaded. Click 'Take Screenshot' to capture.")
  }, [])

  const takeScreenshot = async () => {
    setLoading(true)
    setStatus("Capturing screenshot...")
    try {
      const html2canvas = (await import("html2canvas")).default
      const iframe = iframeRef.current
      if (!iframe) throw new Error("No preview loaded")

      // Try to capture from iframe content
      let targetEl: HTMLElement | null = null
      try {
        targetEl = iframe.contentDocument?.body || null
      } catch {
        // Cross-origin - fall back to capturing the iframe element itself
        targetEl = null
      }

      let canvas: HTMLCanvasElement
      if (targetEl) {
        canvas = await html2canvas(targetEl, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          width: iframe.contentWindow?.innerWidth || 1920,
          height: iframe.contentDocument?.body.scrollHeight || 1080,
        })
      } else {
        // Fallback: capture the iframe container
        canvas = await html2canvas(iframe.parentElement || iframe, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        })
      }

      const mimeType = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png"
      const dataUrl = canvas.toDataURL(mimeType, quality / 100)
      if (screenshotUrl) URL.revokeObjectURL(screenshotUrl)
      setScreenshotUrl(dataUrl)
      setStatus("Screenshot captured! Click Download to save.")
    } catch (e: any) {
      setStatus("Error: " + e.message + ". Try using an HTML file instead of a URL for best results.")
    }
    setLoading(false)
  }

  const download = () => {
    if (!screenshotUrl) return
    const ext = format === "jpeg" ? "jpg" : format
    const name = mode === "url" ? "screenshot" : (htmlFile?.name.replace(/\.html?$/i, "") || "screenshot")
    const a = document.createElement("a")
    a.href = screenshotUrl
    a.download = `${name}.${ext}`
    a.click()
  }

  const reset = () => {
    setUrl("")
    setHtmlFile(null)
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
    setPreviewUrl("")
    if (screenshotUrl.startsWith("blob:")) URL.revokeObjectURL(screenshotUrl)
    setScreenshotUrl("")
    setStatus("")
  }

  return (
    <ToolLayout title="Screenshot" subtitle="Capture screenshots of web pages or HTML files">
      <div className="space-y-5">
        <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-4">
          <div className="flex gap-1.5 mb-1">
            <button onClick={() => { setMode("url"); reset() }} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${mode === "url" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "bg-white/5 text-white/40 border border-white/10"}`}>URL Screenshot</button>
            <button onClick={() => { setMode("html"); reset() }} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${mode === "html" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "bg-white/5 text-white/40 border border-white/10"}`}>HTML File</button>
          </div>

          {mode === "url" ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && loadUrlPreview()}
                placeholder="Enter URL (e.g. example.com)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400/50 placeholder:text-white/30"
              />
              <button onClick={loadUrlPreview} disabled={!url.trim()} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-lg">Load</button>
            </div>
          ) : (
            !htmlFile ? (
              <FileUploader accept=".html,.htm" onFile={loadHtmlPreview} label="Upload an HTML file" sublabel="Take a screenshot of any HTML document" />
            ) : (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 flex items-center justify-between">
                <span className="truncate">{htmlFile.name}</span>
                <button onClick={reset} className="text-xs text-white/30 hover:text-white ml-3">✕</button>
              </div>
            )
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-1">
              {(["png", "jpeg", "webp"] as const).map(f => (
                <button key={f} onClick={() => setFormat(f)} className={`px-3 py-1.5 rounded-lg text-[10px] font-medium uppercase transition ${format === f ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "bg-white/5 text-white/30 border border-white/10"}`}>{f}</button>
              ))}
            </div>
            {format !== "png" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">Quality:</span>
                <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-24 accent-cyan-500" />
                <span className="text-[10px] text-white/40">{quality}%</span>
              </div>
            )}
          </div>
        </div>

        {previewUrl && (
          <>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-white">Preview</h3>
                <div className="flex-1" />
                <button onClick={reset} className="text-xs text-white/30 hover:text-white transition">Reset</button>
              </div>
              <div className="rounded-lg border border-white/10 overflow-hidden bg-white" style={{ height: "50vh" }}>
                <iframe ref={iframeRef} src={previewUrl} className="w-full h-full" sandbox="allow-same-origin allow-scripts allow-popups allow-forms" />
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center flex-wrap">
              <button onClick={reset} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/50">New {mode === "url" ? "URL" : "File"}</button>
              <button onClick={takeScreenshot} disabled={loading} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-white disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-lg">
                {loading ? "Capturing..." : "Take Screenshot"}
              </button>
              {screenshotUrl && <button onClick={download} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">Download</button>}
            </div>
          </>
        )}

        {screenshotUrl && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Screenshot Result</h3>
            <div className="flex justify-center">
              <img src={screenshotUrl} alt="Screenshot" className="max-h-[60vh] w-auto rounded-lg border border-white/10" />
            </div>
          </div>
        )}

        {status && <p className={`text-xs text-center ${status.startsWith("Error") ? "text-red-400" : status.includes("captured") ? "text-emerald-400" : "text-white/50"}`}>{status}</p>}

        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-[11px] text-white/30 space-y-1">
          <p><strong className="text-white/50">URL mode:</strong> Some sites block embedding (X-Frame-Options). Use HTML file mode for reliable results.</p>
          <p><strong className="text-white/50">HTML mode:</strong> Upload any .html file to screenshot it perfectly, including local HTML exports.</p>
        </div>
      </div>
    </ToolLayout>
  )
}
