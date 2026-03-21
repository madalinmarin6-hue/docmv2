"use client"

import Link from "next/link"

type Props = {
lang: string
classicMode: boolean
}

export default function Footer({ lang, classicMode }: Props){

const text = {
EN: {
brand: "DocM",
tagline: "The modern way to edit, convert and manage your documents online.",
product: "Product",
links: [
{ label: "PDF Converter", href: "/convert/pdf-to-word" },
{ label: "Document Editor", href: "/tools/pdf-editor" },
{ label: "PDF Creator", href: "/tools/pdf-creator" },
{ label: "Compress Files", href: "/tools/compress" }
],
company: "Company",
companyLinks: [
{ label: "About Us", href: "/about" },
{ label: "Help & Contact", href: "/help" },
{ label: "Privacy Policy", href: "/privacy" },
{ label: "Terms of Service", href: "/terms" },
{ label: "Cookie Policy", href: "/cookies" }
],
resources: "Resources",
resourceLinks: [
{ label: "Help Center", href: "/help" },
{ label: "Blog", href: "/blog" },
{ label: "Dashboard", href: "/dashboard" },
{ label: "Login", href: "/login" }
],
newsletter: "Stay updated",
newsletterDesc: "Get the latest updates and tips directly in your inbox.",
placeholder: "Enter your email",
subscribe: "Subscribe",
copy: "All rights reserved."
},
RO: {
brand: "DocM",
tagline: "Modalitatea modernă de a edita, converti și gestiona documentele online.",
product: "Produs",
links: [
{ label: "Convertor PDF", href: "/convert/pdf-to-word" },
{ label: "Editor Documente", href: "/tools/pdf-editor" },
{ label: "Creator PDF", href: "/tools/pdf-creator" },
{ label: "Comprimare Fișiere", href: "/tools/compress" }
],
company: "Companie",
companyLinks: [
{ label: "Despre Noi", href: "/about" },
{ label: "Ajutor & Contact", href: "/help" },
{ label: "Politica de Confidențialitate", href: "/privacy" },
{ label: "Termeni și Condiții", href: "/terms" },
{ label: "Politica Cookie-uri", href: "/cookies" }
],
resources: "Resurse",
resourceLinks: [
{ label: "Centru Ajutor", href: "/help" },
{ label: "Blog", href: "/blog" },
{ label: "Panou Control", href: "/dashboard" },
{ label: "Autentificare", href: "/login" }
],
newsletter: "Rămâi la curent",
newsletterDesc: "Primește cele mai noi actualizări și sfaturi direct în inbox.",
placeholder: "Introdu email-ul",
subscribe: "Abonează-te",
copy: "Toate drepturile rezervate."
}
}

const t = text[lang as "EN" | "RO"]

return(

<footer className={`mt-40 border-t ${classicMode ? "border-gray-200 bg-white/60" : "border-white/10 bg-black/30"} backdrop-blur-xl`}>

<div className="max-w-6xl mx-auto px-6 py-16">

<div className="grid md:grid-cols-5 gap-10">


{/* BRAND */}

<div className="md:col-span-2">

<div className="flex items-center gap-4 mb-4">
<img src="/logo.png" className="w-32 h-auto object-contain" alt="DocM" />
<a href="https://steezytech.ro/" target="_blank" rel="noopener noreferrer" className="transition hover:scale-105 inline-flex items-baseline">
<span className={`text-2xl font-extrabold tracking-tight ${classicMode ? "text-gray-900" : "text-white"}`}>SteeZy</span><span className="text-2xl font-extrabold tracking-tight text-blue-500">Tech</span>
</a>
</div>

<p className={`text-sm leading-relaxed max-w-xs ${classicMode ? "text-gray-500" : "text-white/50"}`}>
{t.tagline}
</p>

<div className="flex gap-3 mt-6">

<a href="https://instagram.com/mmadalin5" target="_blank" rel="noopener noreferrer" className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${classicMode ? "bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-600" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}>
<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
</a>

<a href="https://tiktok.com/" target="_blank" rel="noopener noreferrer" className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${classicMode ? "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}>
<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.15v-3.44a4.85 4.85 0 01-3.77-1.81V6.69h3.77z"/></svg>
</a>

</div>

</div>


{/* PRODUCT */}

<div>
<h4 className={`font-semibold text-sm mb-4 ${classicMode ? "text-gray-800" : "text-white"}`}>
{t.product}
</h4>
<ul className="space-y-2.5">
{t.links.map((link, i) => (
<li key={i}>
<Link href={link.href} className={`text-sm transition-colors ${classicMode ? "text-gray-500 hover:text-blue-600" : "text-white/50 hover:text-white"}`}>
{link.label}
</Link>
</li>
))}
</ul>
</div>


{/* COMPANY */}

<div>
<h4 className={`font-semibold text-sm mb-4 ${classicMode ? "text-gray-800" : "text-white"}`}>
{t.company}
</h4>
<ul className="space-y-2.5">
{t.companyLinks.map((link, i) => (
<li key={i}>
<Link href={link.href} className={`text-sm transition-colors ${classicMode ? "text-gray-500 hover:text-blue-600" : "text-white/50 hover:text-white"}`}>
{link.label}
</Link>
</li>
))}
</ul>
</div>


{/* RESOURCES */}

<div>
<h4 className={`font-semibold text-sm mb-4 ${classicMode ? "text-gray-800" : "text-white"}`}>
{t.resources}
</h4>
<ul className="space-y-2.5">
{t.resourceLinks.map((link, i) => (
<li key={i}>
<Link href={link.href} className={`text-sm transition-colors ${classicMode ? "text-gray-500 hover:text-blue-600" : "text-white/50 hover:text-white"}`}>
{link.label}
</Link>
</li>
))}
</ul>
</div>

</div>


{/* NEWSLETTER */}

<div className={`mt-12 pt-8 border-t ${classicMode ? "border-gray-200" : "border-white/10"}`}>

<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

<div>
<h4 className={`font-semibold text-sm mb-1 ${classicMode ? "text-gray-800" : "text-white"}`}>
{t.newsletter}
</h4>
<p className={`text-xs ${classicMode ? "text-gray-500" : "text-white/40"}`}>
{t.newsletterDesc}
</p>
</div>

<div className="flex gap-2">
<input
type="email"
placeholder={t.placeholder}
className={`px-4 py-2.5 rounded-xl text-sm outline-none transition-all w-64
${classicMode
? "bg-gray-100 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-400"
: "bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50"}
`}
/>
<button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20">
{t.subscribe}
</button>
</div>

</div>

</div>


{/* COPYRIGHT */}

<div className={`mt-8 pt-6 border-t text-center ${classicMode ? "border-gray-200" : "border-white/10"}`}>

<p className={`text-xs ${classicMode ? "text-gray-400" : "text-white/30"}`}>
&copy; {new Date().getFullYear()} DocM. {t.copy}
</p>

</div>

</div>

</footer>

)

}
