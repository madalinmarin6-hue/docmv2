"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="Word to PNG" subtitle="Convert Word documents to PNG images" fromFormat="Word" toFormat="PNG" acceptTypes=".docx,.doc" fromColor="from-blue-500 to-blue-400" toColor="from-emerald-500 to-teal-400" />
}
