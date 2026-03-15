"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="Word to PDF" subtitle="Convert Word documents to PDF format" fromFormat="Word" toFormat="PDF" acceptTypes=".docx,.doc,.html,.txt" fromColor="from-blue-500 to-blue-400" toColor="from-red-500 to-rose-400" />
}
