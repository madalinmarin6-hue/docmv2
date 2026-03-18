"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="HTML to Word" subtitle="Convert HTML web pages to Word documents" fromFormat="HTML" toFormat="Word" acceptTypes=".html,.htm" fromColor="from-orange-600 to-red-400" toColor="from-blue-500 to-blue-400" />
}
