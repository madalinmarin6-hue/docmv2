"use client"

import Link from "next/link"
import { useApp } from "@/components/AppContext"
import { usePing } from "@/lib/usePing"

const sections = [
  {
    title: "Viewers",
    color: "from-cyan-500 to-blue-500",
    items: [
      { href: "/tools/pdf-viewer", label: "PDF Viewer" },
      { href: "/tools/word-viewer", label: "Word Viewer" },
      { href: "/tools/excel-viewer", label: "Excel Viewer" },
      { href: "/tools/pptx-viewer", label: "PowerPoint Viewer" },
      { href: "/tools/jpg-viewer", label: "JPG Viewer" },
      { href: "/tools/png-viewer", label: "PNG Viewer" },
    ],
  },
  {
    title: "PDF Tools",
    color: "from-red-500 to-rose-500",
    items: [
      { href: "/tools/pdf-editor", label: "PDF Editor" },
      { href: "/tools/pdf-creator", label: "PDF Creator" },
      { href: "/tools/split-pdf", label: "Split PDF" },
      { href: "/tools/merge-pdf", label: "Merge PDF" },
      { href: "/tools/rotate-pdf", label: "Rotate PDF" },
      { href: "/tools/compress", label: "Compress" },
      { href: "/tools/watermark", label: "Add Watermark" },
      { href: "/tools/encrypt-pdf", label: "Encrypt / Decrypt" },
      { href: "/tools/extract-images", label: "Extract Images" },
      { href: "/tools/delete-pages", label: "Delete Pages" },
    ],
  },
  {
    title: "Document Editors",
    color: "from-purple-500 to-indigo-500",
    items: [
      { href: "/tools/word-editor", label: "Word Editor" },
      { href: "/tools/excel-editor", label: "Excel Editor" },
      { href: "/tools/powerpoint-editor", label: "PowerPoint Editor" },
      { href: "/tools/txt-editor", label: "TXT Editor" },
      { href: "/tools/csv-editor", label: "CSV Editor" },
    ],
  },
  {
    title: "Utilities",
    color: "from-emerald-500 to-teal-500",
    items: [
      { href: "/tools/ocr", label: "OCR (Image → Text)" },
      { href: "/tools/remove-bg", label: "Remove Background" },
    ],
  },
  {
    title: "Convert from PDF",
    color: "from-blue-500 to-cyan-500",
    items: [
      { href: "/convert/pdf-to-word", label: "PDF → Word" },
      { href: "/convert/pdf-to-excel", label: "PDF → Excel" },
      { href: "/convert/pdf-to-pptx", label: "PDF → PPTX" },
      { href: "/convert/pdf-to-jpg", label: "PDF → JPG" },
      { href: "/convert/pdf-to-png", label: "PDF → PNG" },
      { href: "/convert/pdf-to-html", label: "PDF → HTML" },
      { href: "/convert/pdf-to-txt", label: "PDF → TXT" },
      { href: "/convert/pdf-to-csv", label: "PDF → CSV" },
    ],
  },
  {
    title: "Convert to PDF",
    color: "from-orange-500 to-amber-500",
    items: [
      { href: "/convert/word-to-pdf", label: "Word → PDF" },
      { href: "/convert/excel-to-pdf", label: "Excel → PDF" },
      { href: "/convert/pptx-to-pdf", label: "PPTX → PDF" },
      { href: "/convert/jpg-to-pdf", label: "JPG → PDF" },
      { href: "/convert/png-to-pdf", label: "PNG → PDF" },
      { href: "/convert/html-to-pdf", label: "HTML → PDF" },
      { href: "/convert/txt-to-pdf", label: "TXT → PDF" },
      { href: "/convert/csv-to-pdf", label: "CSV → PDF" },
      { href: "/convert/markdown-to-pdf", label: "Markdown → PDF" },
      { href: "/convert/image-to-pdf", label: "Image → PDF" },
    ],
  },
  {
    title: "Word & Office Conversions",
    color: "from-violet-500 to-purple-500",
    items: [
      { href: "/convert/word-to-excel", label: "Word → Excel" },
      { href: "/convert/excel-to-word", label: "Excel → Word" },
      { href: "/convert/word-to-pptx", label: "Word → PPTX" },
      { href: "/convert/pptx-to-word", label: "PPTX → Word" },
      { href: "/convert/word-to-html", label: "Word → HTML" },
      { href: "/convert/html-to-word", label: "HTML → Word" },
      { href: "/convert/word-to-txt", label: "Word → TXT" },
      { href: "/convert/txt-to-word", label: "TXT → Word" },
      { href: "/convert/word-to-jpg", label: "Word → JPG" },
      { href: "/convert/word-to-png", label: "Word → PNG" },
      { href: "/convert/jpg-to-word", label: "JPG → Word" },
      { href: "/convert/png-to-word", label: "PNG → Word" },
      { href: "/convert/excel-to-csv", label: "Excel → CSV" },
      { href: "/convert/csv-to-excel", label: "CSV → Excel" },
      { href: "/convert/excel-to-html", label: "Excel → HTML" },
      { href: "/convert/html-to-excel", label: "HTML → Excel" },
      { href: "/convert/excel-to-txt", label: "Excel → TXT" },
      { href: "/convert/pptx-to-html", label: "PPTX → HTML" },
    ],
  },
]

export default function AllToolsPage() {
  usePing()
  const { classicMode: cm } = useApp()

  return (
    <div className={`min-h-screen pt-16 pb-20 px-4 sm:px-6 ${cm ? "bg-gray-50" : "bg-[#0a0e1a]"}`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className={`text-3xl sm:text-4xl font-bold ${cm ? "text-gray-900" : "text-white"}`}>All Tools & Conversions</h1>
          <p className={`mt-2 text-sm ${cm ? "text-gray-500" : "text-white/40"}`}>Everything you need to work with documents, all in one place.</p>
        </div>

        <div className="space-y-8">
          {sections.map(section => (
            <div key={section.title}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${section.color}`} />
                <h2 className={`text-lg font-bold ${cm ? "text-gray-800" : "text-white"}`}>{section.title}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${cm ? "bg-gray-200 text-gray-500" : "bg-white/5 text-white/30"}`}>{section.items.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {section.items.map(item => (
                  <Link key={item.href} href={item.href}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] border ${cm ? "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm" : "bg-white/5 border-white/10 text-white/80 hover:bg-white/[0.08] hover:border-white/20"}`}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
