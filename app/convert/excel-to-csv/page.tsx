"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="Excel to CSV" subtitle="Convert Excel spreadsheets to CSV files" fromFormat="Excel" toFormat="CSV" acceptTypes=".xlsx,.xls" fromColor="from-green-500 to-emerald-400" toColor="from-teal-500 to-cyan-400" />
}
