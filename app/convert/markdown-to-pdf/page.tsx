"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="Markdown to PDF" subtitle="Convert Markdown files to PDF format" fromFormat="Markdown" toFormat="PDF" acceptTypes=".md,.markdown" fromColor="from-gray-500 to-slate-400" toColor="from-red-500 to-rose-400" />
}
