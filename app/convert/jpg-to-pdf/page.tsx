"use client"
import MultiImageToPdf from "@/components/MultiImageToPdf"
export default function Page() {
  return <MultiImageToPdf title="JPG to PDF" subtitle="Convert multiple JPG images to a single PDF — reorder pages before creating" acceptTypes=".jpg,.jpeg" />
}
