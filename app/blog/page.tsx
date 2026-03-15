"use client"

import { useState } from "react"
import Link from "next/link"
import { useApp } from "@/components/AppContext"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

const posts = [
  { slug: "pdf-to-word", color: "from-blue-500 to-cyan-400", image: "/pdf.png", tool: "/convert/pdf-to-word",
    EN: { title: "How to Convert PDF to Word in 3 Simple Steps", excerpt: "Learn the fastest way to convert your PDF documents to editable Word files.", date: "Mar 10, 2026", category: "Tutorial", readTime: "3 min" },
    RO: { title: "Cum sa Convertesti PDF in Word in 3 Pasi Simpli", excerpt: "Invata cel mai rapid mod de a converti documentele PDF in fisiere Word editabile.", date: "10 Mar 2026", category: "Tutorial", readTime: "3 min" } },
  { slug: "pdf-to-excel", color: "from-emerald-500 to-teal-400", image: "/excel.png", tool: "/convert/pdf-to-excel",
    EN: { title: "PDF to Excel: Extract Tables and Data Instantly", excerpt: "Pull tables from a PDF into a spreadsheet. Our converter preserves your data structure.", date: "Mar 9, 2026", category: "Tutorial", readTime: "4 min" },
    RO: { title: "PDF in Excel: Extrage Tabele si Date Instant", excerpt: "Extrage tabele dintr-un PDF intr-o foaie de calcul. Convertorul nostru pastreaza structura datelor.", date: "9 Mar 2026", category: "Tutorial", readTime: "4 min" } },
  { slug: "pdf-to-pptx", color: "from-orange-500 to-amber-400", image: "/powerpoint.png", tool: "/convert/pdf-to-pptx",
    EN: { title: "Convert PDF to PowerPoint for Easy Presentations", excerpt: "Transform any PDF report into an editable PowerPoint file for meetings.", date: "Mar 8, 2026", category: "Tutorial", readTime: "3 min" },
    RO: { title: "Converteste PDF in PowerPoint pentru Prezentari Usoare", excerpt: "Transforma orice raport PDF intr-un fisier PowerPoint editabil pentru intalniri.", date: "8 Mar 2026", category: "Tutorial", readTime: "3 min" } },
  { slug: "pdf-to-jpg", color: "from-pink-500 to-rose-400", image: "/pdf.png", tool: "/convert/pdf-to-jpg",
    EN: { title: "PDF to JPG & PNG: Export Pages as Images", excerpt: "Convert PDF pages into high-quality JPG or PNG images for sharing.", date: "Mar 7, 2026", category: "Tutorial", readTime: "3 min" },
    RO: { title: "PDF in JPG si PNG: Exporta Pagini ca Imagini", excerpt: "Converteste pagini PDF in imagini JPG sau PNG de inalta calitate pentru partajare.", date: "7 Mar 2026", category: "Tutorial", readTime: "3 min" } },
  { slug: "document-management-tips", color: "from-emerald-500 to-green-400", image: "/edit.png", tool: null,
    EN: { title: "5 Tips for Better Document Management", excerpt: "Productivity tips for organizing, converting, and editing your documents efficiently.", date: "Mar 6, 2026", category: "Productivity", readTime: "5 min" },
    RO: { title: "5 Sfaturi pentru o Mai Buna Gestionare a Documentelor", excerpt: "Sfaturi de productivitate pentru organizarea, conversia si editarea eficienta a documentelor.", date: "6 Mar 2026", category: "Productivitate", readTime: "5 min" } },
  { slug: "file-formats-guide", color: "from-purple-500 to-pink-400", image: "/word.png", tool: null,
    EN: { title: "Understanding File Formats: PDF vs DOCX vs XLSX", excerpt: "A guide to the most common document formats and when to use each one.", date: "Mar 5, 2026", category: "Guide", readTime: "7 min" },
    RO: { title: "Intelegerea Formatelor: PDF vs DOCX vs XLSX", excerpt: "Un ghid pentru cele mai comune formate de documente si cand sa le folosesti.", date: "5 Mar 2026", category: "Ghid", readTime: "7 min" } },
  { slug: "pdf-editor", color: "from-red-500 to-orange-400", image: "/pdf.png", tool: "/tools/pdf-editor",
    EN: { title: "How to Edit PDF Files Online — No Software Needed", excerpt: "Add text, highlights, annotations, and images directly into your PDF in browser.", date: "Mar 4, 2026", category: "Tutorial", readTime: "4 min" },
    RO: { title: "Cum sa Editezi Fisiere PDF Online — Fara Software", excerpt: "Adauga text, evidentierea, adnotari si imagini direct in PDF-ul tau in browser.", date: "4 Mar 2026", category: "Tutorial", readTime: "4 min" } },
  { slug: "powerpoint-editor", color: "from-orange-500 to-amber-400", image: "/powerpoint.png", tool: "/tools/powerpoint-editor",
    EN: { title: "New Feature: PowerPoint Editor Now Available", excerpt: "Create and edit presentations directly in your browser.", date: "Mar 3, 2026", category: "News", readTime: "2 min" },
    RO: { title: "Functie Noua: Editorul PowerPoint Disponibil", excerpt: "Creaza si editeaza prezentari direct in browser.", date: "3 Mar 2026", category: "Noutati", readTime: "2 min" } },
  { slug: "word-editor", color: "from-blue-500 to-indigo-400", image: "/word.png", tool: "/tools/word-editor",
    EN: { title: "Word Editor: Create & Edit DOCX Files Online", excerpt: "Create new documents or upload existing .docx files for editing in browser.", date: "Mar 2, 2026", category: "Tutorial", readTime: "4 min" },
    RO: { title: "Editor Word: Creaza si Editeaza Fisiere DOCX Online", excerpt: "Creaza documente noi sau incarca fisiere .docx existente pentru editare in browser.", date: "2 Mar 2026", category: "Tutorial", readTime: "4 min" } },
  { slug: "excel-editor", color: "from-green-500 to-teal-400", image: "/excel.png", tool: "/tools/excel-editor",
    EN: { title: "Excel Tips: Working with Large Spreadsheets", excerpt: "Optimize your workflow when handling complex spreadsheets with thousands of rows.", date: "Mar 1, 2026", category: "Tutorial", readTime: "6 min" },
    RO: { title: "Sfaturi Excel: Lucrul cu Foi de Calcul Mari", excerpt: "Optimizeaza fluxul de lucru cand gestionezi foi de calcul complexe cu mii de randuri.", date: "1 Mar 2026", category: "Tutorial", readTime: "6 min" } },
  { slug: "compress-pdf", color: "from-cyan-500 to-blue-400", image: "/pdf.png", tool: "/tools/compress",
    EN: { title: "How to Compress PDFs Without Losing Quality", excerpt: "Reduce PDF file size for email attachments while maintaining visual quality.", date: "Feb 28, 2026", category: "Tutorial", readTime: "3 min" },
    RO: { title: "Cum sa Comprimi PDF-uri Fara Pierdere de Calitate", excerpt: "Reduce dimensiunea PDF-urilor pentru atasamente email mentinand calitatea vizuala.", date: "28 Feb 2026", category: "Tutorial", readTime: "3 min" } },
  { slug: "secure-documents-online", color: "from-red-500 to-rose-400", image: "/upload.png", tool: null,
    EN: { title: "How to Secure Your Documents Online", excerpt: "Best practices for keeping your sensitive documents safe when using online tools.", date: "Feb 26, 2026", category: "Security", readTime: "4 min" },
    RO: { title: "Cum sa iti Securizezi Documentele Online", excerpt: "Cele mai bune practici pentru pastrarea documentelor sensibile in siguranta online.", date: "26 Feb 2026", category: "Securitate", readTime: "4 min" } },
  { slug: "convert-to-pdf", color: "from-violet-500 to-purple-400", image: "/pdf.png", tool: "/convert/word-to-pdf",
    EN: { title: "Convert Word, Excel & Images to PDF Easily", excerpt: "Convert any document or image to PDF in one click. Maintain formatting across devices.", date: "Feb 24, 2026", category: "Guide", readTime: "5 min" },
    RO: { title: "Converteste Word, Excel si Imagini in PDF Usor", excerpt: "Converteste orice document sau imagine in PDF dintr-un click. Pastreaza formatarea.", date: "24 Feb 2026", category: "Ghid", readTime: "5 min" } },
  { slug: "split-pdf", color: "from-amber-500 to-yellow-400", image: "/pdf.png", tool: "/tools/split-pdf",
    EN: { title: "Split PDF: Extract Specific Pages from Large Documents", excerpt: "Extract just the pages you need from large PDFs. Perfect for chapters and invoices.", date: "Feb 22, 2026", category: "Tutorial", readTime: "3 min" },
    RO: { title: "Separa PDF: Extrage Pagini Specifice din Documente Mari", excerpt: "Extrage doar paginile de care ai nevoie din PDF-uri mari. Perfect pentru capitole si facturi.", date: "22 Feb 2026", category: "Tutorial", readTime: "3 min" } },
  { slug: "txt-csv-editors", color: "from-gray-500 to-slate-400", image: "/edit.png", tool: "/tools/txt-editor",
    EN: { title: "TXT & CSV Editors: Lightweight File Editing Online", excerpt: "Edit plain text and CSV files directly in your browser. Perfect for quick edits.", date: "Feb 20, 2026", category: "Tutorial", readTime: "3 min" },
    RO: { title: "Editoare TXT si CSV: Editare Usoara de Fisiere Online", excerpt: "Editeaza fisiere text simplu si CSV direct in browser. Perfect pentru editari rapide.", date: "20 Feb 2026", category: "Tutorial", readTime: "3 min" } },
  { slug: "merge-pdf-online", color: "from-indigo-500 to-blue-400", image: "/pdf.png", tool: "/tools/merge-pdf",
    EN: { title: "How to Merge PDF Files Online for Free", excerpt: "Combine multiple PDF documents into one file in seconds. No software download required.", date: "Feb 18, 2026", category: "Tutorial", readTime: "3 min" },
    RO: { title: "Cum sa Unifici Fisiere PDF Online Gratuit", excerpt: "Combina mai multe documente PDF intr-un singur fisier in cateva secunde. Fara descarcari.", date: "18 Feb 2026", category: "Tutorial", readTime: "3 min" } },
  { slug: "ocr-extract-text", color: "from-teal-500 to-emerald-400", image: "/img.png", tool: "/tools/ocr",
    EN: { title: "OCR: Extract Text from Images and Scanned Documents", excerpt: "Use optical character recognition to convert scanned PDFs and photos into editable text.", date: "Feb 16, 2026", category: "Tutorial", readTime: "4 min" },
    RO: { title: "OCR: Extrage Text din Imagini si Documente Scanate", excerpt: "Foloseste recunoasterea optica a caracterelor pentru a converti PDF-uri scanate in text editabil.", date: "16 Feb 2026", category: "Tutorial", readTime: "4 min" } },
  { slug: "remove-background-images", color: "from-rose-500 to-pink-400", image: "/img.png", tool: "/tools/remove-bg",
    EN: { title: "Remove Background from Images Online — Free Tool", excerpt: "Automatically remove backgrounds from photos and product images. Perfect for e-commerce and social media.", date: "Feb 14, 2026", category: "Tutorial", readTime: "3 min" },
    RO: { title: "Sterge Fundalul din Imagini Online — Instrument Gratuit", excerpt: "Elimina automat fundalul din poze si imagini de produse. Perfect pentru e-commerce si social media.", date: "14 Feb 2026", category: "Tutorial", readTime: "3 min" } },
  { slug: "best-free-document-editor", color: "from-sky-500 to-cyan-400", image: "/edit.png", tool: null,
    EN: { title: "Best Free Online Document Editor in 2026", excerpt: "Compare the top free document editing tools. Why DocM stands out for students and professionals.", date: "Feb 12, 2026", category: "Guide", readTime: "6 min" },
    RO: { title: "Cel Mai Bun Editor de Documente Online Gratuit in 2026", excerpt: "Compara cele mai bune instrumente gratuite de editare. De ce DocM se distinge pentru studenti si profesionisti.", date: "12 Feb 2026", category: "Ghid", readTime: "6 min" } },
  { slug: "view-pdf-without-adobe", color: "from-fuchsia-500 to-purple-400", image: "/pdf.png", tool: "/tools/pdf-viewer",
    EN: { title: "How to Open and View PDF Files Without Adobe Reader", excerpt: "View PDF documents directly in your browser without installing any software or plugins.", date: "Feb 10, 2026", category: "Guide", readTime: "3 min" },
    RO: { title: "Cum sa Deschizi si Vizualizezi PDF-uri Fara Adobe Reader", excerpt: "Vizualizeaza documente PDF direct in browser fara a instala software sau pluginuri.", date: "10 Feb 2026", category: "Ghid", readTime: "3 min" } },
  { slug: "excel-to-pdf", color: "from-lime-500 to-green-400", image: "/excel.png", tool: null,
    EN: { title: "How to Convert Excel to PDF and Keep Formatting", excerpt: "Export spreadsheets to PDF while preserving cell borders, colors, and layout perfectly.", date: "Feb 8, 2026", category: "Tutorial", readTime: "4 min" },
    RO: { title: "Cum sa Convertesti Excel in PDF si sa Pastrezi Formatarea", excerpt: "Exporta foi de calcul in PDF pastrand perfect bordurile celulelor, culorile si aspectul.", date: "8 Feb 2026", category: "Tutorial", readTime: "4 min" } },
  { slug: "add-signature-to-pdf", color: "from-yellow-500 to-orange-400", image: "/signiture.png", tool: "/tools/pdf-editor",
    EN: { title: "How to Add a Signature to a PDF Online", excerpt: "Sign documents digitally without printing. Draw or type your signature directly on the PDF.", date: "Feb 6, 2026", category: "Tutorial", readTime: "3 min" },
    RO: { title: "Cum sa Adaugi o Semnatura pe un PDF Online", excerpt: "Semneaza documente digital fara a le printa. Deseneaza sau scrie semnatura direct pe PDF.", date: "6 Feb 2026", category: "Tutorial", readTime: "3 min" } },
  { slug: "word-to-pdf", color: "from-red-500 to-amber-400", image: "/word.png", tool: "/convert/word-to-pdf",
    EN: { title: "Word to PDF: Convert DOCX Files Instantly Online", excerpt: "Transform Word documents into professional PDFs with one click. Formatting preserved perfectly.", date: "Feb 4, 2026", category: "Tutorial", readTime: "3 min" },
    RO: { title: "Word in PDF: Converteste Fisiere DOCX Instant Online", excerpt: "Transforma documente Word in PDF-uri profesionale cu un singur click. Formatare pastrata perfect.", date: "4 Feb 2026", category: "Tutorial", readTime: "3 min" } },
]

