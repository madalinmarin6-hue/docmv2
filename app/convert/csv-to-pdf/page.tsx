"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="CSV to PDF" subtitle="Convert CSV spreadsheet data to PDF format" fromFormat="CSV" toFormat="PDF" acceptTypes=".csv" fromColor="from-green-500 to-emerald-400" toColor="from-red-500 to-rose-400" />
}
