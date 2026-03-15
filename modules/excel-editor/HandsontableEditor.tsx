"use client"

import { useState, useCallback, useRef, useEffect } from "react"

type CellData = (string | number | null)[][]

const COLS = 26
const ROWS = 50

function colLabel(i: number): string {
  let s = "", n = i
  while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1 }
  return s
}

interface Props {
  initialData: CellData
  initialSheetNames: string[]
  initialAllSheets: CellData[]
  fileName: string
  status: string
  onExport: (allSheets: CellData[], sheetNames: string[], activeSheet: number) => void
  onClose: () => void
}

export default function HandsontableEditor({ initialData, initialSheetNames, initialAllSheets, fileName, status, onExport, onClose }: Props) {
  const [data, setData] = useState<CellData>(initialData)
  const [sheetNames, setSheetNames] = useState<string[]>(initialSheetNames)
  const [allSheets, setAllSheets] = useState<CellData[]>(initialAllSheets)
  const [activeSheet, setActiveSheet] = useState(0)
  const [activeCell, setActiveCell] = useState<[number, number]>([0, 0])
  const [editingCell, setEditingCell] = useState<[number, number] | null>(null)
  const [formulaBarValue, setFormulaBarValue] = useState("")
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [filterCol, setFilterCol] = useState<number | null>(null)
  const [filterValue, setFilterValue] = useState("")
  const [showFilter, setShowFilter] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; r: number; c: number } | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const numCols = data[0]?.length || COLS

  const updateCell = (row: number, col: number, value: string) => {
    setData(prev => {
      const copy = prev.map(r => [...r])
      if (!copy[row]) copy[row] = Array(col + 1).fill("")
      while (copy[row].length <= col) copy[row].push("")
      copy[row][col] = value
      return copy
    })
  }

  const evaluateFormula = (val: string | number | null): string => {
    if (typeof val !== "string" || !val.startsWith("=")) return String(val ?? "")
    try {
      const expr = val.slice(1)
        .replace(/SUM\(([A-Z])(\d+):([A-Z])(\d+)\)/gi, (_m, c1: string, r1: string, c2: string, r2: string) => {
          let sum = 0
          const cc1 = c1.toUpperCase().charCodeAt(0) - 65, cc2 = c2.toUpperCase().charCodeAt(0) - 65
          const rr1 = parseInt(r1) - 1, rr2 = parseInt(r2) - 1
          for (let r = rr1; r <= rr2; r++) for (let c = cc1; c <= cc2; c++) { const v = parseFloat(String(data[r]?.[c] ?? "0")); if (!isNaN(v)) sum += v }
          return String(sum)
        })
        .replace(/AVG(?:ERAGE)?\(([A-Z])(\d+):([A-Z])(\d+)\)/gi, (_m, c1: string, r1: string, c2: string, r2: string) => {
          let sum = 0, cnt = 0
          const cc1 = c1.toUpperCase().charCodeAt(0) - 65, cc2 = c2.toUpperCase().charCodeAt(0) - 65
          const rr1 = parseInt(r1) - 1, rr2 = parseInt(r2) - 1
          for (let r = rr1; r <= rr2; r++) for (let c = cc1; c <= cc2; c++) { const v = parseFloat(String(data[r]?.[c] ?? "")); if (!isNaN(v)) { sum += v; cnt++ } }
          return cnt ? String(sum / cnt) : "0"
        })
        .replace(/COUNT\(([A-Z])(\d+):([A-Z])(\d+)\)/gi, (_m, c1: string, r1: string, c2: string, r2: string) => {
          let cnt = 0
          const cc1 = c1.toUpperCase().charCodeAt(0) - 65, cc2 = c2.toUpperCase().charCodeAt(0) - 65
          const rr1 = parseInt(r1) - 1, rr2 = parseInt(r2) - 1
          for (let r = rr1; r <= rr2; r++) for (let c = cc1; c <= cc2; c++) { const v = String(data[r]?.[c] ?? ""); if (v.trim()) cnt++ }
          return String(cnt)
        })
        .replace(/MIN\(([A-Z])(\d+):([A-Z])(\d+)\)/gi, (_m, c1: string, r1: string, c2: string, r2: string) => {
          const vals: number[] = []
          const cc1 = c1.toUpperCase().charCodeAt(0) - 65, cc2 = c2.toUpperCase().charCodeAt(0) - 65
          const rr1 = parseInt(r1) - 1, rr2 = parseInt(r2) - 1
          for (let r = rr1; r <= rr2; r++) for (let c = cc1; c <= cc2; c++) { const v = parseFloat(String(data[r]?.[c] ?? "")); if (!isNaN(v)) vals.push(v) }
          return vals.length ? String(Math.min(...vals)) : "0"
        })
        .replace(/MAX\(([A-Z])(\d+):([A-Z])(\d+)\)/gi, (_m, c1: string, r1: string, c2: string, r2: string) => {
          const vals: number[] = []
          const cc1 = c1.toUpperCase().charCodeAt(0) - 65, cc2 = c2.toUpperCase().charCodeAt(0) - 65
          const rr1 = parseInt(r1) - 1, rr2 = parseInt(r2) - 1
          for (let r = rr1; r <= rr2; r++) for (let c = cc1; c <= cc2; c++) { const v = parseFloat(String(data[r]?.[c] ?? "")); if (!isNaN(v)) vals.push(v) }
          return vals.length ? String(Math.max(...vals)) : "0"
        })
        .replace(/([A-Z])(\d+)/gi, (_m, col: string, row: string) => {
          const ci = col.toUpperCase().charCodeAt(0) - 65, ri = parseInt(row) - 1
          return String(data[ri]?.[ci] ?? 0)
        })
      const result = new Function(`return ${expr}`)()
      return String(result)
    } catch { return "ERR" }
  }

  const selectCell = (r: number, c: number) => {
    setActiveCell([r, c])
    setFormulaBarValue(String(data[r]?.[c] ?? ""))
    setContextMenu(null)
  }

  const commitEdit = () => {
    if (editingCell) { updateCell(editingCell[0], editingCell[1], formulaBarValue); setEditingCell(null) }
  }

  const handleCellKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
    if (e.key === "Enter") { e.preventDefault(); commitEdit(); if (r + 1 < data.length) selectCell(r + 1, c) }
    else if (e.key === "Tab") { e.preventDefault(); commitEdit(); if (c + 1 < numCols) selectCell(r, c + 1) }
    else if (e.key === "Escape") { setEditingCell(null); setFormulaBarValue(String(data[r]?.[c] ?? "")) }
  }

  const handleGridKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) return
    const [r, c] = activeCell
    if (e.key === "ArrowDown") { e.preventDefault(); if (r + 1 < data.length) selectCell(r + 1, c) }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (r > 0) selectCell(r - 1, c) }
    else if (e.key === "ArrowRight") { e.preventDefault(); if (c + 1 < numCols) selectCell(r, c + 1) }
    else if (e.key === "ArrowLeft") { e.preventDefault(); if (c > 0) selectCell(r, c - 1) }
    else if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); setEditingCell([r, c]); setFormulaBarValue(String(data[r]?.[c] ?? "")) }
    else if (e.key === "Delete" || e.key === "Backspace") { updateCell(r, c, ""); setFormulaBarValue("") }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { setEditingCell([r, c]); setFormulaBarValue(e.key) }
  }

  const handleSort = (col: number) => {
    const asc = sortCol === col ? !sortAsc : true
    setSortCol(col); setSortAsc(asc)
    setData(prev => {
      const copy = prev.map(r => [...r])
      copy.sort((a, b) => {
        const va = String(a[col] ?? ""), vb = String(b[col] ?? "")
        const na = parseFloat(va), nb = parseFloat(vb)
        if (!isNaN(na) && !isNaN(nb)) return asc ? na - nb : nb - na
        return asc ? va.localeCompare(vb) : vb.localeCompare(va)
      })
      return copy
    })
  }

  const switchSheet = (index: number) => {
    const s = [...allSheets]; s[activeSheet] = data; setAllSheets(s); setData(s[index]); setActiveSheet(index)
  }

  const addSheet = () => {
    const s = [...allSheets]; s[activeSheet] = data
    const ns = Array.from({ length: ROWS }, () => Array(COLS).fill(""))
    s.push(ns); setAllSheets(s); setSheetNames(p => [...p, `Sheet${p.length + 1}`]); setData(ns); setActiveSheet(s.length - 1)
  }

  const addRow = () => setData(p => [...p, Array(numCols).fill("")])
  const addCol = () => setData(p => p.map(r => [...r, ""]))
  const deleteRow = (ri: number) => { if (data.length > 1) setData(p => p.filter((_, i) => i !== ri)) }
  const deleteCol = (ci: number) => { if (numCols > 1) setData(p => p.map(r => r.filter((_, i) => i !== ci))) }
  const insertRowAbove = (ri: number) => setData(p => [...p.slice(0, ri), Array(numCols).fill(""), ...p.slice(ri)])
  const insertColLeft = (ci: number) => setData(p => p.map(r => [...r.slice(0, ci), "", ...r.slice(ci)]))

  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, r, c })
  }

  useEffect(() => {
    const h = () => setContextMenu(null)
    window.addEventListener("click", h); return () => window.removeEventListener("click", h)
  }, [])

  const filteredData = filterCol !== null && filterValue
    ? data.filter(row => String(row[filterCol] ?? "").toLowerCase().includes(filterValue.toLowerCase()))
    : data

  return (
    <div className="flex flex-col h-[88vh] bg-[#f8f9fa] rounded-xl overflow-hidden border border-gray-300">
      {/* TOOLBAR */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#217346] text-white">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z"/></svg>
        <span className="text-sm font-medium truncate max-w-[180px]">{fileName}</span>
        <div className="w-px h-5 bg-white/30 mx-1" />
        <button onClick={addRow} className="px-2 py-1 rounded text-[10px] hover:bg-white/20 transition">+ Row</button>
        <button onClick={addCol} className="px-2 py-1 rounded text-[10px] hover:bg-white/20 transition">+ Col</button>
        <button onClick={() => deleteRow(data.length - 1)} className="px-2 py-1 rounded text-[10px] hover:bg-white/20 transition">− Row</button>
        <button onClick={() => deleteCol(numCols - 1)} className="px-2 py-1 rounded text-[10px] hover:bg-white/20 transition">− Col</button>
        <div className="w-px h-5 bg-white/30 mx-1" />
        <button onClick={() => setShowFilter(!showFilter)} className={`px-2 py-1 rounded text-[10px] transition ${showFilter ? "bg-white/30" : "hover:bg-white/20"}`}>Filter</button>
        <div className="flex-1" />
        {status && <span className="text-[10px] text-green-200 mr-2">{status}</span>}
        <button onClick={() => onExport([...allSheets.map((s, i) => i === activeSheet ? data : s)], sheetNames, activeSheet)} className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-[#217346] hover:bg-gray-100 transition">Export .xlsx</button>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-white/70 hover:bg-white/20 transition">Close</button>
      </div>

      {/* FORMULA BAR */}
      <div className="flex items-center border-b border-gray-200 bg-white">
        <div className="w-20 px-2 py-1.5 text-xs font-medium text-center text-gray-600 border-r border-gray-200 bg-gray-50 select-none">{colLabel(activeCell[1])}{activeCell[0] + 1}</div>
        <div className="px-2 text-gray-400 text-sm select-none">ƒ</div>
        <input value={formulaBarValue} onChange={e => { setFormulaBarValue(e.target.value); updateCell(activeCell[0], activeCell[1], e.target.value) }}
          onKeyDown={e => { if (e.key === "Enter") { commitEdit(); (e.target as HTMLInputElement).blur() } }}
          className="flex-1 px-2 py-1.5 text-sm text-gray-800 outline-none" placeholder="Enter value or formula (=SUM, =AVG, =MIN, =MAX, =COUNT)..." />
      </div>

      {/* FILTER BAR */}
      {showFilter && (
        <div className="flex items-center gap-2 px-3 py-1 border-b border-gray-200 bg-yellow-50">
          <span className="text-[10px] text-gray-500">Filter column:</span>
          <select value={filterCol ?? ""} onChange={e => setFilterCol(e.target.value ? Number(e.target.value) : null)} className="h-6 px-1 text-[10px] border border-gray-300 rounded">
            <option value="">All</option>
            {Array.from({ length: numCols }, (_, i) => <option key={i} value={i}>{colLabel(i)}</option>)}
          </select>
          <input value={filterValue} onChange={e => setFilterValue(e.target.value)} className="h-6 px-2 text-[10px] border border-gray-300 rounded flex-1 max-w-[200px]" placeholder="Filter value..." />
          <button onClick={() => { setFilterCol(null); setFilterValue(""); setShowFilter(false) }} className="text-[10px] text-gray-400">Clear</button>
        </div>
      )}

      {/* GRID */}
      <div ref={tableRef} className="flex-1 overflow-auto relative bg-white" onKeyDown={handleGridKeyDown} tabIndex={0}>
        <table className="border-collapse bg-white w-full">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 w-12 min-w-[48px] bg-[#f8f9fa] border-b border-r border-gray-300 text-xs text-gray-500 font-normal" />
              {Array.from({ length: numCols }, (_, ci) => (
                <th key={ci} onClick={() => handleSort(ci)}
                  className={`bg-[#f8f9fa] border-b border-r border-gray-300 px-1 py-1 text-xs text-gray-600 font-medium select-none cursor-pointer hover:bg-gray-200 ${activeCell[1] === ci ? "bg-[#d3e3fd] text-blue-700" : ""}`}
                  style={{ minWidth: 100, width: 100 }}>
                  {colLabel(ci)} {sortCol === ci ? (sortAsc ? "▲" : "▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, ri) => (
              <tr key={ri}>
                <td className={`sticky left-0 z-10 bg-[#f8f9fa] border-b border-r border-gray-300 px-2 py-0 text-xs text-gray-500 text-center select-none ${activeCell[0] === ri ? "bg-[#d3e3fd] text-blue-700 font-medium" : ""}`} style={{ minWidth: 48 }}>{ri + 1}</td>
                {row.map((cell, ci) => {
                  const isActive = activeCell[0] === ri && activeCell[1] === ci
                  const isEditing = editingCell?.[0] === ri && editingCell?.[1] === ci
                  const raw = String(cell ?? "")
                  const display = evaluateFormula(cell)
                  return (
                    <td key={ci} className={`border-b border-r border-gray-200 p-0 relative ${isActive ? "outline outline-2 outline-blue-500 z-10" : ""}`}
                      style={{ minWidth: 100, width: 100 }} onClick={() => selectCell(ri, ci)} onDoubleClick={() => { setEditingCell([ri, ci]); setFormulaBarValue(raw) }}
                      onContextMenu={e => handleContextMenu(e, ri, ci)}>
                      {isEditing ? (
                        <input autoFocus value={formulaBarValue} onChange={e => { setFormulaBarValue(e.target.value); updateCell(ri, ci, e.target.value) }}
                          onKeyDown={e => handleCellKeyDown(e, ri, ci)} onBlur={commitEdit}
                          className="w-full h-full px-1.5 py-0.5 text-sm text-gray-800 outline-none bg-white" />
                      ) : (
                        <div className={`px-1.5 py-0.5 text-sm truncate min-h-[24px] cursor-cell ${raw.startsWith("=") ? "text-gray-800" : !isNaN(Number(raw)) && raw.trim() ? "text-right text-gray-800" : "text-gray-800"}`}>
                          {display}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px]" style={{ left: contextMenu.x, top: contextMenu.y }}>
          {[
            { label: "Insert Row Above", action: () => insertRowAbove(contextMenu.r) },
            { label: "Insert Column Left", action: () => insertColLeft(contextMenu.c) },
            { label: "Delete Row", action: () => deleteRow(contextMenu.r) },
            { label: "Delete Column", action: () => deleteCol(contextMenu.c) },
            { label: `Sort A→Z`, action: () => { setSortAsc(true); handleSort(contextMenu.c) } },
            { label: `Sort Z→A`, action: () => { setSortAsc(false); handleSort(contextMenu.c) } },
            { label: "Clear Cell", action: () => updateCell(contextMenu.r, contextMenu.c, "") },
          ].map((item, i) => (
            <button key={i} onClick={() => { item.action(); setContextMenu(null) }}
              className="w-full px-3 py-1.5 text-xs text-gray-700 text-left hover:bg-blue-50 transition">{item.label}</button>
          ))}
        </div>
      )}

      {/* SHEET TABS */}
      <div className="flex items-center border-t border-gray-300 bg-[#f8f9fa] px-1 py-0.5">
        <button onClick={addSheet} className="w-7 h-7 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 text-lg transition" title="Add Sheet">+</button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        {sheetNames.map((name, i) => (
          <button key={i} onClick={() => switchSheet(i)}
            className={`px-4 py-1 text-xs font-medium border-t-2 transition ${i === activeSheet ? "bg-white border-[#217346] text-gray-800" : "bg-transparent border-transparent text-gray-500 hover:bg-gray-100"}`}>{name}</button>
        ))}
        <div className="flex-1" />
        <span className="text-[10px] text-gray-400 pr-2">{filteredData.length} rows × {numCols} cols | {colLabel(activeCell[1])}{activeCell[0] + 1}</span>
      </div>
    </div>
  )
}
