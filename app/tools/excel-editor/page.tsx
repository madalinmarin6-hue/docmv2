"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

const HandsontableEditor = dynamic(() => import("@/modules/excel-editor/HandsontableEditor"), { ssr: false, loading: () => <div className="flex items-center justify-center h-[60vh] text-white/30">Loading spreadsheet...</div> })

type CellData = (string | number | null)[][]
const COLS = 26, ROWS = 50

function ensureMinSize(sheet: CellData, minRows = ROWS, minCols = COLS): CellData {
  const result = sheet.map(r => [...r])
  while (result.length < minRows) result.push(Array(minCols).fill(""))
  result.forEach(row => { while (row.length < minCols) row.push("") })
  return result
}

export default function ExcelEditorPage() {
  usePing()
  const [loaded, setLoaded] = useState(false)
  const [fileName, setFileName] = useState("")
  const [status, setStatus] = useState("")
  const [initialData, setInitialData] = useState<CellData>([])
  const [initialSheetNames, setInitialSheetNames] = useState<string[]>([])
  const [initialAllSheets, setInitialAllSheets] = useState<CellData[]>([])

  const handleImport = useCallback(async (file: File) => {
    setStatus("Loading..."); setFileName(file.name)
    try {
      const XLSX = await import("xlsx")
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer)
      const names = wb.SheetNames
      const sheets: CellData[] = names.map(name => {
        const ws = wb.Sheets[name]
        const json: (string | number | null)[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" })
        return ensureMinSize(json)
      })
      setInitialSheetNames(names)
      setInitialAllSheets(sheets)
      setInitialData(sheets[0])
      setLoaded(true)
      setStatus(`Loaded: ${file.name}`)
      window.dispatchEvent(new Event("docm-collapse-sidebar"))
    } catch { setStatus("Error loading file") }
  }, [])

  const handleNewDoc = () => {
    const empty = ensureMinSize([], ROWS, COLS)
    setInitialData(empty)
    setInitialAllSheets([empty])
    setInitialSheetNames(["Sheet1"])
    setFileName("new-spreadsheet.xlsx")
    setLoaded(true)
    setStatus("New spreadsheet")
    window.dispatchEvent(new Event("docm-collapse-sidebar"))
  }

  const handleExport = useCallback(async (allSheets: CellData[], sheetNames: string[], _activeSheet: number) => {
    try {
      const XLSX = await import("xlsx")
      const wb = XLSX.utils.book_new()
      allSheets.forEach((sheet, i) => {
        const ws = XLSX.utils.aoa_to_sheet(sheet as string[][])
        XLSX.utils.book_append_sheet(wb, ws, sheetNames[i] || `Sheet${i + 1}`)
      })
      const outName = (fileName.replace(/\.[^.]+$/, "") || "spreadsheet") + ".xlsx"
      const xlsxBuf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([xlsxBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = outName; a.click(); URL.revokeObjectURL(url)
      setStatus("Exported!")
      const editResult = await trackEdit({ fileName: outName, fileSize: blob.size, fileType: "xlsx", toolUsed: "excel-editor" })
      if (!editResult.allowed) { setStatus(editResult.error || "Edit limit reached"); return }
      saveToCloud(blob, outName, "excel-editor")
    } catch { setStatus("Export error") }
  }, [fileName])

  return (
    <ToolLayout title="Excel Editor" subtitle="Professional spreadsheet editor with formulas, sorting, filtering (.xlsx)">
      {!loaded ? (
        <div className="space-y-4">
          <FileUploader accept=".xlsx,.xls,.csv" label="Import a spreadsheet" sublabel="Supports .xlsx, .xls, .csv files" onFile={handleImport} cloudFilterTypes={["xlsx", "xls", "csv"]} />
          <div className="flex justify-center">
            <button onClick={handleNewDoc} className="px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 hover:scale-105 transition-all">
              Or create a new spreadsheet
            </button>
          </div>
        </div>
      ) : (
        <HandsontableEditor
          initialData={initialData}
          initialSheetNames={initialSheetNames}
          initialAllSheets={initialAllSheets}
          fileName={fileName}
          status={status}
          onExport={handleExport}
          onClose={() => { setLoaded(false); setStatus("") }}
        />
      )}
    </ToolLayout>
  )
}
