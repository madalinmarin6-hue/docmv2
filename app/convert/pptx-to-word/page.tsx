"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="PowerPoint to Word" subtitle="Convert PowerPoint presentations to Word documents" fromFormat="PPTX" toFormat="Word" acceptTypes=".pptx,.ppt" fromColor="from-orange-500 to-amber-400" toColor="from-blue-500 to-blue-400" />
}
