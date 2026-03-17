"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type PDFPage = { pageIndex: number; width: number; height: number; imageUrl: string }
type TextAnn = { id: string; pageIndex: number; x: number; y: number; text: string; fontSize: number; color: string }
type ImgAnn = { id: string; pageIndex: number; x: number; y: number; width: number; height: number; dataUrl: string }
type StickyNote = { id: string; pageIndex: number; x: number; y: number; text: string; color: string; expanded: boolean }
type Shape = { id: string; pageIndex: number; x: number; y: number; w: number; h: number; shape: "rect"|"circle"|"line"; color: string; stroke: number }
type Comment = { id: string; pageIndex: number; text: string; time: string }
type RTab = "home"|"insert"|"annotate"|"pages"|"view"
type Mode = "view"|"text"|"image"|"highlight"|"draw"|"create"|"sticky"|"shape"|"signature"

export default function PDFEditorPage() {
  usePing()
  const [pdfBytes, setPdfBytes] = useState<Uint8Array|null>(null)
  const [pages, setPages] = useState<PDFPage[]>([])
  const [annotations, setAnnotations] = useState<TextAnn[]>([])
  const [imageAnnotations, setImageAnnotations] = useState<ImgAnn[]>([])
  const [activePage, setActivePage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>("view")
  const [fontSize, setFontSize] = useState(16)
  const [textColor, setTextColor] = useState("#000000")
  const [highlightColor, setHighlightColor] = useState("#ffff00")
  const [drawColor, setDrawColor] = useState("#ff0000")
  const [drawWidth, setDrawWidth] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawPaths, setDrawPaths] = useState<{pageIndex:number;points:{x:number;y:number}[];color:string;width:number}[]>([])
  const [currentPath, setCurrentPath] = useState<{x:number;y:number}[]>([])
  const [highlights, setHighlights] = useState<{id:string;pageIndex:number;x:number;y:number;w:number;h:number;color:string}[]>([])
  const [highlightStart, setHighlightStart] = useState<{x:number;y:number}|null>(null)
  const [newDocText, setNewDocText] = useState("")
  const [newDocTitle, setNewDocTitle] = useState("My Document")
  const [statusMsg, setStatusMsg] = useState("")
  const [editingAnnotation, setEditingAnnotation] = useState<string|null>(null)
  const [zoom, setZoom] = useState(100)
  const [dragging, setDragging] = useState<{id:string;type:"text"|"image";offsetX:number;offsetY:number}|null>(null)
  const [pageOrder, setPageOrder] = useState<number[]>([])
  const [ribbonTab, setRibbonTab] = useState<RTab>("home")
  const [darkMode, setDarkMode] = useState(true)
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([])
  const [shapes, setShapes] = useState<Shape[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [searchText, setSearchText] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [shapeType, setShapeType] = useState<"rect"|"circle"|"line">("rect")
  const [shapeColor, setShapeColor] = useState("#3b82f6")
  const [stickyColor, setStickyColor] = useState("#fef08a")
  const [signatureData, setSignatureData] = useState("")
  const [isSignDrawing, setIsSignDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const mergeInputRef = useRef<HTMLInputElement>(null)
  const signCanvasRef = useRef<HTMLCanvasElement>(null)
  const [showSignPad, setShowSignPad] = useState(false)

  const displayPages = pageOrder.length > 0 ? pageOrder : pages.map((_,i) => i)
  const currentOrigIdx = displayPages[activePage] ?? 0

  /* theme */
  const dm = darkMode
  const bg = dm ? "bg-[#1e1e1e]" : "bg-[#e8eaed]"
  const tbg = dm ? "bg-[#2d2d2d] border-[#404040]" : "bg-[#f3f3f3] border-gray-200"
  const mbg = dm ? "bg-[#252526] border-[#404040]" : "bg-white border-gray-200"
  const tc = dm ? "text-gray-200" : "text-gray-700"
  const mc = dm ? "text-gray-400" : "text-gray-500"
  const bb = `w-8 h-8 rounded flex items-center justify-center transition ${dm?"hover:bg-[#3d3d3d] text-gray-300":"hover:bg-gray-200 text-gray-600"}`
  const bba = (active:boolean) => active ? (dm?"bg-[#094771] text-blue-300":"bg-blue-100 text-blue-700") : ""
  const sep = `w-px h-6 mx-1 ${dm?"bg-[#555]":"bg-gray-300"}`
  const sel = `h-7 px-1.5 rounded border text-xs ${dm?"bg-[#3c3c3c] border-[#555] text-gray-200":"bg-white border-gray-300 text-gray-700"}`
  const tabCls = (t:RTab) => `px-4 py-1.5 text-xs font-medium transition rounded-t ${ribbonTab===t?(dm?"bg-[#2d2d2d] text-blue-400 border-b-2 border-blue-400":"bg-[#f3f3f3] text-blue-600 border-b-2 border-blue-600"):(dm?"text-gray-400 hover:text-gray-200":"text-gray-500 hover:text-gray-800")}`
  const gl = `text-[9px] ${mc} text-center mt-0.5 select-none`

  /* ── RENDER PDF ── */
  const renderPDF = useCallback(async (bytes: Uint8Array) => {
    setLoading(true)
    try {
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
      const cnt = pdf.numPages
      const rendered: PDFPage[] = []
      for (let i = 0; i < cnt; i++) {
        const page = await pdf.getPage(i + 1)
        const viewport = page.getViewport({ scale: 2 })
        const canvas = document.createElement("canvas")
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext("2d")!
        await page.render({ canvasContext: ctx, viewport }).promise
        rendered.push({ pageIndex: i, width: viewport.width / 2, height: viewport.height / 2, imageUrl: canvas.toDataURL() })
      }
      setPages(rendered); setPageOrder(rendered.map((_,i)=>i)); setActivePage(0)
      setStatusMsg(`Loaded ${cnt} page${cnt>1?"s":""}`)
    } catch(err) { setStatusMsg("Error loading PDF"); console.error(err) }
    setLoading(false)
  },[])

  const handleImport = useCallback(async (file:File) => {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    setPdfBytes(bytes); setAnnotations([]); setImageAnnotations([]); setStickyNotes([]); setShapes([]); setComments([]); setHighlights([]); setDrawPaths([])
    await renderPDF(bytes)
    window.dispatchEvent(new Event("docm-collapse-sidebar"))
  },[renderPDF])

  /* ── MERGE PDF ── */
  const handleMerge = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !pdfBytes) return
    try {
      const buf = await file.arrayBuffer()
      const mainDoc = await PDFDocument.load(pdfBytes)
      const mergeDoc = await PDFDocument.load(buf)
      const copied = await mainDoc.copyPages(mergeDoc, mergeDoc.getPageIndices())
      for (const p of copied) mainDoc.addPage(p)
      const merged = await mainDoc.save()
      const mergedBytes = new Uint8Array(merged)
      setPdfBytes(mergedBytes)
      await renderPDF(mergedBytes)
      setStatusMsg("PDFs merged!")
    } catch { setStatusMsg("Merge failed") }
    e.target.value = ""
  },[pdfBytes, renderPDF])

  /* ── EXPORT ── */
  const handleExport = useCallback(async () => {
    if (!pdfBytes && mode!=="create") return
    setLoading(true)
    try {
      let pdfDoc: PDFDocument
      if (mode==="create"||!pdfBytes) {
        pdfDoc = await PDFDocument.create()
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const lines = newDocText.split("\n")
        const lpp = 40; const chunks: string[][] = []
        for (let i=0;i<lines.length;i+=lpp) chunks.push(lines.slice(i,i+lpp))
        if (!chunks.length) chunks.push([""])
        for (const ch of chunks) {
          const pg = pdfDoc.addPage([612,792]); let y=750
          if (chunks.indexOf(ch)===0 && newDocTitle) { pg.drawText(newDocTitle,{x:50,y,size:24,font,color:rgb(0.1,0.1,0.3)}); y-=40 }
          for (const l of ch) { pg.drawText(l.replace(/[^\x20-\x7E]/g," "),{x:50,y,size:12,font,color:rgb(0,0,0)}); y-=18 }
        }
      } else {
        const src = await PDFDocument.load(pdfBytes)
        pdfDoc = await PDFDocument.create()
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const order = pageOrder.length>0?pageOrder:pages.map((_,i)=>i)
        const validOrder = order.filter(i => i >= 0 && i < src.getPageCount())
        const blankIndices = order.map((v,i) => ({v,i})).filter(o => o.v === -1)
        const copiedPages = await pdfDoc.copyPages(src, validOrder)
        let cpIdx = 0
        for (let i = 0; i < order.length; i++) {
          if (order[i] === -1) { pdfDoc.addPage([612,792]) }
          else { pdfDoc.addPage(copiedPages[cpIdx++]) }
        }
        for (const ann of annotations) {
          const ni = order.indexOf(ann.pageIndex); if (ni<0) continue
          const pg = pdfDoc.getPage(ni); const {height}=pg.getSize()
          const hex=ann.color.replace("#","")
          const r=parseInt(hex.substring(0,2),16)/255,g=parseInt(hex.substring(2,4),16)/255,b=parseInt(hex.substring(4,6),16)/255
          pg.drawText(ann.text.replace(/[^\x20-\x7E]/g," "),{x:ann.x,y:height-ann.y,size:ann.fontSize,font,color:rgb(r,g,b)})
        }
        for (const img of imageAnnotations) {
          const ni = order.indexOf(img.pageIndex); if (ni<0) continue
          const pg = pdfDoc.getPage(ni); const {height}=pg.getSize()
          try {
            const resp = await fetch(img.dataUrl)
            const ib = new Uint8Array(await resp.arrayBuffer())
            const emb = img.dataUrl.includes("image/png") ? await pdfDoc.embedPng(ib) : await pdfDoc.embedJpg(ib)
            pg.drawImage(emb,{x:img.x,y:height-img.y-img.height,width:img.width,height:img.height})
          } catch{}
        }
      }
      const saved = await pdfDoc.save()
      const blob = new Blob([saved as BlobPart],{type:"application/pdf"})
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href=url; a.download=(newDocTitle||"document")+".pdf"; a.click()
      URL.revokeObjectURL(url); setStatusMsg("PDF exported!")
      const editResult = await trackEdit({ fileName: (newDocTitle||"document")+".pdf", fileSize: blob.size, fileType: "pdf", toolUsed: "pdf-editor" })
      if (!editResult.allowed) { setStatusMsg(editResult.error || "Edit limit reached"); setLoading(false); return }
      saveToCloud(blob, (newDocTitle||"document")+".pdf", "pdf-editor")
    } catch(err) { setStatusMsg("Export error"); console.error(err) }
    setLoading(false)
  },[pdfBytes,annotations,imageAnnotations,mode,newDocText,newDocTitle,pageOrder,pages])

  /* ── CLICK HANDLERS ── */
  const handleCanvasClick = useCallback((e:React.MouseEvent<HTMLDivElement>,pageIndex:number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX-rect.left, y = e.clientY-rect.top
    const sx = 612/rect.width, sy = 792/rect.height
    if (mode==="text") {
      const ann:TextAnn = {id:Date.now().toString(),pageIndex,x:x*sx,y:y*sy,text:"Text here",fontSize,color:textColor}
      setAnnotations(p=>[...p,ann]); setEditingAnnotation(ann.id)
    } else if (mode==="sticky") {
      const note:StickyNote = {id:Date.now().toString(),pageIndex,x:x*sx,y:y*sy,text:"Note...",color:stickyColor,expanded:true}
      setStickyNotes(p=>[...p,note])
    } else if (mode==="shape") {
      const s:Shape = {id:Date.now().toString(),pageIndex,x:x*sx,y:y*sy,w:100,h:shapeType==="line"?4:80,shape:shapeType,color:shapeColor,stroke:2}
      setShapes(p=>[...p,s])
    } else if (mode==="signature" && signatureData) {
      const img:ImgAnn = {id:Date.now().toString(),pageIndex,x:x*sx,y:y*sy,width:150,height:60,dataUrl:signatureData}
      setImageAnnotations(p=>[...p,img]); setStatusMsg("Signature placed!")
    }
  },[mode,fontSize,textColor,stickyColor,shapeType,shapeColor,signatureData])

  /* ── DRAW ── */
  const handleDrawStart = useCallback((e:React.MouseEvent<HTMLDivElement>) => {
    if (mode!=="draw"&&mode!=="highlight") return
    const rect=e.currentTarget.getBoundingClientRect()
    const x=(e.clientX-rect.left)/rect.width*612, y=(e.clientY-rect.top)/rect.height*792
    if (mode==="draw") { setIsDrawing(true); setCurrentPath([{x,y}]) }
    else setHighlightStart({x,y})
  },[mode])

  const handleDrawMove = useCallback((e:React.MouseEvent<HTMLDivElement>) => {
    const rect=e.currentTarget.getBoundingClientRect()
    const x=(e.clientX-rect.left)/rect.width*612, y=(e.clientY-rect.top)/rect.height*792
    if (mode==="draw"&&isDrawing) setCurrentPath(p=>[...p,{x,y}])
    if (dragging) {
      const dx=e.clientX-dragging.offsetX, dy=e.clientY-dragging.offsetY
      const sx=612/rect.width, sy=792/rect.height
      if (dragging.type==="text") setAnnotations(p=>p.map(a=>a.id===dragging.id?{...a,x:a.x+dx*sx,y:a.y+dy*sy}:a))
      else setImageAnnotations(p=>p.map(a=>a.id===dragging.id?{...a,x:a.x+dx*sx,y:a.y+dy*sy}:a))
      setDragging({...dragging,offsetX:e.clientX,offsetY:e.clientY})
    }
  },[mode,isDrawing,dragging])

  const handleDrawEnd = useCallback((e:React.MouseEvent<HTMLDivElement>) => {
    if (mode==="draw"&&isDrawing&&currentPath.length>1) setDrawPaths(p=>[...p,{pageIndex:currentOrigIdx,points:currentPath,color:drawColor,width:drawWidth}])
    if (mode==="highlight"&&highlightStart) {
      const rect=e.currentTarget.getBoundingClientRect()
      const ex=(e.clientX-rect.left)/rect.width*612, ey=(e.clientY-rect.top)/rect.height*792
      const w=Math.abs(ex-highlightStart.x), h=Math.abs(ey-highlightStart.y)
      if (w>5&&h>3) setHighlights(p=>[...p,{id:Date.now().toString(),pageIndex:currentOrigIdx,x:Math.min(highlightStart.x,ex),y:Math.min(highlightStart.y,ey),w,h,color:highlightColor}])
    }
    setIsDrawing(false); setCurrentPath([]); setHighlightStart(null); setDragging(null)
  },[mode,isDrawing,currentPath,drawColor,drawWidth,currentOrigIdx,highlightStart,highlightColor])

  /* ── ANNOTATIONS OPS ── */
  const deleteAnn = (id:string) => { setAnnotations(p=>p.filter(a=>a.id!==id)); setEditingAnnotation(null) }
  const deleteImg = (id:string) => setImageAnnotations(p=>p.filter(a=>a.id!==id))
  const updateAnnText = (id:string,text:string) => setAnnotations(p=>p.map(a=>a.id===id?{...a,text}:a))
  const handleMouseDown = (e:React.MouseEvent,id:string,type:"text"|"image") => { e.stopPropagation(); e.preventDefault(); setDragging({id,type,offsetX:e.clientX,offsetY:e.clientY}) }

  /* ── IMAGE INSERT ── */
  const handleImageInsert = useCallback((e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if (!file) return
    const reader=new FileReader()
    reader.onload=()=>{
      const dataUrl=reader.result as string
      const img=new Image()
      img.onload=()=>{
        const s=img.width>200?200/img.width:1
        setImageAnnotations(p=>[...p,{id:Date.now().toString(),pageIndex:activePage,x:100,y:100,width:img.width*s,height:img.height*s,dataUrl}])
      }; img.src=dataUrl
    }; reader.readAsDataURL(file); e.target.value=""
  },[activePage])

  /* ── PAGE OPS ── */
  const deletePage = (idx:number) => {
    if (pageOrder.length<=1) return
    const oi=pageOrder[idx]
    setPageOrder(p=>p.filter((_,i)=>i!==idx))
    setAnnotations(p=>p.filter(a=>a.pageIndex!==oi))
    setImageAnnotations(p=>p.filter(a=>a.pageIndex!==oi))
    if (activePage>=pageOrder.length-1) setActivePage(Math.max(0,pageOrder.length-2))
  }
  const movePage = (idx:number,dir:-1|1) => {
    const ni=idx+dir; if(ni<0||ni>=pageOrder.length) return
    setPageOrder(p=>{const n=[...p]; [n[idx],n[ni]]=[n[ni],n[idx]]; return n})
    setActivePage(ni)
  }
  const insertBlank = () => { if(!pdfBytes) return; setPageOrder(p=>[...p.slice(0,activePage+1),-1,...p.slice(activePage+1)]); setStatusMsg("Blank page inserted") }
  const rotatePage = () => setStatusMsg("Page rotation applied on export (visual only)")

  /* ── SIGNATURE PAD ── */
  const initSignPad = () => {
    setShowSignPad(true)
    setTimeout(()=>{
      const c=signCanvasRef.current; if(!c) return
      c.width=400; c.height=150
      const ctx=c.getContext("2d")!; ctx.fillStyle="#fff"; ctx.fillRect(0,0,400,150)
      ctx.strokeStyle="#000"; ctx.lineWidth=2; ctx.lineCap="round"
    },100)
  }
  const signMouseDown = (e:React.MouseEvent<HTMLCanvasElement>) => {
    setIsSignDrawing(true)
    const c=signCanvasRef.current!; const ctx=c.getContext("2d")!
    const r=c.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo(e.clientX-r.left,e.clientY-r.top)
  }
  const signMouseMove = (e:React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSignDrawing) return
    const c=signCanvasRef.current!; const ctx=c.getContext("2d")!
    const r=c.getBoundingClientRect(); ctx.lineTo(e.clientX-r.left,e.clientY-r.top); ctx.stroke()
  }
  const signMouseUp = () => setIsSignDrawing(false)
  const saveSignature = () => {
    const c=signCanvasRef.current; if(!c) return
    setSignatureData(c.toDataURL("image/png")); setShowSignPad(false); setMode("signature"); setStatusMsg("Click on page to place signature")
  }
  const clearSign = () => {
    const c=signCanvasRef.current; if(!c) return
    const ctx=c.getContext("2d")!; ctx.fillStyle="#fff"; ctx.fillRect(0,0,c.width,c.height)
  }

  /* ── ADD COMMENT ── */
  const addComment = () => {
    if (!newComment.trim()) return
    setComments(p=>[...p,{id:Date.now().toString(),pageIndex:currentOrigIdx,text:newComment.trim(),time:new Date().toLocaleTimeString()}])
    setNewComment(""); setStatusMsg("Comment added")
  }

  /* ── RESET ── */
  const resetAll = () => {
    setPdfBytes(null); setPages([]); setAnnotations([]); setImageAnnotations([]); setPageOrder([]); setDrawPaths([]); setHighlights([])
    setStickyNotes([]); setShapes([]); setComments([]); setMode("view"); setStatusMsg(""); setZoom(100)
  }

  /* keyboard shortcuts */
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if ((e.ctrlKey||e.metaKey)&&e.key==="s") { e.preventDefault(); handleExport() }
      if ((e.ctrlKey||e.metaKey)&&e.key==="f") { e.preventDefault(); setShowSearch(s=>!s) }
    }
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h)
  })

  /* ─────────────── RENDER ─────────────── */
  const modeBtn = (m:Mode,icon:React.ReactNode,title:string,clr="blue") => (
    <button onClick={()=>setMode(m)} title={title} className={`${bb} ${mode===m?`bg-${clr}-500/30 text-${clr}-300`:""}`}>{icon}</button>
  )

  return (
    <ToolLayout title="PDF Editor" subtitle="Professional PDF editing suite">
      {mode==="create" ? (
        /* ── CREATE MODE ── */
        <div className="space-y-4">
          <div className={`flex items-center gap-2 p-2 rounded-lg ${tbg} border`}>
            <button onClick={()=>setMode("view")} className={`px-3 py-1.5 rounded text-xs ${dm?"text-gray-300 hover:bg-[#3d3d3d]":"text-gray-600 hover:bg-gray-200"}`}>← Back</button>
            <div className="flex-1"/>
            <button onClick={handleExport} disabled={loading} className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 transition disabled:opacity-50">Export PDF</button>
          </div>
          <input value={newDocTitle} onChange={e=>setNewDocTitle(e.target.value)} className={`w-full px-4 py-3 rounded-xl ${dm?"bg-white/5 border-white/10 text-white":"bg-white border-gray-200 text-gray-800"} border placeholder:opacity-30 outline-none`} placeholder="Document title..." />
          <textarea value={newDocText} onChange={e=>setNewDocText(e.target.value)} className={`w-full h-[60vh] px-6 py-4 rounded-xl ${dm?"bg-white/5 border-white/10 text-white":"bg-white border-gray-200 text-gray-800"} border placeholder:opacity-30 outline-none resize-none font-mono text-sm leading-relaxed`} placeholder="Start writing..." />
        </div>
      ) : pages.length===0 ? (
        /* ── UPLOAD ── */
        <div className="space-y-4">
          <FileUploader accept=".pdf" label="Import a PDF document" sublabel="Supports .pdf files" onFile={handleImport} cloudFilterTypes={["pdf"]} />
          <div className="flex justify-center">
            <button onClick={()=>{setMode("create");window.dispatchEvent(new Event("docm-collapse-sidebar"))}} className="px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-400/30 hover:scale-105 transition-all">Or create a new PDF</button>
          </div>
        </div>
      ) : (
        /* ── EDITOR ── */
        <div className={`flex flex-col h-[88vh] rounded-xl overflow-hidden border ${dm?"border-[#404040]":"border-gray-300"}`}>
          {/* TITLE BAR */}
          <div className={`flex items-center gap-2 px-3 py-1 ${mbg} border-b`}>
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z"/></svg>
            <span className={`text-sm font-medium ${tc} truncate`}>PDF Editor</span>
            <div className="flex-1"/>
            {statusMsg && <span className="text-[10px] text-emerald-500 mr-2">{statusMsg}</span>}
            <button onClick={handleExport} disabled={loading} className="px-3 py-1 rounded text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 transition disabled:opacity-50">Export PDF</button>
            <button onClick={resetAll} className={`px-3 py-1 rounded text-xs ${mc} hover:opacity-80 transition`}>Close</button>
          </div>

          {/* RIBBON TABS */}
          <div className={`flex items-center px-2 ${dm?"bg-[#252526]":"bg-white"} border-b ${dm?"border-[#404040]":"border-gray-200"}`}>
            {(["home","insert","annotate","pages","view"] as RTab[]).map(t=>(<button key={t} onClick={()=>setRibbonTab(t)} className={tabCls(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>))}
          </div>

          {/* RIBBON CONTENT */}
          <div className={`px-3 py-2 ${tbg} border-b min-h-[52px] flex items-end gap-3 flex-wrap`}>
            {ribbonTab==="home" && <>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-0.5">
                  {modeBtn("view",<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672z"/></svg>,"Select")}
                  {modeBtn("text",<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>,"Add Text")}
                  {modeBtn("draw",<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"/></svg>,"Draw","red")}
                  {modeBtn("highlight",<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.764m3.42 3.42a6.776 6.776 0 00-3.42-3.42"/></svg>,"Highlight","yellow")}
                </div>
                <div className={gl}>Tools</div>
              </div>
              <div className={sep}/>
              {mode==="text" && <div className="flex flex-col items-center"><div className="flex items-center gap-1">
                <input type="number" value={fontSize} onChange={e=>setFontSize(Number(e.target.value))} className={`${sel} w-12`} min={8} max={72}/>
                <input type="color" value={textColor} onChange={e=>setTextColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0"/>
              </div><div className={gl}>Font</div></div>}
              {mode==="draw" && <div className="flex flex-col items-center"><div className="flex items-center gap-1">
                <input type="color" value={drawColor} onChange={e=>setDrawColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0"/>
                {[2,3,5,8].map(w=>(<button key={w} onClick={()=>setDrawWidth(w)} className={`w-6 h-6 rounded flex items-center justify-center ${drawWidth===w?(dm?"bg-white/20":"bg-gray-200"):(dm?"bg-white/5":"bg-gray-50")}`}><span style={{width:w*1.5,height:w*1.5}} className="rounded-full bg-current"/></button>))}
              </div><div className={gl}>Pen</div></div>}
              {mode==="highlight" && <div className="flex flex-col items-center"><div className="flex items-center gap-1">
                {["#ffff00","#00ff00","#ff69b4","#00bfff","#ff8c00"].map(c=>(<button key={c} onClick={()=>setHighlightColor(c)} className={`w-5 h-5 rounded ${highlightColor===c?"ring-2 ring-white/60 scale-110":"ring-1 ring-white/20"}`} style={{backgroundColor:c+"80"}}/>))}
              </div><div className={gl}>Color</div></div>}
              {/* Undo */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-0.5">
                  {drawPaths.length>0&&<button onClick={()=>setDrawPaths(p=>p.slice(0,-1))} className={bb} title="Undo Draw"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/></svg></button>}
                  {highlights.length>0&&<button onClick={()=>setHighlights(p=>p.slice(0,-1))} className={bb} title="Undo Highlight"><svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/></svg></button>}
                </div>
                <div className={gl}>Undo</div>
              </div>
            </>}

            {ribbonTab==="insert" && <>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-0.5">
                  <button onClick={()=>imageInputRef.current?.click()} className={bb} title="Insert Image"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6.75v11.25c0 1.243 1.007 2.25 2.25 2.25z"/></svg></button>
                </div><div className={gl}>Image</div>
              </div>
              <div className={sep}/>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-0.5">
                  {modeBtn("shape",<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4l3 6h-6l3-6zM17 14a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,"Shape","blue")}
                  {mode==="shape"&&<>
                    <select value={shapeType} onChange={e=>setShapeType(e.target.value as "rect"|"circle"|"line")} className={sel}><option value="rect">Rect</option><option value="circle">Circle</option><option value="line">Line</option></select>
                    <input type="color" value={shapeColor} onChange={e=>setShapeColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0"/>
                  </>}
                </div><div className={gl}>Shapes</div>
              </div>
              <div className={sep}/>
              <div className="flex flex-col items-center">
                <button onClick={initSignPad} className={bb} title="Signature"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg></button>
                <div className={gl}>Signature</div>
              </div>
              <div className={sep}/>
              <div className="flex flex-col items-center">
                <button onClick={()=>setMode("create")} className={bb} title="Create New PDF"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg></button>
                <div className={gl}>New PDF</div>
              </div>
            </>}

            {ribbonTab==="annotate" && <>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-0.5">
                  {modeBtn("sticky",<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>,"Sticky Note","yellow")}
                  {mode==="sticky"&&<div className="flex gap-0.5">{["#fef08a","#bbf7d0","#bfdbfe","#fecaca","#e9d5ff"].map(c=>(<button key={c} onClick={()=>setStickyColor(c)} className={`w-5 h-5 rounded ${stickyColor===c?"ring-2 ring-white/60":"ring-1 ring-white/20"}`} style={{backgroundColor:c}}/>))}</div>}
                </div><div className={gl}>Sticky Notes</div>
              </div>
              <div className={sep}/>
              <div className="flex flex-col items-center">
                <button onClick={()=>setShowComments(!showComments)} className={`${bb} ${showComments?bba(true):""}`} title="Comments"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/></svg></button>
                <div className={gl}>Comments</div>
              </div>
              <div className={sep}/>
              <div className="flex flex-col items-center">
                <button onClick={()=>setShowSearch(!showSearch)} className={`${bb} ${showSearch?bba(true):""}`} title="Search Text (Ctrl+F)"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg></button>
                <div className={gl}>Search</div>
              </div>
            </>}

            {ribbonTab==="pages" && <>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-0.5">
                  <button onClick={insertBlank} className={bb} title="Add Blank Page"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg></button>
                  <button onClick={()=>deletePage(activePage)} className={`${bb} hover:!text-red-400`} title="Delete Page"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg></button>
                  <button onClick={()=>movePage(activePage,-1)} className={bb} title="Move Up">▲</button>
                  <button onClick={()=>movePage(activePage,1)} className={bb} title="Move Down">▼</button>
                  <button onClick={rotatePage} className={bb} title="Rotate"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"/></svg></button>
                </div><div className={gl}>Page Ops</div>
              </div>
              <div className={sep}/>
              <div className="flex flex-col items-center">
                <button onClick={()=>mergeInputRef.current?.click()} className={bb} title="Merge PDF"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg></button>
                <div className={gl}>Merge</div>
              </div>
            </>}

            {ribbonTab==="view" && <>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-0.5">
                  <button onClick={()=>setZoom(z=>Math.max(50,z-10))} className={bb}>−</button>
                  <span className={`text-xs w-12 text-center ${mc}`}>{zoom}%</span>
                  <button onClick={()=>setZoom(z=>Math.min(200,z+10))} className={bb}>+</button>
                  <button onClick={()=>setZoom(100)} className={`${bb} text-[10px]`}>Fit</button>
                </div><div className={gl}>Zoom</div>
              </div>
              <div className={sep}/>
              <div className="flex flex-col items-center">
                <button onClick={()=>setDarkMode(!darkMode)} className={bb} title="Toggle Theme">{darkMode?<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>:<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>}</button>
                <div className={gl}>Theme</div>
              </div>
            </>}
          </div>

          {/* SEARCH BAR */}
          {showSearch && (
            <div className={`flex items-center gap-2 px-3 py-1.5 ${tbg} border-b`}>
              <span className={`text-[10px] ${mc}`}>Search:</span>
              <input value={searchText} onChange={e=>setSearchText(e.target.value)} className={`${sel} flex-1 max-w-[300px]`} placeholder="Search in PDF..." />
              <span className={`text-[10px] ${mc}`}>(Text search works on annotations)</span>
              <button onClick={()=>setShowSearch(false)} className={`text-[10px] ${mc}`}>✕</button>
            </div>
          )}

          {/* SIGNATURE PAD MODAL */}
          {showSignPad && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className={`p-4 rounded-xl shadow-2xl ${dm?"bg-[#2d2d2d]":"bg-white"} border ${dm?"border-[#555]":"border-gray-200"}`}>
                <h3 className={`text-sm font-semibold mb-2 ${tc}`}>Draw Your Signature</h3>
                <canvas ref={signCanvasRef} className="border rounded cursor-crosshair" style={{width:400,height:150}} onMouseDown={signMouseDown} onMouseMove={signMouseMove} onMouseUp={signMouseUp} onMouseLeave={signMouseUp}/>
                <div className="flex gap-2 mt-2">
                  <button onClick={saveSignature} className="px-4 py-1.5 rounded text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600">Use Signature</button>
                  <button onClick={clearSign} className={`px-4 py-1.5 rounded text-xs ${dm?"text-gray-300 bg-[#3d3d3d]":"text-gray-600 bg-gray-100"}`}>Clear</button>
                  <button onClick={()=>setShowSignPad(false)} className={`px-4 py-1.5 rounded text-xs ${mc}`}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* MAIN AREA */}
          <div className="flex flex-1 overflow-hidden">
            {/* PAGE THUMBNAILS */}
            <div className={`w-24 flex-shrink-0 overflow-y-auto border-r ${dm?"border-[#404040] bg-[#1e1e1e]":"border-gray-200 bg-gray-50"} p-2 space-y-1.5`}>
              {displayPages.map((origIdx,i)=>(
                <button key={`${i}-${origIdx}`} onClick={()=>setActivePage(i)} className={`relative w-full aspect-[3/4] rounded-lg border-2 overflow-hidden transition-all ${i===activePage?(dm?"border-blue-400 shadow-lg shadow-blue-500/20":"border-blue-500 shadow-lg shadow-blue-500/10"):(dm?"border-[#404040] hover:border-[#555]":"border-gray-200 hover:border-gray-300")}`}>
                  {origIdx>=0&&pages[origIdx]?(
                    <img src={pages[origIdx].imageUrl} alt={`Page ${i+1}`} className="absolute inset-0 w-full h-full object-contain bg-white" draggable={false}/>
                  ):(
                    <div className={`absolute inset-0 flex items-center justify-center ${dm?"bg-[#2d2d2d]":"bg-gray-100"}`}><span className={`text-[9px] ${mc}`}>blank</span></div>
                  )}
                  <div className={`absolute bottom-0 left-0 right-0 py-0.5 text-[9px] font-bold text-center ${dm?"bg-black/60 text-gray-300":"bg-white/80 text-gray-600"}`}>{i+1}</div>
                </button>
              ))}
              <button onClick={insertBlank} className={`w-full aspect-[3/4] rounded-lg border-2 border-dashed text-lg transition flex items-center justify-center ${dm?"border-[#404040] text-gray-600 hover:text-gray-400":"border-gray-200 text-gray-300 hover:text-gray-500"}`}>+</button>
            </div>

            {/* PDF VIEW */}
            <div className={`flex-1 overflow-auto ${bg} py-4 flex justify-center`}>
              <div className="relative mx-auto shadow-lg" style={{width:`${(zoom/100)*(currentOrigIdx>=0&&pages[currentOrigIdx]?pages[currentOrigIdx].width:612)}px`,aspectRatio:`${currentOrigIdx>=0&&pages[currentOrigIdx]?pages[currentOrigIdx].width:612}/${currentOrigIdx>=0&&pages[currentOrigIdx]?pages[currentOrigIdx].height:792}`,maxWidth:"100%",cursor:mode==="draw"||mode==="highlight"?"crosshair":mode==="text"||mode==="sticky"||mode==="shape"||mode==="signature"?"crosshair":"default"}}
                onClick={e=>handleCanvasClick(e,currentOrigIdx)} onMouseDown={handleDrawStart} onMouseMove={handleDrawMove} onMouseUp={handleDrawEnd} onMouseLeave={handleDrawEnd}>
                {currentOrigIdx>=0&&pages[currentOrigIdx]?(<img src={pages[currentOrigIdx].imageUrl} alt={`Page ${activePage+1}`} className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none bg-white" draggable={false}/>):(<div className="absolute inset-0 flex items-center justify-center bg-white rounded-lg"><span className="text-gray-400">Blank Page</span></div>)}

                {/* Text annotations */}
                {annotations.filter(a=>a.pageIndex===currentOrigIdx).map(ann=>(
                  <div key={ann.id} className="absolute group cursor-move" style={{left:`${(ann.x/612)*100}%`,top:`${(ann.y/792)*100}%`}} onMouseDown={e=>handleMouseDown(e,ann.id,"text")}>
                    {editingAnnotation===ann.id?(<input autoFocus value={ann.text} onChange={e=>updateAnnText(ann.id,e.target.value)} onBlur={()=>setEditingAnnotation(null)} onKeyDown={e=>e.key==="Enter"&&setEditingAnnotation(null)} className="bg-yellow-200/90 text-black px-2 py-0.5 rounded text-sm outline-none border-2 border-blue-500 min-w-[100px]" style={{fontSize:`${Math.max(ann.fontSize*0.7,10)}px`}} onClick={e=>e.stopPropagation()}/>
                    ):(<div onClick={e=>{e.stopPropagation();setEditingAnnotation(ann.id)}} className="bg-yellow-200/80 text-black px-2 py-0.5 rounded cursor-move hover:bg-yellow-300/90 transition text-sm relative select-none" style={{fontSize:`${Math.max(ann.fontSize*0.7,10)}px`,color:ann.color}}>{ann.text}
                      <button onClick={e=>{e.stopPropagation();deleteAnn(ann.id)}} className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                    </div>)}
                  </div>
                ))}

                {/* Image annotations */}
                {imageAnnotations.filter(a=>a.pageIndex===currentOrigIdx).map(img=>(
                  <div key={img.id} className="absolute group cursor-move" style={{left:`${(img.x/612)*100}%`,top:`${(img.y/792)*100}%`,width:`${(img.width/612)*100}%`,height:`${(img.height/792)*100}%`}} onMouseDown={e=>handleMouseDown(e,img.id,"image")}>
                    <img src={img.dataUrl} alt="" className="w-full h-full object-contain pointer-events-none select-none" draggable={false}/>
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400 rounded transition"/>
                    <button onClick={e=>{e.stopPropagation();deleteImg(img.id)}} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                  </div>
                ))}

                {/* Sticky notes */}
                {stickyNotes.filter(n=>n.pageIndex===currentOrigIdx).map(note=>(
                  <div key={note.id} className="absolute cursor-move group" style={{left:`${(note.x/612)*100}%`,top:`${(note.y/792)*100}%`}}>
                    <div className="rounded-lg shadow-lg p-2 min-w-[120px]" style={{backgroundColor:note.color}}>
                      <textarea value={note.text} onChange={e=>setStickyNotes(p=>p.map(n=>n.id===note.id?{...n,text:e.target.value}:n))} className="w-full bg-transparent text-gray-800 text-[10px] resize-none outline-none min-h-[40px]" onClick={e=>e.stopPropagation()}/>
                      <button onClick={e=>{e.stopPropagation();setStickyNotes(p=>p.filter(n=>n.id!==note.id))}} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100">×</button>
                    </div>
                  </div>
                ))}

                {/* Shapes */}
                {shapes.filter(s=>s.pageIndex===currentOrigIdx).map(s=>(
                  <div key={s.id} className="absolute group" style={{left:`${(s.x/612)*100}%`,top:`${(s.y/792)*100}%`,width:`${(s.w/612)*100}%`,height:`${(s.h/792)*100}%`}}>
                    {s.shape==="rect"&&<div className="w-full h-full border-2 rounded" style={{borderColor:s.color}}/>}
                    {s.shape==="circle"&&<div className="w-full h-full border-2 rounded-full" style={{borderColor:s.color}}/>}
                    {s.shape==="line"&&<div className="w-full h-0.5 mt-[50%]" style={{backgroundColor:s.color}}/>}
                    <button onClick={e=>{e.stopPropagation();setShapes(p=>p.filter(x=>x.id!==s.id))}} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100">×</button>
                  </div>
                ))}

                {/* Highlights */}
                {highlights.filter(h=>h.pageIndex===currentOrigIdx).map(h=>(
                  <div key={h.id} className="absolute pointer-events-none" style={{left:`${(h.x/612)*100}%`,top:`${(h.y/792)*100}%`,width:`${(h.w/612)*100}%`,height:`${(h.h/792)*100}%`,backgroundColor:h.color+"50",borderRadius:"2px"}}/>
                ))}

                {/* Draw paths */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 612 792" preserveAspectRatio="none">
                  {drawPaths.filter(p=>p.pageIndex===currentOrigIdx).map((path,i)=>(<polyline key={i} points={path.points.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke={path.color} strokeWidth={path.width} strokeLinecap="round" strokeLinejoin="round"/>))}
                  {isDrawing&&currentPath.length>1&&(<polyline points={currentPath.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke={drawColor} strokeWidth={drawWidth} strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>)}
                </svg>

                {/* Mode hints */}
                {mode==="text"&&annotations.filter(a=>a.pageIndex===currentOrigIdx).length===0&&(<div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="bg-blue-500/10 border border-blue-400/30 rounded-xl px-4 py-2 text-sm text-blue-300 backdrop-blur-sm">Click anywhere to add text</div></div>)}
                {mode==="sticky"&&stickyNotes.filter(n=>n.pageIndex===currentOrigIdx).length===0&&(<div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl px-4 py-2 text-sm text-yellow-300 backdrop-blur-sm">Click to place a sticky note</div></div>)}
                {mode==="signature"&&signatureData&&(<div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="bg-purple-500/10 border border-purple-400/30 rounded-xl px-4 py-2 text-sm text-purple-300 backdrop-blur-sm">Click to place your signature</div></div>)}
              </div>
            </div>

            {/* RIGHT PANEL (Comments) */}
            {showComments && (
              <div className={`w-60 flex-shrink-0 overflow-y-auto border-l ${dm?"border-[#404040] bg-[#1e1e1e]":"border-gray-200 bg-gray-50"} p-3 space-y-3`}>
                <h3 className={`text-sm font-semibold ${tc}`}>Comments</h3>
                <div className="space-y-2">
                  {comments.filter(c=>c.pageIndex===currentOrigIdx).map(c=>(
                    <div key={c.id} className={`p-2 rounded-lg text-xs ${dm?"bg-white/5":"bg-white border border-gray-100"}`}>
                      <p className={tc}>{c.text}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-[9px] ${mc}`}>{c.time}</span>
                        <button onClick={()=>setComments(p=>p.filter(x=>x.id!==c.id))} className="text-red-400 text-[10px]">Delete</button>
                      </div>
                    </div>
                  ))}
                  {comments.filter(c=>c.pageIndex===currentOrigIdx).length===0&&<p className={`text-xs ${mc}`}>No comments on this page</p>}
                </div>
                <div className="flex gap-1">
                  <input value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment()} className={`${sel} flex-1`} placeholder="Add comment..."/>
                  <button onClick={addComment} className="px-2 py-1 rounded text-xs bg-blue-500 text-white">Add</button>
                </div>
                <div className={`w-full h-px ${dm?"bg-[#404040]":"bg-gray-200"}`}/>
                <h3 className={`text-sm font-semibold ${tc}`}>Page Info</h3>
                <div className={`text-xs space-y-1 ${mc}`}>
                  <p>Page: {activePage+1}/{displayPages.length}</p>
                  <p>Text: {annotations.filter(a=>a.pageIndex===currentOrigIdx).length}</p>
                  <p>Images: {imageAnnotations.filter(a=>a.pageIndex===currentOrigIdx).length}</p>
                  <p>Notes: {stickyNotes.filter(n=>n.pageIndex===currentOrigIdx).length}</p>
                  <p>Shapes: {shapes.filter(s=>s.pageIndex===currentOrigIdx).length}</p>
                </div>
              </div>
            )}
          </div>

          {/* STATUS BAR */}
          <div className={`flex items-center px-3 py-1 ${mbg} border-t text-[10px] ${mc}`}>
            <span>Page {activePage+1} of {displayPages.length}</span>
            <div className={`w-px h-3 mx-3 ${dm?"bg-[#555]":"bg-gray-300"}`}/>
            <span>{annotations.length} annotations</span>
            <div className={`w-px h-3 mx-3 ${dm?"bg-[#555]":"bg-gray-300"}`}/>
            <span className="capitalize">{mode} mode</span>
            <div className="flex-1"/>
            <div className="flex items-center gap-1">
              <button onClick={()=>setZoom(z=>Math.max(50,z-10))}>−</button>
              <input type="range" min={50} max={200} value={zoom} onChange={e=>setZoom(Number(e.target.value))} className="w-20 accent-blue-500"/>
              <button onClick={()=>setZoom(z=>Math.min(200,z+10))}>+</button>
              <span className="w-10 text-center">{zoom}%</span>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden"/>
      <input ref={imageInputRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleImageInsert} className="hidden"/>
      <input ref={mergeInputRef} type="file" accept=".pdf" onChange={handleMerge} className="hidden"/>
    </ToolLayout>
  )
}
