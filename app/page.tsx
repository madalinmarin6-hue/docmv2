"use client"

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

<Hero
lang={lang}
classicMode={classicMode}
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