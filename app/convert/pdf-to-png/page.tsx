"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="PDF to PNG" subtitle="Convert PDF pages to PNG images" fromFormat="PDF" toFormat="PNG" acceptTypes=".pdf" fromColor="from-red-500 to-rose-400" toColor="from-pink-500 to-rose-400" />
}
