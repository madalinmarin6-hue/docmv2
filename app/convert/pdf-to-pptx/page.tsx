"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="PDF to PowerPoint" subtitle="Convert PDF files to PowerPoint presentations" fromFormat="PDF" toFormat="PPTX" acceptTypes=".pdf" fromColor="from-red-500 to-rose-400" toColor="from-orange-500 to-amber-400" />
}
