"use client"

import Link from "next/link"

type Props = {
  lang: string
  classicMode: boolean
}

const features = [
  {
    icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
    color: "from-blue-500 to-cyan-400",
    EN: { title: "50+ File Conversions", desc: "Convert between PDF, Word, Excel, PowerPoint, JPG, PNG, HTML, TXT, CSV, Markdown and more. All conversions happen instantly in your browser." },
    RO: { title: "50+ Conversii de Fisiere", desc: "Converteste intre PDF, Word, Excel, PowerPoint, JPG, PNG, HTML, TXT, CSV, Markdown si altele. Toate conversiile se fac instant in browser." },
    href: "/convert/pdf-to-word",
  },
  {
    icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
    color: "from-emerald-500 to-teal-400",
    EN: { title: "Full Document Editors", desc: "Edit Word, Excel, PowerPoint, TXT, CSV and code files directly in your browser. Rich formatting, formulas, and slide editing included." },
    RO: { title: "Editoare Complete de Documente", desc: "Editeaza Word, Excel, PowerPoint, TXT, CSV si fisiere de cod direct in browser. Formatare, formule si editare de slide-uri incluse." },
    href: "/tools/word-editor",
  },
  {
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    color: "from-purple-500 to-pink-400",
    EN: { title: "Advanced PDF Tools", desc: "Split, merge, rotate, compress, encrypt/decrypt, delete pages, add watermarks, extract images, and create PDFs from scratch." },
    RO: { title: "Instrumente PDF Avansate", desc: "Separa, unifica, roteste, comprima, cripteaza/decripteaza, sterge pagini, adauga watermark, extrage imagini si creaza PDF-uri de la zero." },
    href: "/tools/pdf-editor",
  },
  {
    icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    color: "from-orange-500 to-amber-400",
    EN: { title: "File Viewers", desc: "View PDF, Word, Excel, PowerPoint, JPG and PNG files directly in browser without downloading any software or plugins." },
    RO: { title: "Vizualizatoare de Fisiere", desc: "Vizualizeaza PDF, Word, Excel, PowerPoint, JPG si PNG direct in browser fara a descarca software sau plugin-uri." },
    href: "/tools/pdf-viewer",
  },
  {
    icon: "M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z",
    color: "from-violet-500 to-indigo-400",
    EN: { title: "Cloud Storage", desc: "Auto-save your converted and edited files to the cloud. Access them from any device, anytime. Toggle cloud saving on or off." },
    RO: { title: "Stocare in Cloud", desc: "Salveaza automat fisierele convertite si editate in cloud. Acceseaza-le de pe orice dispozitiv, oricand. Activeaza/dezactiveaza salvarea in cloud." },
    href: "/cloud",
  },
  {
    icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z",
    color: "from-rose-500 to-red-400",
    EN: { title: "Image to PDF", desc: "Select multiple JPG or PNG images, reorder them with drag & drop, and combine into a single PDF document in one click." },
    RO: { title: "Imagine in PDF", desc: "Selecteaza mai multe imagini JPG sau PNG, reordoneaza-le prin drag & drop, si combina-le intr-un singur PDF cu un singur click." },
    href: "/convert/image-to-pdf",
  },
  {
    icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
    color: "from-red-500 to-orange-400",
    EN: { title: "PDF Encryption", desc: "Protect your PDFs with AES-256 encryption. Only you can decrypt them with your password. Forgot your password? Request recovery from the owner." },
    RO: { title: "Criptare PDF", desc: "Protejeaza PDF-urile cu criptare AES-256. Doar tu le poti decripta cu parola ta. Ai uitat parola? Solicita recuperare de la proprietar." },
    href: "/tools/encrypt-pdf",
  },
  {
    icon: "M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "from-teal-500 to-cyan-400",
    EN: { title: "Pin Favorite Tools", desc: "Pin your most-used tools for instant access. Pinned tools appear at the top of the sidebar for quick navigation." },
    RO: { title: "Fixeaza Instrumentele Preferate", desc: "Fixeaza instrumentele cele mai utilizate pentru acces instant. Instrumentele fixate apar in partea de sus a barei laterale." },
    href: "/tools/pdf-editor",
  },
]

export default function FeaturesOverview({ lang, classicMode }: Props) {
  const cm = classicMode
  const t = {
    EN: { badge: "Everything You Need", title: "What's Inside DocM", desc: "A complete document management platform — convert, edit, view, encrypt and organize your files, all from your browser." },
    RO: { badge: "Tot Ce Ai Nevoie", title: "Ce Contine DocM", desc: "O platforma completa de gestionare a documentelor — converteste, editeaza, vizualizeaza, cripteaza si organizeaza fisierele, totul din browser." },
  }
  const c = t[lang as "EN" | "RO"] || t.EN

  return (
    <section className="max-w-6xl mx-auto mt-40 px-6">
      <div className="text-center mb-14">
        <p className={`text-sm font-semibold tracking-widest uppercase mb-3 ${cm ? "text-blue-600" : "text-blue-400"}`}>{c.badge}</p>
        <h2 className={`text-4xl md:text-5xl font-bold ${cm ? "text-gray-800" : "text-white"}`}>{c.title}</h2>
        <p className={`mt-4 max-w-2xl mx-auto ${cm ? "text-gray-500" : "text-white/50"}`}>{c.desc}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f, i) => {
          const ft = f[lang as "EN" | "RO"] || f.EN
          return (
            <Link key={i} href={f.href}
              className={`group p-6 rounded-2xl transition-all hover:-translate-y-1 duration-300 ${cm ? "bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-lg" : "bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.07]"}`}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={f.icon} /></svg>
              </div>
              <h3 className={`font-semibold text-sm mb-2 ${cm ? "text-gray-900" : ""}`}>{ft.title}</h3>
              <p className={`text-xs leading-relaxed ${cm ? "text-gray-500" : "text-white/40"}`}>{ft.desc}</p>
            </Link>
          )
        })}
      </div>

    </section>
  )
}
