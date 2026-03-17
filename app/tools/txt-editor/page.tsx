"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

const MonacoEditorWrapper = dynamic(() => import("@/modules/txt-editor/MonacoEditorWrapper"), { ssr: false, loading: () => <div className="flex items-center justify-center h-[60vh] text-white/30">Loading editor...</div> })

export default function TxtEditorPage() {
  usePing()
  const [content, setContent] = useState("")
  const [fileName, setFileName] = useState("")
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState("")

  const handleImport = useCallback(async (file: File) => {
    setFileName(file.name)
    const text = await file.text()
    setContent(text)
    setLoaded(true)
    setStatus(`Loaded: ${file.name}`)
    window.dispatchEvent(new Event("docm-collapse-sidebar"))
  }, [])

  const handleNewDoc = () => {
    setContent("")
    setFileName("new-document.txt")
    setLoaded(true)
    setStatus("New document created")
    window.dispatchEvent(new Event("docm-collapse-sidebar"))
  }

  const handleExport = useCallback(async (text: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName || "document.txt"
    a.click()
    URL.revokeObjectURL(url)
    setStatus("Exported!")
    const editResult = await trackEdit({ fileName: fileName || "document.txt", fileSize: blob.size, fileType: "txt", toolUsed: "txt-editor" })
    if (!editResult.allowed) { alert(editResult.error || "Edit limit reached"); return }
    saveToCloud(blob, fileName || "document.txt", "txt-editor")
  }, [fileName])

  return (
    <ToolLayout title="TXT / Code Editor" subtitle="Edit text and code files with Monaco Editor (syntax highlighting, search, dark mode)">
      {!loaded ? (
        <div className="space-y-4">
          <FileUploader
            accept=".txt,.text,.log,.md,.json,.xml,.csv,.html,.css,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.php,.rb,.go,.rs,.sh,.sql,.yaml,.yml"
            label="Import a text or code file"
            sublabel="Supports .txt, .js, .ts, .py, .json, .html, .css, .md and many more"
            cloudFilterTypes={["txt", "md", "json", "csv", "html", "css", "js", "ts", "py", "xml", "yaml", "yml", "sql"]}
            onFile={handleImport}
          />
          <div className="flex justify-center">
            <button onClick={handleNewDoc} className="px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-400/30 hover:scale-105 transition-all">
              Or create a new file
            </button>
          </div>
        </div>
      ) : (
        <MonacoEditorWrapper
          initialContent={content}
          fileName={fileName}
          status={status}
          onExport={handleExport}
          onClose={() => { setLoaded(false); setContent(""); setStatus("") }}
        />
      )}
    </ToolLayout>
  )
}
