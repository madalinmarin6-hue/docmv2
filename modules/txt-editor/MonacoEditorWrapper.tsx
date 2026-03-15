"use client"

import { useState, useRef, useCallback } from "react"
import Editor, { OnMount } from "@monaco-editor/react"

const LANGUAGES = [
  { value: "plaintext", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" },
  { value: "python", label: "Python" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
  { value: "sql", label: "SQL" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "shell", label: "Shell" },
]

interface Props {
  initialContent: string
  fileName: string
  status: string
  onExport: (content: string) => void
  onClose: () => void
}

function detectLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || ""
  const map: Record<string, string> = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    html: "html", htm: "html", css: "css", json: "json", md: "markdown",
    py: "python", xml: "xml", yaml: "yaml", yml: "yaml", sql: "sql",
    java: "java", cs: "csharp", cpp: "cpp", c: "cpp", h: "cpp",
    php: "php", rb: "ruby", go: "go", rs: "rust", sh: "shell", bash: "shell",
    txt: "plaintext", log: "plaintext", csv: "plaintext",
  }
  return map[ext] || "plaintext"
}

export default function MonacoEditorWrapper({ initialContent, fileName, status, onExport, onClose }: Props) {
  const [content, setContent] = useState(initialContent)
  const [language, setLanguage] = useState(detectLanguage(fileName))
  const [darkMode, setDarkMode] = useState(true)
  const [wordWrap, setWordWrap] = useState(true)
  const [minimap, setMinimap] = useState(true)
  const [fontSize, setFontSize] = useState(14)
  const editorRef = useRef<any>(null)

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor
    editor.focus()
  }

  const lines = content.split("\n").length
  const words = content.trim() ? content.trim().split(/\s+/).length : 0
  const chars = content.length

  const dm = darkMode
  const tbg = dm ? "bg-[#2d2d2d] border-[#404040]" : "bg-[#f3f3f3] border-gray-200"
  const mbg = dm ? "bg-[#252526] border-[#404040]" : "bg-white border-gray-200"
  const tc = dm ? "text-gray-200" : "text-gray-700"
  const mc = dm ? "text-gray-400" : "text-gray-500"
  const bb = `h-7 px-2 rounded flex items-center justify-center gap-1 transition text-xs ${dm ? "hover:bg-[#3d3d3d] text-gray-300" : "hover:bg-gray-200 text-gray-600"}`
  const bba = (a: boolean) => a ? (dm ? "bg-[#094771] text-blue-300" : "bg-blue-100 text-blue-700") : ""
  const sel = `h-7 px-1.5 rounded border text-xs ${dm ? "bg-[#3c3c3c] border-[#555] text-gray-200" : "bg-white border-gray-300 text-gray-700"}`

  return (
    <div className={`flex flex-col h-[88vh] rounded-xl overflow-hidden border ${dm ? "border-[#404040]" : "border-gray-300"}`}>
      {/* TOOLBAR */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 ${tbg} border-b flex-wrap`}>
        <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
        <span className={`text-sm font-medium ${tc} truncate max-w-[180px] mr-1`}>{fileName}</span>
        <div className={`w-px h-5 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />

        <select value={language} onChange={e => setLanguage(e.target.value)} className={sel} title="Language">
          {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>

        <select value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className={`${sel} w-16`} title="Font Size">
          {[10, 12, 14, 16, 18, 20, 24].map(s => <option key={s} value={s}>{s}px</option>)}
        </select>

        <div className={`w-px h-5 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />

        <button onClick={() => setWordWrap(!wordWrap)} className={`${bb} ${bba(wordWrap)}`} title="Word Wrap">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h15a3 3 0 010 6H9m0 0l3-3m-3 3l3 3"/></svg>
          Wrap
        </button>
        <button onClick={() => setMinimap(!minimap)} className={`${bb} ${bba(minimap)}`} title="Minimap">Map</button>
        <button onClick={() => setDarkMode(!darkMode)} className={bb} title="Theme">
          {dm ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>
          : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>}
        </button>

        <button onClick={() => {
          if (editorRef.current) editorRef.current.getAction("editor.action.startFindReplaceAction")?.run()
        }} className={bb} title="Find & Replace (Ctrl+H)">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
        </button>

        <div className="flex-1" />
        {status && <span className="text-[10px] text-emerald-400 mr-2">{status}</span>}

        <button onClick={() => onExport(content)} className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 transition">Export</button>
        <button onClick={onClose} className={`px-3 py-1.5 rounded text-xs ${mc} hover:opacity-80`}>Close</button>
      </div>

      {/* EDITOR */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={content}
          theme={darkMode ? "vs-dark" : "light"}
          onChange={(val) => setContent(val || "")}
          onMount={handleMount}
          options={{
            fontSize,
            wordWrap: wordWrap ? "on" : "off",
            minimap: { enabled: minimap },
            lineNumbers: "on",
            renderLineHighlight: "all",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            formatOnPaste: true,
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
          }}
        />
      </div>

      {/* STATUS BAR */}
      <div className={`flex items-center px-3 py-1 ${mbg} border-t text-[10px] ${mc}`}>
        <span>Ln {editorRef.current?.getPosition()?.lineNumber || 1}, Col {editorRef.current?.getPosition()?.column || 1}</span>
        <div className={`w-px h-3 mx-3 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />
        <span>{lines} lines</span>
        <div className={`w-px h-3 mx-3 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />
        <span>{words} words</span>
        <div className={`w-px h-3 mx-3 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />
        <span>{(chars / 1024).toFixed(1)} KB</span>
        <div className="flex-1" />
        <span className="capitalize">{language}</span>
        <div className={`w-px h-3 mx-3 ${dm ? "bg-[#555]" : "bg-gray-300"}`} />
        <span>UTF-8</span>
      </div>
    </div>
  )
}
