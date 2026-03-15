"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="Excel to PDF" subtitle="Convert Excel spreadsheets to PDF format" fromFormat="Excel" toFormat="PDF" acceptTypes=".xlsx,.xls,.csv" fromColor="from-green-500 to-emerald-400" toColor="from-red-500 to-rose-400" />
}
