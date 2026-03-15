"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="PDF to Excel" subtitle="Convert PDF tables to Excel spreadsheets" fromFormat="PDF" toFormat="Excel" acceptTypes=".pdf" fromColor="from-red-500 to-rose-400" toColor="from-green-500 to-emerald-400" />
}
