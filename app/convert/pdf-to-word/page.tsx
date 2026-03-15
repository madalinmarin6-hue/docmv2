"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="PDF to Word" subtitle="Convert PDF documents to editable Word format" fromFormat="PDF" toFormat="Word" acceptTypes=".pdf" fromColor="from-red-500 to-rose-400" toColor="from-blue-500 to-blue-400" />
}