const txt = {
  EN: { badge: "Blog", title: "Latest Articles", desc: "Tips, tutorials and news about document management and productivity.", all: "All", readMore: "Read more", tryTool: "Try tool", help: "Help", home: "Home", read: "read" },
  RO: { badge: "Blog", title: "Ultimele Articole", desc: "Sfaturi, tutoriale si noutati despre gestionarea documentelor si productivitate.", all: "Toate", readMore: "Citeste mai mult", tryTool: "Incearca", help: "Ajutor", home: "Acasa", read: "citire" },
}

export default function BlogPage() {
  const { lang, setLang, classicMode, setClassicMode } = useApp()
  const c = txt[lang as "EN" | "RO"] || txt.EN
  const cm = classicMode
  const [filter, setFilter] = useState("__all__")

  const getPost = (p: typeof posts[0]) => p[lang as "EN" | "RO"] || p.EN
  const allCategories = Array.from(new Set(posts.map(p => getPost(p).category)))
  const filtered = filter === "__all__" ? posts : posts.filter(p => getPost(p).category === filter)

  return (
    <div className={`min-h-screen ${cm ? "bg-white text-black" : "bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e] text-white"}`}>
      <Navbar lang={lang} setLang={setLang} classicMode={classicMode} setClassicMode={setClassicMode} />

      <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold tracking-widest uppercase text-purple-400 mb-3">{c.badge}</p>
          <h1 className={`text-5xl md:text-6xl font-bold ${cm ? "text-gray-900" : "bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent"}`}>{c.title}</h1>
          <p className={`mt-4 max-w-xl mx-auto ${cm ? "text-gray-500" : "text-white/50"}`}>{c.desc}</p>
        </div>

        <div className="flex justify-center gap-2 mb-12 flex-wrap">
          <button onClick={() => setFilter("__all__")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${filter === "__all__"
              ? cm ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-purple-500/20 text-purple-300 border border-purple-400/30"
              : cm ? "bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-700" : "bg-white/5 text-white/50 border border-white/10 hover:text-white hover:bg-white/10"}`}>
            {c.all}
          </button>
          {allCategories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${filter === cat
                ? cm ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-purple-500/20 text-purple-300 border border-purple-400/30"
                : cm ? "bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-700" : "bg-white/5 text-white/50 border border-white/10 hover:text-white hover:bg-white/10"}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((post, i) => {
            const p = getPost(post)
            return (
              <article key={i} className={`group rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-pointer ${cm ? "bg-gray-50 border border-gray-200 hover:border-gray-300" : "bg-white/5 border border-white/10 hover:border-white/20"}`}>
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className={`h-40 bg-gradient-to-br ${post.color} flex items-center justify-center relative overflow-hidden`}>
                    <img src={post.image} className="w-16 h-16 object-contain opacity-80 group-hover:scale-110 transition-transform duration-300" alt="" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg bg-black/30 backdrop-blur-sm text-[10px] font-medium text-white">{p.category}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className={`flex items-center gap-3 text-xs mb-3 ${cm ? "text-gray-400" : "text-white/30"}`}>
                      <span>{p.date}</span>
                      <span className={`w-1 h-1 rounded-full ${cm ? "bg-gray-300" : "bg-white/20"}`} />
                      <span>{p.readTime} {c.read}</span>
                    </div>
                    <h3 className={`font-semibold text-sm mb-2 group-hover:text-purple-400 transition ${cm ? "text-gray-900" : ""}`}>{p.title}</h3>
                    <p className={`text-xs leading-relaxed ${cm ? "text-gray-500" : "text-white/50"}`}>{p.excerpt}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-purple-400 font-medium group-hover:gap-2 transition-all">
                        {c.readMore}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                      </span>
                      {post.tool && (
                        <span className="text-[10px] px-2 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-400/20">
                          {c.tryTool} →
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </article>
            )
          })}
        </div>
      </div>
      <Footer lang={lang} classicMode={classicMode} />
    </div>
  )
}
