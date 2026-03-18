"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="Excel to TXT" subtitle="Convert Excel spreadsheets to plain text" fromFormat="Excel" toFormat="TXT" acceptTypes=".xlsx,.xls,.csv" fromColor="from-green-500 to-emerald-400" toColor="from-gray-500 to-slate-400" />
}
