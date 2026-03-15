"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useApp } from "@/components/AppContext"

const sidebarSections = [
{
label: "PDF Tools",
items: [
{ href: "/tools/pdf-viewer", label: "PDF Viewer", icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
{ href: "/tools/pdf-editor", label: "PDF Editor", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
{ href: "/tools/split-pdf", label: "Split PDF", icon: "M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12H9" },
]
},
{
label: "Document Editors",
items: [
{ href: "/tools/word-editor", label: "Word Editor", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
{ href: "/tools/excel-editor", label: "Excel Editor", icon: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12h7.5m-7.5 0c.621 0 1.125.504 1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" },
{ href: "/tools/powerpoint-editor", label: "PowerPoint Editor", icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" },
{ href: "/tools/txt-editor", label: "TXT / Code Editor", icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" },
{ href: "/tools/csv-editor", label: "CSV Editor", icon: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125" },
]
},
{
label: "Utilities",
items: [
{ href: "/tools/ocr", label: "OCR (Image → Text)", icon: "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" },
{ href: "/tools/remove-bg", label: "Remove Background", icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5" },
{ href: "/tools/compress", label: "Compress", icon: "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" },
]
},
{
label: "Convert from PDF",
items: [
{ href: "/convert/pdf-to-word", label: "PDF → Word", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
{ href: "/convert/pdf-to-excel", label: "PDF → Excel", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
{ href: "/convert/pdf-to-pptx", label: "PDF → PPTX", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
{ href: "/convert/pdf-to-jpg", label: "PDF → JPG", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
{ href: "/convert/pdf-to-png", label: "PDF → PNG", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
]
},
{
label: "Convert to PDF",
items: [
{ href: "/convert/word-to-pdf", label: "Word → PDF", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
{ href: "/convert/excel-to-pdf", label: "Excel → PDF", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
{ href: "/convert/pptx-to-pdf", label: "PPTX → PDF", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
{ href: "/convert/jpg-to-pdf", label: "JPG → PDF", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
{ href: "/convert/png-to-pdf", label: "PNG → PDF", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
]
}
]

type Props = {
children: React.ReactNode
title: string
subtitle?: string
}

export default function ToolLayout({ children, title }: Props) {

const pathname = usePathname()
const [collapsed, setCollapsed] = useState(false)
const { classicMode, setClassicMode } = useApp()
const { status } = useSession()

const collapseSidebar = useCallback(() => setCollapsed(true), [])

useEffect(() => {
  window.addEventListener("docm-collapse-sidebar", collapseSidebar)
  return () => window.removeEventListener("docm-collapse-sidebar", collapseSidebar)
}, [collapseSidebar])

/* Auth gate — require login to use tools */
if (status === "loading") {
  return (
    <div className={`min-h-screen flex items-center justify-center ${classicMode ? "bg-[#f0f2f5] text-gray-900" : "bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e] text-white"}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className={`text-sm ${classicMode ? "text-gray-500" : "text-white/40"}`}>Loading...</p>
      </div>
    </div>
  )
}

if (status === "unauthenticated") {
  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${classicMode ? "bg-[#f0f2f5] text-gray-900" : "bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e] text-white"}`}>
      <div className={`max-w-md w-full rounded-2xl p-8 text-center space-y-6 ${classicMode ? "bg-white border border-gray-200 shadow-lg" : "bg-white/5 border border-white/10 backdrop-blur-xl"}`}>
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
        </div>
        <div>
          <h2 className={`text-2xl font-bold mb-2 ${classicMode ? "text-gray-900" : ""}`}>Account Required</h2>
          <p className={`text-sm ${classicMode ? "text-gray-500" : "text-white/50"}`}>
            Create a free account or log in to start using <strong>{title}</strong> and all DocM editing tools. Free accounts get 10 edits per day!
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/auth/register" className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20 block">
            Create Free Account
          </Link>
          <Link href="/auth/login" className={`w-full py-3 rounded-xl text-sm font-semibold transition-all block ${classicMode ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200" : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"}`}>
            Log In
          </Link>
        </div>
        <Link href="/" className={`inline-flex items-center gap-1 text-xs ${classicMode ? "text-gray-400 hover:text-gray-600" : "text-white/30 hover:text-white/50"} transition`}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Back to Home
        </Link>
      </div>
    </div>
  )
}

return (

<div className={`min-h-screen ${classicMode ? "bg-[#f0f2f5] text-gray-900" : "bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e] text-white"}`}>

{/* TOP BAR */}
<div className={`fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-xl border-b flex items-center px-4 gap-2 ${classicMode ? "bg-white/90 border-gray-200" : "bg-[#0a0f2e]/90 border-white/10"}`}>

<Link href="/" className="flex items-center gap-2 mr-1">
<img src="/logo.png" className="w-24 h-auto object-contain" alt="DocM" />
</Link>

<button onClick={() => setCollapsed(!collapsed)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${classicMode ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
</svg>
</button>

{/* NAV LINKS — More items shown directly */}
<div className="hidden md:flex items-center gap-1 ml-2">
{[{href:"/about",label:"About"},{href:"/reviews",label:"Reviews"},{href:"/blog",label:"Blog"},{href:"/help",label:"Help"},{href:"/report-bug",label:"Report Bug"}].map(i=>(
<Link key={i.href} href={i.href} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all ${classicMode ? "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900" : "bg-white/[0.04] text-white/60 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"}`}>{i.label}</Link>
))}
</div>

<div className="flex-1" />

<span className={`text-sm font-semibold hidden sm:block ${classicMode ? "text-gray-800" : "text-white/80"}`}>{title}</span>

<div className="flex-1" />

<div className="flex gap-2 items-center">
{status === "authenticated" && (
<Link href="/cloud" className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${classicMode ? "bg-violet-50 text-purple-700 border border-purple-200 hover:bg-violet-100" : "bg-purple-500/15 text-purple-300 border border-purple-400/20 hover:bg-purple-500/25"}`}>
<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" /></svg>
Cloud
</Link>
)}
{status === "authenticated" && (
<Link href="/dashboard" className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${classicMode ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
Profile
</Link>
)}
<button onClick={() => setClassicMode(!classicMode)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${classicMode ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-white/5 border border-white/10 hover:bg-white/10 text-white/50"}`} title={classicMode ? "Dark mode" : "Light mode"}>
{classicMode ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>}
</button>
<Link href="/" className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${classicMode ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
Home
</Link>
</div>

</div>

<div className="flex pt-14">

{/* SIDEBAR */}
<aside className={`fixed top-14 left-0 bottom-0 backdrop-blur-xl border-r overflow-y-auto transition-all duration-300 z-40 ${classicMode ? "bg-white/80 border-gray-200" : "bg-[#080d28]/80 border-white/10"} ${collapsed ? "w-0 opacity-0 overflow-hidden" : "w-64 opacity-100"}`}>

<div className="p-4 space-y-6">

{sidebarSections.map((section, si) => (

<div key={si}>

<p className={`text-[10px] font-bold tracking-widest uppercase mb-2 px-3 ${classicMode ? "text-gray-400" : "text-white/30"}`}>
{section.label}
</p>

{section.items.map((item, ii) => {

const active = pathname === item.href

return (
<Link
key={ii}
href={item.href}
className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all mb-0.5 ${
active
? classicMode ? "bg-blue-50 text-blue-700 border border-blue-200 font-medium" : "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/30"
: classicMode ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : "text-white/60 hover:text-white hover:bg-white/5"
}`}
>
<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
</svg>
<span className="truncate">{item.label}</span>
</Link>
)

})}

</div>

))}

</div>

</aside>

{/* MAIN CONTENT */}
<main className={`flex-1 transition-all duration-300 ${collapsed ? "ml-0" : "ml-64"}`}>

<div className="p-6">

{children}

</div>

</main>

</div>

</div>

)

}
