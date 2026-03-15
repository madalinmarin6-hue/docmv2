"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="PDF to HTML" subtitle="Convert PDF documents to HTML format" fromFormat="PDF" toFormat="HTML" acceptTypes=".pdf" fromColor="from-red-500 to-rose-400" toColor="from-orange-500 to-amber-400" />
}
