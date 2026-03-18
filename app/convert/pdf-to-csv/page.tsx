"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="PDF to CSV" subtitle="Extract tabular data from PDF to CSV format" fromFormat="PDF" toFormat="CSV" acceptTypes=".pdf" fromColor="from-red-500 to-rose-400" toColor="from-green-500 to-emerald-400" />
}
