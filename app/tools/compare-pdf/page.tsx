"use client"

import { useState, useCallback, useRef } from "react"
import ToolLayout from "@/components/ToolLayout"
import { usePing } from "@/lib/usePing"

type PageImg = { dataUrl: string }

export default function ComparePdfPage() {
  usePing()
  const [fileA, setFileA] = useState<File | null>(null)
  const [fileB, setFileB] = useState<File | null>(null)
  const [pagesA, setPagesA] = useState<PageImg[]>([])
  const [pagesB, setPagesB] = useState<PageImg[]>([])
  const [pageA, setPageA] = useState(0)
  const [pageB, setPageB] = useState(0)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"side" | "overlay">("side")
  const refA = useRef<HTMLInputElement>(null)
  const refB = useRef<HTMLInputElement>(null)

  const renderPages = async (f: File): Promise<PageImg[]> => {
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
      imgs.push({ dataUrl: canvas.toDataURL() })
    }
    return imgs
  }

  const compare = useCallback(async () => {
    if (!fileA || !fileB) return
    setLoading(true); setStatus("Rendering PDFs for comparison...")
    try {
      const [a, b] = await Promise.all([renderPages(fileA), renderPages(fileB)])
      setPagesA(a); setPagesB(b); setPageA(0); setPageB(0)
      setStatus(`PDF A: ${a.length} pages, PDF B: ${b.length} pages`)
    } catch { setStatus("Error rendering PDFs") }
    setLoading(false)
  }, [fileA, fileB])

  return (
    <ToolLayout title="Compare PDFs" subtitle="Side-by-side PDF comparison">
      <div className="space-y-5">
        {pagesA.length === 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">PDF A (Original)</h3>
                {fileA ? (
                  <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-300 text-[9px] font-bold">A</div><span className="text-xs text-white/60 truncate flex-1">{fileA.name}</span><button onClick={() => setFileA(null)} className="text-white/30 text-xs hover:text-white">✕</button></div>
                ) : (
                  <button onClick={() => refA.current?.click()} className="w-full py-6 rounded-xl border-2 border-dashed border-white/20 text-white/40 text-sm hover:border-blue-400/40 hover:bg-white/5 transition">Select PDF A</button>
                )}
                <input ref={refA} type="file" accept=".pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) setFileA(e.target.files[0]); e.target.value = "" }} />
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">PDF B (Modified)</h3>
                {fileB ? (
                  <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-300 text-[9px] font-bold">B</div><span className="text-xs text-white/60 truncate flex-1">{fileB.name}</span><button onClick={() => setFileB(null)} className="text-white/30 text-xs hover:text-white">✕</button></div>
                ) : (
                  <button onClick={() => refB.current?.click()} className="w-full py-6 rounded-xl border-2 border-dashed border-white/20 text-white/40 text-sm hover:border-orange-400/40 hover:bg-white/5 transition">Select PDF B</button>
                )}
                <input ref={refB} type="file" accept=".pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) setFileB(e.target.files[0]); e.target.value = "" }} />
              </div>
            </div>
            <div className="flex justify-center">
              <button onClick={compare} disabled={!fileA || !fileB || loading}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-40">
                {loading ? "Rendering..." : "Compare"}
              </button>
            </div>
            {status && <p className="text-xs text-center text-emerald-400">{status}</p>}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1">
                {(["side", "overlay"] as const).map(m => (
                  <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition ${viewMode === m ? "bg-blue-500/30 text-blue-300 border border-blue-400/30" : "bg-white/5 text-white/40 border border-white/10"}`}>{m === "side" ? "Side by Side" : "Overlay"}</button>
                ))}
              </div>
              <div className="flex-1" />
              <button onClick={() => { setPagesA([]); setPagesB([]); setFileA(null); setFileB(null); setStatus("") }} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/50">New Compare</button>
            </div>
            {status && <p className="text-xs text-emerald-400">{status}</p>}

            {viewMode === "side" ? (
              <div className="grid grid-cols-2 gap-3">
                {/* PDF A */}
                <div className="rounded-xl border border-blue-400/30 overflow-hidden bg-white">
                  <div className="px-3 py-1.5 bg-blue-500/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-blue-300 font-medium truncate">A: {fileA?.name}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setPageA(Math.max(0, pageA - 1))} disabled={pageA === 0} className="w-6 h-6 rounded text-[10px] bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 disabled:opacity-30 transition">←</button>
                      <select value={pageA} onChange={e => setPageA(Number(e.target.value))} className="bg-blue-500/20 text-blue-300 text-[10px] rounded px-1 py-0.5 border-none outline-none">
                        {pagesA.map((_, i) => <option key={i} value={i} className="bg-[#0b1333] text-white">Page {i + 1}</option>)}
                      </select>
                      <button onClick={() => setPageA(Math.min(pagesA.length - 1, pageA + 1))} disabled={pageA >= pagesA.length - 1} className="w-6 h-6 rounded text-[10px] bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 disabled:opacity-30 transition">→</button>
                      <span className="text-[9px] text-blue-300/50">/ {pagesA.length}</span>
                    </div>
                  </div>
                  {pagesA[pageA] ? <img src={pagesA[pageA].dataUrl} className="w-full" /> : <div className="h-40 flex items-center justify-center text-white/20 text-xs">No page</div>}
                </div>
                {/* PDF B */}
                <div className="rounded-xl border border-orange-400/30 overflow-hidden bg-white">
                  <div className="px-3 py-1.5 bg-orange-500/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-orange-300 font-medium truncate">B: {fileB?.name}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setPageB(Math.max(0, pageB - 1))} disabled={pageB === 0} className="w-6 h-6 rounded text-[10px] bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 disabled:opacity-30 transition">←</button>
                      <select value={pageB} onChange={e => setPageB(Number(e.target.value))} className="bg-orange-500/20 text-orange-300 text-[10px] rounded px-1 py-0.5 border-none outline-none">
                        {pagesB.map((_, i) => <option key={i} value={i} className="bg-[#0b1333] text-white">Page {i + 1}</option>)}
                      </select>
                      <button onClick={() => setPageB(Math.min(pagesB.length - 1, pageB + 1))} disabled={pageB >= pagesB.length - 1} className="w-6 h-6 rounded text-[10px] bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 disabled:opacity-30 transition">→</button>
                      <span className="text-[9px] text-orange-300/50">/ {pagesB.length}</span>
                    </div>
                  </div>
                  {pagesB[pageB] ? <img src={pagesB[pageB].dataUrl} className="w-full" /> : <div className="h-40 flex items-center justify-center text-white/20 text-xs">No page</div>}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 justify-center">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-blue-300">A:</span>
                    <select value={pageA} onChange={e => setPageA(Number(e.target.value))} className="bg-blue-500/20 text-blue-300 text-[10px] rounded px-1.5 py-1 border-none outline-none">
                      {pagesA.map((_, i) => <option key={i} value={i} className="bg-[#0b1333] text-white">Page {i + 1}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-orange-300">B:</span>
                    <select value={pageB} onChange={e => setPageB(Number(e.target.value))} className="bg-orange-500/20 text-orange-300 text-[10px] rounded px-1.5 py-1 border-none outline-none">
                      {pagesB.map((_, i) => <option key={i} value={i} className="bg-[#0b1333] text-white">Page {i + 1}</option>)}
                    </select>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 overflow-hidden bg-white relative">
                  {pagesA[pageA] && <img src={pagesA[pageA].dataUrl} className="w-full" />}
                  {pagesB[pageB] && <img src={pagesB[pageB].dataUrl} className="w-full absolute inset-0 mix-blend-difference opacity-80" />}
                </div>
              </>
            )}

            {/* Quick page thumbnails for A */}
            <div className="space-y-1">
              <p className="text-[10px] text-blue-300/60 font-medium">PDF A pages:</p>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {pagesA.map((_, i) => (
                  <button key={i} onClick={() => setPageA(i)}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg text-[10px] font-medium transition ${pageA === i ? "bg-blue-500/30 text-blue-300 border border-blue-400/30" : "bg-white/5 text-white/30 border border-white/10 hover:bg-white/10"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-orange-300/60 font-medium">PDF B pages:</p>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {pagesB.map((_, i) => (
                  <button key={i} onClick={() => setPageB(i)}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg text-[10px] font-medium transition ${pageB === i ? "bg-orange-500/30 text-orange-300 border border-orange-400/30" : "bg-white/5 text-white/30 border border-white/10 hover:bg-white/10"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  )
}
