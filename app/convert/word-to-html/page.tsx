"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="Word to HTML" subtitle="Convert Word documents to HTML web pages" fromFormat="Word" toFormat="HTML" acceptTypes=".docx,.doc" fromColor="from-blue-500 to-blue-400" toColor="from-orange-600 to-red-400" />
}
