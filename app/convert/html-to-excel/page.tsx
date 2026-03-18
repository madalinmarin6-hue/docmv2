"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="HTML to Excel" subtitle="Convert HTML tables to Excel spreadsheets" fromFormat="HTML" toFormat="Excel" acceptTypes=".html,.htm" fromColor="from-orange-600 to-red-400" toColor="from-green-500 to-emerald-400" />
}
