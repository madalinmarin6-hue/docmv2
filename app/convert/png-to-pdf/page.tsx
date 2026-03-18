"use client"
import MultiImageToPdf from "@/components/MultiImageToPdf"
export default function Page() {
  return <MultiImageToPdf title="PNG to PDF" subtitle="Convert multiple PNG images to a single PDF — reorder pages before creating" acceptTypes=".png" />
}
