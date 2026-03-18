"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="Word to JPG" subtitle="Convert Word documents to JPG images" fromFormat="Word" toFormat="JPG" acceptTypes=".docx,.doc" fromColor="from-blue-500 to-blue-400" toColor="from-yellow-500 to-orange-400" />
}
