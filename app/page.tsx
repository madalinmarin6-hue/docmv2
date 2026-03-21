"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import Hero from "@/components/Hero"
import FloatingIcons from "@/components/FloatingIcons"
import WhyPlatform from "@/components/WhyPlatform"
import FeaturesOverview from "@/components/FeaturesOverview"
import FileTypes from "@/components/FileTypes"
import Reviews from "@/components/Reviews"
import ScrollTop from "@/components/ScrollTop"
import Footer from "@/components/Footer"
import { useApp } from "@/components/AppContext"

export default function Home() {

const { lang, setLang, classicMode, setClassicMode } = useApp()
const { data: session, status } = useSession()
const [editBanner, setEditBanner] = useState<{ editsLeft: number; bonus: number } | null>(null)
const [countdown, setCountdown] = useState("")

useEffect(() => {
  if (status !== "authenticated") { setEditBanner(null); return }
  fetch("/api/user/profile").then(r => r.json()).then(d => {
    if (d && d.plan !== "premium" && d.plan !== "friend" && d.role !== "owner") {
      const today = new Date().toISOString().split("T")[0]
      const used = d.dailyEditsDate === today ? (d.dailyEditsUsed ?? 0) : 0
      const bonus = d.bonusEdits ?? 0
      const left = Math.max(0, 10 - used)
      if (left <= 3 && bonus <= 0) setEditBanner({ editsLeft: left, bonus })
    }
  }).catch(() => {})
}, [status])

useEffect(() => {
  if (!editBanner || editBanner.editsLeft > 0) return
  const tick = () => {
    const now = new Date()
    const reset = new Date(now)
    reset.setHours(8, 0, 0, 0)
    if (now >= reset) reset.setDate(reset.getDate() + 1)
    const diff = reset.getTime() - now.getTime()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    setCountdown(`${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`)
  }
  tick()
  const iv = setInterval(tick, 1000)
  return () => clearInterval(iv)
}, [editBanner])

const cm = classicMode

return(

<main
className={`min-h-screen relative overflow-hidden
${classicMode ? "text-black" : "text-white"}
`}
>

{!classicMode && <BackgroundPremium />}
{classicMode && <BackgroundClassic />}

<FloatingIcons/>

<Navbar
lang={lang}
setLang={setLang}
classicMode={classicMode}
setClassicMode={setClassicMode}
/>

{editBanner && (
<div className="fixed top-12 left-0 right-0 z-40 flex justify-center px-4 pt-2 pointer-events-none">
<div className={`max-w-4xl w-full p-4 rounded-2xl border text-center pointer-events-auto backdrop-blur-md ${editBanner.editsLeft <= 0 ? (cm ? "bg-red-100/40 border-red-300/50" : "bg-red-500/5 border-red-400/15") : (cm ? "bg-amber-100/40 border-amber-300/50" : "bg-amber-500/5 border-amber-400/15")}`}>
<p className={`text-sm font-bold ${editBanner.editsLeft <= 0 ? (cm ? "text-red-700" : "text-red-400") : (cm ? "text-amber-700" : "text-amber-400")}`}>{editBanner.editsLeft <= 0 ? "Daily edit limit reached (0/10)" : `${editBanner.editsLeft} edit${editBanner.editsLeft > 1 ? "s" : ""} remaining today (${editBanner.editsLeft}/10)`}</p>
<p className={`text-xs mt-1 ${editBanner.editsLeft <= 0 ? (cm ? "text-red-500" : "text-red-400/60") : (cm ? "text-amber-500" : "text-amber-400/60")}`}>{editBanner.editsLeft <= 0 ? "Upgrade or watch ads to continue editing." : "Running low on free edits."}</p>
{editBanner.editsLeft <= 0 && countdown && (
<p className={`text-xs mt-2 font-mono ${cm ? "text-red-400" : "text-red-300/50"}`}>⏳ Resets in {countdown} (at 08:00)</p>
)}
{editBanner.editsLeft <= 0 && (
<div className="flex flex-col sm:flex-row justify-center gap-2 mt-3">
<Link href="/dashboard#upgrade" className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-105 active:scale-95 transition-all">⭐ Get Premium</Link>
<Link href="/dashboard#ads" className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:scale-105 active:scale-95 transition-all">🎬 Watch 2 Ads — +1 Edit</Link>
</div>
)}
</div>
</div>
)}

<Hero
lang={lang}
classicMode={classicMode}
compact={!!editBanner}
/>

{/* SECTIUNI NOI */}

<WhyPlatform lang={lang} classicMode={classicMode}/>

<FeaturesOverview lang={lang} classicMode={classicMode}/>

<FileTypes lang={lang} classicMode={classicMode}/>

<Reviews lang={lang} classicMode={classicMode}/>

<Footer lang={lang} classicMode={classicMode}/>

<ScrollTop lang={lang} classicMode={classicMode}/>

</main>

)

}



function BackgroundPremium(){

return(

<div className="-z-10 absolute inset-0">

<div className="absolute inset-0 bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e]" />

<div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />

<div className="absolute -left-40 top-20 h-[500px] w-[700px] rounded-full bg-blue-500/20 blur-[160px]" />

<div className="absolute right-[-150px] top-40 h-[500px] w-[600px] rounded-full bg-purple-500/20 blur-[160px]" />

<div className="absolute left-[20%] top-[60%] h-[400px] w-[500px] rounded-full bg-emerald-500/10 blur-[140px]" />

<div className="absolute right-[10%] top-[80%] h-[400px] w-[500px] rounded-full bg-pink-500/10 blur-[140px]" />

</div>

)

}



function BackgroundClassic(){

return(

<div className="-z-10 absolute inset-0">

<div className="absolute inset-0 bg-gradient-to-br from-[#f1f5f9] via-[#e2e8f0] to-[#cbd5f5]" />

<div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />

</div>

)

}