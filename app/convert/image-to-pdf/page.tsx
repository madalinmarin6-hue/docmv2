"use client"
import MultiImageToPdf from "@/components/MultiImageToPdf"
export default function Page() {
  return <MultiImageToPdf title="Image to PDF" subtitle="Convert multiple images (JPG, PNG, WebP) to a single PDF — reorder pages before creating" acceptTypes=".jpg,.jpeg,.png,.webp,.bmp,.gif,.svg,.tiff" />
}
