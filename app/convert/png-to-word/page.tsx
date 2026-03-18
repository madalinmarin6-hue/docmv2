"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="PNG to Word" subtitle="Convert PNG images to Word documents" fromFormat="PNG" toFormat="Word" acceptTypes=".png" fromColor="from-emerald-500 to-teal-400" toColor="from-blue-500 to-blue-400" />
}
