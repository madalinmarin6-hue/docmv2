"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="PDF to TXT" subtitle="Extract text content from PDF documents" fromFormat="PDF" toFormat="TXT" acceptTypes=".pdf" fromColor="from-red-500 to-rose-400" toColor="from-gray-500 to-slate-400" />
}
