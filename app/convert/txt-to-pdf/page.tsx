"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="TXT to PDF" subtitle="Convert plain text files to PDF format" fromFormat="TXT" toFormat="PDF" acceptTypes=".txt" fromColor="from-gray-500 to-slate-400" toColor="from-red-500 to-rose-400" />
}
