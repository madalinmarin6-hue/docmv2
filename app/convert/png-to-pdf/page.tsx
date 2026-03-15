"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="PNG to PDF" subtitle="Convert PNG images to PDF documents" fromFormat="PNG" toFormat="PDF" acceptTypes=".png" fromColor="from-pink-500 to-rose-400" toColor="from-red-500 to-rose-400" />
}
