"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="PDF to JPG" subtitle="Convert PDF pages to JPG images" fromFormat="PDF" toFormat="JPG" acceptTypes=".pdf" fromColor="from-red-500 to-rose-400" toColor="from-purple-500 to-violet-400" />
}
