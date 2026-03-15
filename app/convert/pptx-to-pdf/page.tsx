"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="PowerPoint to PDF" subtitle="Convert PowerPoint presentations to PDF format" fromFormat="PPTX" toFormat="PDF" acceptTypes=".pptx,.ppt,.txt" fromColor="from-orange-500 to-amber-400" toColor="from-red-500 to-rose-400" />
}
