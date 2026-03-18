"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="JPG to Word" subtitle="Convert JPG images to Word documents" fromFormat="JPG" toFormat="Word" acceptTypes=".jpg,.jpeg" fromColor="from-yellow-500 to-orange-400" toColor="from-blue-500 to-blue-400" />
}
