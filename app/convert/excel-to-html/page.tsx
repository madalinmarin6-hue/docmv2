"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="Excel to HTML" subtitle="Convert Excel spreadsheets to HTML tables" fromFormat="Excel" toFormat="HTML" acceptTypes=".xlsx,.xls,.csv" fromColor="from-green-500 to-emerald-400" toColor="from-orange-600 to-red-400" />
}
