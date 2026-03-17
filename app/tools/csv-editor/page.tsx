"use client"

import { useState, useCallback, useMemo } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

type CellData = string[][]

export default function CsvEditorPage() {
  usePing()
  const [data, setData] = useState<CellData>([])
  const [fileName, setFileName] = useState("")
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState("")
  const [delimiter, setDelimiter] = useState(",")
  const [activeCell, setActiveCell] = useState<[number, number] | null>(null)
  const [search, setSearch] = useState("")
  const [replace, setReplace] = useState("")
  const [showFind, setShowFind] = useState(false)
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [headerRow, setHeaderRow] = useState(true)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  const parseCSV = (text: string, delim: string): CellData => {
    const lines = text.split("\n").filter(l => l.trim())
    return lines.map(line => {
      const cells: string[] = []
      let current = ""
      let inQuotes = false
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes }
        else if (char === delim && !inQuotes) { cells.push(current.trim()); current = "" }
        else { current += char }
      }
      cells.push(current.trim())
      return cells
    })
  }

  const handleImport = useCallback(async (file: File) => {
    setFileName(file.name)
    setStatus("Loading...")
    const text = await file.text()
    const d = file.name.endsWith(".tsv") ? "\t" : ","
    setDelimiter(d)
    const parsed = parseCSV(text, d)
    while (parsed.length < 20) parsed.push(Array(parsed[0]?.length || 5).fill(""))
    const maxCols = Math.max(...parsed.map(r => r.length))
    parsed.forEach(row => { while (row.length < maxCols) row.push("") })
    setData(parsed)
    setLoaded(true)
    setStatus(`Loaded: ${file.name} (${parsed.length} rows, ${maxCols} cols)`)
    window.dispatchEvent(new Event("docm-collapse-sidebar"))
  }, [])

  const handleNewDoc = () => {
    setData(Array.from({ length: 25 }, (_, i) => i === 0 ? ["Name", "Value", "Category", "Date", "Notes", "Status"] : Array(6).fill("")))
    setFileName("new-data.csv")
    setLoaded(true)
    setHeaderRow(true)
    setStatus("New CSV created with headers")
    window.dispatchEvent(new Event("docm-collapse-sidebar"))
  }

  const exportFile = useCallback(async (ext: "csv" | "tsv") => {
    const d = ext === "tsv" ? "\t" : delimiter
    const csv = data.map(row => row.map(cell => cell.includes(d) || cell.includes('"') || cell.includes("\n") ? `"${cell.replace(/"/g, '""')}"` : cell).join(d)).join("\n")
    const blob = new Blob([csv], { type: ext === "tsv" ? "text/tab-separated-values" : "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = (fileName.replace(/\.[^.]+$/, "") || "data") + "." + ext
    a.click()
    URL.revokeObjectURL(url)
    setStatus(`Exported as .${ext}!`)
    const editResult = await trackEdit({ fileName: (fileName.replace(/\.[^.]+$/, "") || "data") + "." + ext, fileSize: blob.size, fileType: ext, toolUsed: "csv-editor" })
    if (!editResult.allowed) { alert(editResult.error || "Edit limit reached"); return }
    saveToCloud(blob, (fileName.replace(/\.[^.]+$/, "") || "data") + "." + ext, "csv-editor")
  }, [data, delimiter, fileName])

  const updateCell = (row: number, col: number, value: string) => {
    setData(prev => {
      const copy = prev.map(r => [...r])
      copy[row][col] = value
      return copy
    })
  }

  const addRow = () => setData(prev => [...prev, Array(prev[0]?.length || 5).fill("")])
  const addCol = () => setData(prev => prev.map(row => [...row, ""]))
  const insertRowAt = (index: number) => setData(prev => [...prev.slice(0, index + 1), Array(prev[0]?.length || 5).fill(""), ...prev.slice(index + 1)])
  const deleteRow = (index: number) => { if (data.length > 1) setData(prev => prev.filter((_, i) => i !== index)) }
  const deleteCol = (col: number) => {
    if ((data[0]?.length || 0) <= 1) return
    setData(prev => prev.map(row => row.filter((_, i) => i !== col)))
  }
  const deleteSelectedRows = () => {
    if (selectedRows.size === 0) return
    setData(prev => prev.filter((_, i) => !selectedRows.has(i)))
    setSelectedRows(new Set())
    setStatus(`Deleted ${selectedRows.size} rows`)
  }

  const colLabel = (i: number) => {
    let label = ""
    let n = i
    do { label = String.fromCharCode(65 + (n % 26)) + label; n = Math.floor(n / 26) - 1 } while (n >= 0)
    return label
  }

  const sortByCol = (col: number) => {
    const newDir = sortCol === col && sortDir === "asc" ? "desc" : "asc"
    setSortCol(col); setSortDir(newDir)
    setData(prev => {
      const header = headerRow ? [prev[0]] : []
      const body = headerRow ? prev.slice(1) : [...prev]
      body.sort((a, b) => {
        const av = a[col] || "", bv = b[col] || ""
        const an = parseFloat(av), bn = parseFloat(bv)
        if (!isNaN(an) && !isNaN(bn)) return newDir === "asc" ? an - bn : bn - an
        return newDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
      })
      return [...header, ...body]
    })
    setStatus(`Sorted by column ${colLabel(col)} (${newDir})`)
  }

  const findAndReplace = () => {
    if (!search) return
    let count = 0
    setData(prev => prev.map(row => row.map(cell => {
      if (cell.includes(search)) { count++; return cell.replaceAll(search, replace) }
      return cell
    })))
    setStatus(`Replaced ${count} occurrences`)
  }

  const transpose = () => {
    const rows = data.length, cols = data[0]?.length || 0
    const result: CellData = Array.from({ length: cols }, (_, c) => Array.from({ length: rows }, (_, r) => data[r][c] || ""))
    setData(result)
    setStatus("Transposed rows ↔ columns")
  }

  const removeDuplicates = () => {
    const seen = new Set<string>()
    const result = data.filter(row => {
      const key = row.join("|||")
      if (seen.has(key)) return false
      seen.add(key); return true
    })
    const removed = data.length - result.length
    setData(result)
    setStatus(`Removed ${removed} duplicate rows`)
  }

  const trimAll = () => {
    setData(prev => prev.map(row => row.map(cell => cell.trim())))
    setStatus("Trimmed whitespace from all cells")
  }

  /* Column statistics */
  const colStats = useMemo(() => {
    if (!activeCell) return null
    const col = activeCell[1]
    const values = (headerRow ? data.slice(1) : data).map(r => r[col] || "").filter(v => v.trim())
    const nums = values.map(Number).filter(n => !isNaN(n))
    if (nums.length === 0) return { count: values.length, unique: new Set(values).size }
    const sum = nums.reduce((a, b) => a + b, 0)
    return { count: values.length, unique: new Set(values).size, sum: sum.toFixed(2), avg: (sum / nums.length).toFixed(2), min: Math.min(...nums).toFixed(2), max: Math.max(...nums).toFixed(2) }
  }, [activeCell, data, headerRow])

  /* Highlight search matches */
  const isMatch = (cell: string) => search && cell.toLowerCase().includes(search.toLowerCase())

  const btnCls = "px-2.5 py-1.5 rounded-lg text-xs transition bg-white/5 hover:bg-white/10 text-white/60 border border-white/10"

  return (
    <ToolLayout title="CSV Editor" subtitle="Edit comma-separated value files with sorting, search, and statistics">
      {!loaded ? (
        <div className="space-y-4">
          <FileUploader accept=".csv,.tsv,.txt" label="Import a CSV file" sublabel="Supports .csv, .tsv, .txt files" onFile={handleImport} cloudFilterTypes={["csv", "tsv", "txt"]} />
          <div className="flex justify-center">
            <button onClick={handleNewDoc} className="px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-400/30 hover:scale-105 transition-all">
              Or create a new CSV
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">

          {/* TOOLBAR ROW 1 */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 flex-wrap">
            <select value={delimiter} onChange={e => setDelimiter(e.target.value)} className="h-8 px-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white">
              <option value="," className="bg-gray-900">Comma (,)</option>
              <option value=";" className="bg-gray-900">Semicolon (;)</option>
              <option value={"\t"} className="bg-gray-900">Tab</option>
            </select>
            <div className="w-px h-6 bg-white/10" />
            <button onClick={addRow} className={btnCls}>+ Row</button>
            <button onClick={addCol} className={btnCls}>+ Col</button>
            {activeCell && <button onClick={() => insertRowAt(activeCell[0])} className={btnCls}>Insert Row Below</button>}
            {activeCell && <button onClick={() => deleteCol(activeCell[1])} className={btnCls}>Delete Col {colLabel(activeCell[1])}</button>}
            {selectedRows.size > 0 && <button onClick={deleteSelectedRows} className="px-2.5 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-300 border border-red-400/30 transition hover:bg-red-500/30">Delete {selectedRows.size} Rows</button>}
            <div className="w-px h-6 bg-white/10" />
            <button onClick={transpose} className={btnCls} title="Swap rows and columns">Transpose</button>
            <button onClick={removeDuplicates} className={btnCls}>Remove Duplicates</button>
            <button onClick={trimAll} className={btnCls}>Trim All</button>
            <label className="flex items-center gap-1 text-xs text-white/50 cursor-pointer">
              <input type="checkbox" checked={headerRow} onChange={e => setHeaderRow(e.target.checked)} className="rounded accent-teal-500" />
              Header Row
            </label>
            <div className="w-px h-6 bg-white/10" />
            <button onClick={() => setShowFind(!showFind)} className={`${btnCls} ${showFind ? "bg-teal-500/20 text-teal-300 border-teal-400/30" : ""}`}>Find & Replace</button>
            <div className="flex-1" />
            {status && <span className="text-xs text-emerald-400">{status}</span>}
            <button onClick={() => exportFile("csv")} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-teal-500/20">Export .csv</button>
            <button onClick={() => exportFile("tsv")} className={btnCls}>Export .tsv</button>
            <button onClick={() => { setLoaded(false); setData([]); setStatus(""); setSelectedRows(new Set()) }} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition">Close</button>
          </div>

          {/* FIND & REPLACE */}
          {showFind && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find..." className="h-7 px-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white w-40 outline-none focus:border-teal-400/50" />
              <input value={replace} onChange={e => setReplace(e.target.value)} placeholder="Replace with..." className="h-7 px-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white w-40 outline-none focus:border-teal-400/50" />
              <button onClick={findAndReplace} className={btnCls}>Replace All</button>
              {search && <span className="text-[10px] text-white/30">{data.flat().filter(c => c.toLowerCase().includes(search.toLowerCase())).length} matches</span>}
              <button onClick={() => { setSearch(""); setReplace(""); setShowFind(false) }} className="text-xs text-white/30 hover:text-white/60 transition">&times;</button>
            </div>
          )}

          {/* TABLE */}
          <div className="rounded-xl border border-white/10 overflow-auto max-h-[62vh] bg-[#0a0f2e]">
            <table className="border-collapse w-full">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="w-8 bg-white/5 border border-white/10 px-1 py-1.5 text-[10px] text-white/20">
                    <input type="checkbox" className="accent-teal-500"
                      checked={selectedRows.size === data.length}
                      onChange={e => setSelectedRows(e.target.checked ? new Set(data.map((_, i) => i)) : new Set())} />
                  </th>
                  <th className="w-10 bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white/30">#</th>
                  {data[0]?.map((_, ci) => (
                    <th key={ci} className="bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white/40 font-medium min-w-[100px] cursor-pointer hover:bg-white/10 transition select-none"
                      onClick={() => sortByCol(ci)}>
                      <span className="flex items-center gap-1 justify-center">
                        {colLabel(ci)}
                        {sortCol === ci && <span className="text-teal-400">{sortDir === "asc" ? "↑" : "↓"}</span>}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, ri) => (
                  <tr key={ri} className={`group ${headerRow && ri === 0 ? "bg-white/5 font-semibold" : ""} ${selectedRows.has(ri) ? "bg-teal-500/10" : ""}`}>
                    <td className="bg-white/5 border border-white/10 px-1 py-1 text-center">
                      <input type="checkbox" className="accent-teal-500" checked={selectedRows.has(ri)}
                        onChange={e => { const s = new Set(selectedRows); e.target.checked ? s.add(ri) : s.delete(ri); setSelectedRows(s) }} />
                    </td>
                    <td className="bg-white/5 border border-white/10 px-2 py-1 text-xs text-white/30 text-center">{ri + 1}</td>
                    {row.map((cell, ci) => (
                      <td key={ci} className={`border border-white/10 p-0 ${activeCell?.[0] === ri && activeCell?.[1] === ci ? "ring-2 ring-teal-400 ring-inset" : ""} ${isMatch(cell) ? "bg-yellow-500/15" : "hover:bg-white/5"}`}>
                        <input value={cell} onChange={e => updateCell(ri, ci, e.target.value)}
                          onFocus={() => setActiveCell([ri, ci])}
                          className={`w-full px-2 py-1.5 bg-transparent text-sm text-white outline-none ${headerRow && ri === 0 ? "font-semibold text-white/80" : ""}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FOOTER STATUS + STATS */}
          <div className="flex items-center gap-6 text-xs text-white/40 flex-wrap">
            <span>Rows: <strong className="text-white/60">{data.length}</strong></span>
            <span>Cols: <strong className="text-white/60">{data[0]?.length || 0}</strong></span>
            {activeCell && <span>Cell: <strong className="text-teal-400">{colLabel(activeCell[1])}{activeCell[0] + 1}</strong></span>}
            {colStats && (
              <>
                <span className="text-white/10">|</span>
                <span>Col {colLabel(activeCell![1])}: {colStats.count} values, {colStats.unique} unique</span>
                {colStats.sum !== undefined && (
                  <>
                    <span>Sum: <strong className="text-white/60">{colStats.sum}</strong></span>
                    <span>Avg: <strong className="text-white/60">{colStats.avg}</strong></span>
                    <span>Min: <strong className="text-white/60">{colStats.min}</strong></span>
                    <span>Max: <strong className="text-white/60">{colStats.max}</strong></span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
