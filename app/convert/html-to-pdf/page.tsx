"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="HTML to PDF" subtitle="Convert HTML files to PDF format" fromFormat="HTML" toFormat="PDF" acceptTypes=".html,.htm" fromColor="from-orange-500 to-amber-400" toColor="from-red-500 to-rose-400" />
}
