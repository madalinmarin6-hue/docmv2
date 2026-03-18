"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="TXT to Word" subtitle="Convert plain text files to Word documents" fromFormat="TXT" toFormat="Word" acceptTypes=".txt" fromColor="from-gray-500 to-slate-400" toColor="from-blue-500 to-blue-400" />
}
