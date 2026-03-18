"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="CSV to Excel" subtitle="Convert CSV files to Excel spreadsheets" fromFormat="CSV" toFormat="Excel" acceptTypes=".csv" fromColor="from-teal-500 to-cyan-400" toColor="from-green-500 to-emerald-400" />
}
