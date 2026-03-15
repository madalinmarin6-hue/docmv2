"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

type HeroProps = {
  lang: string
  classicMode: boolean
}

export default function Hero({ lang, classicMode }: HeroProps) {

const { status } = useSession()
const isLoggedIn = status === "authenticated"
const [docCount, setDocCount] = useState(0)
const [usersOnline, setUsersOnline] = useState(0)
const [mounted, setMounted] = useState(false)

useEffect(() => {
  // Compute initial values only on client to avoid hydration mismatch
  const launchDate = new Date("2026-01-01")
  const now = new Date()
  const daysSinceLaunch = Math.max(0, Math.floor((now.getTime() - launchDate.getTime()) / 86400000))
  let total = 4200
  for (let i = 0; i < daysSinceLaunch; i++) {
    const seed = (i * 13 + 7) % 23
    total += 850 + seed * 47
  }
  total += Math.floor(now.getHours() * 38)
  setDocCount(total)

  const hour = now.getHours()
  const base = hour >= 8 && hour <= 22 ? 180 + Math.floor(Math.sin((hour - 8) / 14 * Math.PI) * 220) : 60
  setUsersOnline(base)
  setMounted(true)

  const i1 = setInterval(() => setDocCount(prev => prev + Math.floor(Math.random() * 3) + 1), 2000)
  const i2 = setInterval(() => setUsersOnline(prev => {
    const h = new Date().getHours()
    const target = h >= 8 && h <= 22 ? 180 + Math.floor(Math.sin((h - 8) / 14 * Math.PI) * 220) : 60
    return prev + (prev < target ? 1 : prev > target ? -1 : 0)
  }), 5000)
  return () => { clearInterval(i1); clearInterval(i2) }
}, [])

const content = {

EN: {
  title: "Edit, Convert & Manage Office Files Online",
  sub: "A modern platform for PDF, Word, Excel, PowerPoint and 10+ formats. No installation needed — just open and work.",
  ctaLine1: "Join the platform and start editing your documents instantly.",
  ctaLine2: "No installation, no waiting. Just upload and work.",
  joinBtn: "Get Started Free",
  tryEditor: "Try PDF Editor",
  stat1: "Documents Processed",
  stat2: "Users Online",
  stat3: "Formats Supported",
  stat4: "Uptime"
},

RO: {
title: "Editează, Convertește și Gestionează Fișierele Office",
sub: "O platformă modernă pentru PDF, Word, Excel, PowerPoint și 10+ formate. Fără instalare — deschide și lucrează.",
ctaLine1: "Alătură-te platformei și începe să editezi documentele instant.",
ctaLine2: "Fără instalări, fără așteptare. Doar încarcă și lucrează.",
joinBtn: "Începe Gratuit",
tryEditor: "Încearcă Editorul PDF",
stat1: "Documente Procesate",
stat2: "Utilizatori Online",
stat3: "Formate Suportate",
stat4: "Uptime"
}

}

const t = content[lang as "EN" | "RO"]

return (

<section className="w-full flex flex-col items-center pt-36 pb-10 px-6 relative overflow-hidden">


{/* HERO CARD */}

<div className="max-w-4xl w-full text-center relative z-20">

{/* TITLE */}
<h1 className="animate-fade-in-up text-3xl md:text-5xl font-bold leading-tight text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-shimmer" style={{ animationDelay: "0.1s" }}>
{t.title}
</h1>

{/* SUBTITLE */}
<p className={`mt-6 text-lg max-w-2xl mx-auto leading-relaxed animate-fade-in-up ${classicMode ? "text-gray-600" : "text-white/60"}`} style={{ animationDelay: "0.2s" }}>
{t.sub}
</p>

{/* CTA BUTTONS */}
<div className="flex flex-wrap justify-center gap-4 mt-10 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>

<Link
href={isLoggedIn ? "/dashboard" : "/auth/register"}
className="group relative px-8 py-4 rounded-2xl font-bold text-lg text-white overflow-hidden
bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
hover:scale-105 active:scale-95 transition-all duration-300
shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 animate-pulse-glow"
>
<span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
<span className="relative z-10">{isLoggedIn ? (lang === "RO" ? "Panou de Control" : "Dashboard") : t.joinBtn}</span>
</Link>

</div>

{/* FORMAT PILLS */}
<div className="flex flex-wrap justify-center gap-2 mt-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
{["PDF", "DOCX", "XLSX", "PPTX", "TXT", "CSV", "JSON", "JPG", "PNG", "ZIP"].map((fmt, i) => (
<span
key={fmt}
className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-110 cursor-default
${classicMode
? "bg-gray-100 text-gray-500 border border-gray-200"
: "bg-white/5 text-white/40 border border-white/10 hover:border-white/20 hover:text-white/60"}`}
style={{ animationDelay: `${0.4 + i * 0.05}s` }}
>
{fmt}
</span>
))}
</div>

</div>


{/* DASHBOARD STATS */}

<div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mt-16 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>

<div className={`p-5 rounded-2xl text-center border backdrop-blur-sm transition-all hover:scale-105
${classicMode ? "bg-white/80 border-gray-200 shadow-md" : "bg-white/5 border-white/10 hover:border-white/20"}`}>
<p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
{docCount.toLocaleString('en-US')}
</p>
<p className={`text-xs mt-1 ${classicMode ? "text-gray-500" : "text-white/40"}`}>{t.stat1}</p>
</div>

<div className={`p-5 rounded-2xl text-center border backdrop-blur-sm transition-all hover:scale-105
${classicMode ? "bg-white/80 border-gray-200 shadow-md" : "bg-white/5 border-white/10 hover:border-white/20"}`}>
<div className="flex items-center justify-center gap-2">
<span className="relative flex h-2 w-2">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
</span>
<p className="text-2xl md:text-3xl font-bold text-emerald-400">{usersOnline}</p>
</div>
<p className={`text-xs mt-1 ${classicMode ? "text-gray-500" : "text-white/40"}`}>{t.stat2}</p>
</div>

<div className={`p-5 rounded-2xl text-center border backdrop-blur-sm transition-all hover:scale-105
${classicMode ? "bg-white/80 border-gray-200 shadow-md" : "bg-white/5 border-white/10 hover:border-white/20"}`}>
<p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">10+</p>
<p className={`text-xs mt-1 ${classicMode ? "text-gray-500" : "text-white/40"}`}>{t.stat3}</p>
</div>

<div className={`p-5 rounded-2xl text-center border backdrop-blur-sm transition-all hover:scale-105
${classicMode ? "bg-white/80 border-gray-200 shadow-md" : "bg-white/5 border-white/10 hover:border-white/20"}`}>
<p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">99.9%</p>
<p className={`text-xs mt-1 ${classicMode ? "text-gray-500" : "text-white/40"}`}>{t.stat4}</p>
</div>

</div>


{/* CTA TAGLINE */}

<div className="mt-12 flex flex-col items-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>

<p className={`text-center text-base max-w-xl leading-relaxed ${classicMode ? "text-gray-500" : "text-white/50"}`}>
{t.ctaLine1}
</p>
<p className={`text-center text-sm ${classicMode ? "text-gray-400" : "text-white/30"}`}>
{t.ctaLine2}
</p>

</div>

</section>

)

}
