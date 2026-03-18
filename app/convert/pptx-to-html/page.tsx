"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="PowerPoint to HTML" subtitle="Convert PowerPoint presentations to HTML pages" fromFormat="PPTX" toFormat="HTML" acceptTypes=".pptx,.ppt" fromColor="from-orange-500 to-amber-400" toColor="from-orange-600 to-red-400" />
}
