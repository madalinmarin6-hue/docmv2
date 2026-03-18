"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="Excel to Word" subtitle="Convert Excel spreadsheets to Word documents" fromFormat="Excel" toFormat="Word" acceptTypes=".xlsx,.xls,.csv" fromColor="from-green-500 to-emerald-400" toColor="from-blue-500 to-blue-400" />
}
