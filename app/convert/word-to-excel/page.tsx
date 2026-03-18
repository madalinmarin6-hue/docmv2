"use client"
import ConvertPage from "@/components/ConvertPage"
export default function Page() {
  return <ConvertPage title="Word to Excel" subtitle="Convert Word documents to Excel spreadsheets" fromFormat="Word" toFormat="Excel" acceptTypes=".docx,.doc" fromColor="from-blue-500 to-blue-400" toColor="from-green-500 to-emerald-400" />
}
