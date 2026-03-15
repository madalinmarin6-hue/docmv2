"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="JPG to PDF" subtitle="Convert JPG images to PDF documents" fromFormat="JPG" toFormat="PDF" acceptTypes=".jpg,.jpeg" fromColor="from-purple-500 to-violet-400" toColor="from-red-500 to-rose-400" />
}
