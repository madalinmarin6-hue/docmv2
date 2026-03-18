"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="Word to TXT" subtitle="Convert Word documents to plain text files" fromFormat="Word" toFormat="TXT" acceptTypes=".docx,.doc" fromColor="from-blue-500 to-blue-400" toColor="from-gray-500 to-slate-400" />
}
