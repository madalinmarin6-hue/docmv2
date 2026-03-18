"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="Word to PowerPoint" subtitle="Convert Word documents to PowerPoint presentations" fromFormat="Word" toFormat="PPTX" acceptTypes=".docx,.doc" fromColor="from-blue-500 to-blue-400" toColor="from-orange-500 to-amber-400" />
}
