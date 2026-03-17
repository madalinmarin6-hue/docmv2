"use client"

import { useState, useEffect, useRef } from "react"

type Props = {
lang: string
classicMode: boolean
}

type Review = {
name: string
stars: number
en: string
ro: string
time?: string
}

const allReviews: Review[] = [
{ name: "Michael R.", stars: 5, en: "This platform saved me hours of work. Converting and editing documents is incredibly fast and simple.", ro: "Această platformă mi-a economisit ore întregi de muncă. Conversia și editarea documentelor este foarte rapidă și simplă." },
{ name: "Andreea P.", stars: 5, en: "I love the clean interface and the fact that everything works directly in the browser.", ro: "Îmi place interfața simplă și faptul că totul funcționează direct în browser." },
{ name: "Lucas M.", stars: 4, en: "Very useful tool for everyday office tasks. The conversion quality is excellent.", ro: "Un instrument foarte util pentru sarcinile zilnice de birou. Calitatea conversiei este excelentă." },
{ name: "Daniel K.", stars: 5, en: "One of the best online document editors I have used.", ro: "Unul dintre cele mai bune editoare online de documente pe care le-am folosit." },
{ name: "Maria S.", stars: 5, en: "The platform works perfectly on both desktop and mobile devices.", ro: "Platforma funcționează perfect atât pe desktop cât și pe mobil." },
{ name: "John W.", stars: 4, en: "Simple, fast and reliable document editing tool.", ro: "Un instrument simplu, rapid și de încredere pentru editarea documentelor." },
{ name: "Alex T.", stars: 5, en: "Uploading and editing files takes only seconds.", ro: "Încărcarea și editarea fișierelor durează doar câteva secunde." },
{ name: "Elena D.", stars: 4, en: "A very helpful platform for working with PDF files.", ro: "O platformă foarte utilă pentru lucrul cu fișiere PDF." },
{ name: "Sophie L.", stars: 5, en: "Perfect for students and professionals. Converted my thesis in seconds!", ro: "Perfect pentru studenți și profesioniști. Mi-a convertit teza în secunde!" },
{ name: "Radu C.", stars: 5, en: "The Excel editor is surprisingly powerful for a browser tool.", ro: "Editorul Excel este surprinzător de puternic pentru un instrument din browser." },
{ name: "James B.", stars: 4, en: "Great tool for converting presentations. Quick and reliable.", ro: "Un instrument excelent pentru convertirea prezentărilor. Rapid și fiabil." },
{ name: "Ioana M.", stars: 5, en: "Finally a document platform that actually works without installing anything.", ro: "În sfârșit o platformă de documente care funcționează fără a instala nimic." },
{ name: "Thomas H.", stars: 5, en: "The PDF editor is brilliant. Adding text annotations is so easy.", ro: "Editorul PDF este genial. Adăugarea adnotărilor text este atât de ușoară." },
{ name: "Ana V.", stars: 4, en: "Very intuitive interface. My team uses it daily for document work.", ro: "Interfață foarte intuitivă. Echipa mea o folosește zilnic pentru documente." },
{ name: "Chris P.", stars: 5, en: "Replaced three different tools with just DocM. Incredible value.", ro: "Am înlocuit trei instrumente diferite doar cu DocM. Valoare incredibilă." },
{ name: "Diana R.", stars: 5, en: "The conversion quality is the best I've seen online. Highly recommended!", ro: "Calitatea conversiei este cea mai bună pe care am văzut-o online. Foarte recomandat!" }
]

const avatarColors = [
"from-blue-500 to-cyan-400",
"from-pink-500 to-rose-400",
"from-green-500 to-emerald-400",
"from-purple-500 to-violet-400",
"from-orange-500 to-amber-400",
"from-teal-500 to-cyan-400",
"from-indigo-500 to-blue-400",
"from-red-500 to-pink-400",
"from-yellow-500 to-orange-400",
"from-rose-500 to-red-400",
"from-cyan-500 to-blue-400",
"from-violet-500 to-purple-400",
"from-lime-500 to-green-400",
"from-fuchsia-500 to-pink-400",
"from-sky-500 to-indigo-400",
"from-amber-500 to-yellow-400"
]

export default function Reviews({ lang, classicMode }: Props){

const [page, setPage] = useState(0)
const [liveReview, setLiveReview] = useState<Review | null>(null)
const [showLive, setShowLive] = useState(false)
const [liveCount, setLiveCount] = useState(0)
const [muteLive, setMuteLive] = useState(false)
const [pinnedReviews, setPinnedReviews] = useState<Review[]>([])

useEffect(() => {
  // Compute liveCount on client only to avoid hydration mismatch
  const launchDate = new Date("2026-01-01")
  const now = new Date()
  const daysSinceLaunch = Math.max(0, Math.floor((now.getTime() - launchDate.getTime()) / 86400000))
  let total = 120
  for (let i = 0; i < daysSinceLaunch; i++) {
    const seed = (i * 7 + 13) % 17
    total += 8 + seed % 7
  }
  setLiveCount(total)
  setMuteLive(localStorage.getItem('docm_mute_reviews') === '1')

  // Fetch pinned reviews from DB
  fetch("/api/reviews?pinned=true")
    .then(r => r.json())
    .then((data: { user_name: string; stars: number; text: string }[]) => {
      if (Array.isArray(data)) {
        setPinnedReviews(data.map(r => ({
          name: r.user_name,
          stars: r.stars,
          en: r.text,
          ro: r.text,
        })))
      }
    })
    .catch(() => {})
}, [])

const combinedReviews = [...pinnedReviews, ...allReviews]
const pageSize = 4
const totalPages = Math.ceil(combinedReviews.length / pageSize)
const visible = combinedReviews.slice(page * pageSize, page * pageSize + pageSize)

// Real-time fake review ticker — sequential, no repeats, less frequent
const liveIdxRef = useRef(0)

useEffect(() => {
const fakeNames = [
"Sarah K.", "Victor N.", "Emma W.", "Cristian A.", "Laura F.",
"Mark D.", "Ioana B.", "Peter S.", "Alina G.", "David R.",
"Tom H.", "Bianca M.", "Robert L.", "Sofia C.", "Matei P.",
"Anna J.", "George T.", "Clara B.", "Florin D.", "Natalia S.",
"Kevin W.", "Raluca A.", "Patrick N.", "Irina V.", "Stefan G."
]
const fakeReviews = {
en: [
"Just converted 50 pages in under a minute!",
"This tool is a lifesaver for my business.",
"PDF editing has never been this easy!",
"Switched from Adobe, never going back.",
"Perfect for my daily workflow!",
"The UI is so clean and modern!",
"Incredible speed, highly recommended!",
"Works perfectly on my tablet too!",
"Best document tool I've found online.",
"My whole team loves DocM now!",
"Converted my thesis to PDF in seconds!",
"The Excel editor is surprisingly good.",
"No more downloading random software.",
"Love how fast the compression is!",
"Replaced 3 tools with just this one.",
"Split a 200-page PDF effortlessly.",
"The OCR feature saved my project!",
"Perfect for remote work collaboration.",
"Finally a free tool that actually works.",
"Word to PDF conversion is flawless.",
"My students love using this platform.",
"Clean design, zero learning curve.",
"Used it for my entire presentation prep.",
"The PowerPoint editor is really handy.",
"Bookmarked this — using it every day now."
],
ro: [
"Tocmai am convertit 50 de pagini în mai puțin de un minut!",
"Acest instrument mi-a salvat afacerea.",
"Editarea PDF nu a fost niciodată atât de ușoară!",
"Am renunțat la Adobe, nu mă mai întorc.",
"Perfect pentru fluxul meu zilnic!",
"Interfața e atât de curată și modernă!",
"Viteză incredibilă, foarte recomandat!",
"Funcționează perfect și pe tableta mea!",
"Cel mai bun instrument online pentru documente.",
"Toată echipa mea adoră DocM acum!",
"Mi-am convertit teza în PDF în câteva secunde!",
"Editorul Excel e surprinzător de bun.",
"Nu mai descarc programe aleatorii.",
"Ador cât de rapidă e compresia!",
"Am înlocuit 3 instrumente cu doar acesta.",
"Am separat un PDF de 200 de pagini fără efort.",
"Funcția OCR mi-a salvat proiectul!",
"Perfect pentru colaborarea la distanță.",
"În sfârșit un instrument gratuit care chiar funcționează.",
"Conversia Word în PDF e impecabilă.",
"Studenții mei adoră această platformă.",
"Design curat, fără curbă de învățare.",
"L-am folosit pentru toată pregătirea prezentării.",
"Editorul PowerPoint e foarte practic.",
"L-am salvat în favorite — îl folosesc zilnic acum."
]
}

const total = fakeReviews.en.length

const interval = setInterval(() => {
const rIdx = liveIdxRef.current % total
const nIdx = (liveIdxRef.current * 7 + 3) % fakeNames.length
liveIdxRef.current++
const minutes = Math.floor(Math.random() * 8) + 1

setLiveReview({
name: fakeNames[nIdx],
stars: Math.random() > 0.15 ? 5 : 4,
en: fakeReviews.en[rIdx],
ro: fakeReviews.ro[rIdx],
time: `${minutes}m ago`
})
setShowLive(true)
setLiveCount(prev => prev + 1)

setTimeout(() => setShowLive(false), 5000)
}, 90000)

return () => clearInterval(interval)
}, [])

function next(){
setPage(prev => (prev + 1) % totalPages)
}

function toggleMute(){
const newVal = !muteLive
setMuteLive(newVal)
localStorage.setItem('docm_mute_reviews', newVal ? '1' : '0')
if (newVal) setShowLive(false)
}

const text = {
EN: { title: "What our users say", btn: "Next Reviews", live: "Live reviews", total: "Total reviews" },
RO: { title: "Ce spun utilizatorii noștri", btn: "Mai multe recenzii", live: "Recenzii live", total: "Total recenzii" }
}

const t = text[lang as "EN" | "RO"]

return(

<section id="reviews" className="max-w-6xl mx-auto mt-40 px-6">

<div className="text-center mb-12">

<p className={`text-sm font-semibold tracking-widest uppercase mb-3 ${classicMode ? "text-emerald-600" : "text-emerald-400"}`}>
{lang === "RO" ? "Recenzii" : "Reviews"}
</p>

<h2 className={`text-4xl md:text-5xl font-bold ${classicMode ? "text-gray-800" : "text-white"}`}>
{t.title}
</h2>

<div className="w-20 h-1 mx-auto mt-5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />

{/* LIVE COUNTER */}
<div className="flex items-center justify-center gap-6 mt-6">
<div className="flex items-center gap-2">
<span className="relative flex h-2.5 w-2.5">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
</span>
<span className={`text-xs font-medium ${classicMode ? "text-gray-500" : "text-white/50"}`}>{t.live}</span>
</div>
<div className={`text-xs ${classicMode ? "text-gray-400" : "text-white/30"}`}>
{t.total}: <span className="font-bold text-emerald-400">{liveCount.toLocaleString('en-US')}</span>
</div>
</div>

</div>

{/* LIVE REVIEW TOAST */}
<div className={`fixed bottom-24 right-6 z-40 max-w-sm transition-all duration-500 ${showLive && liveReview && !muteLive ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0"}`}>
<div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${classicMode ? "bg-white border-gray-200" : "bg-[#0b1333]/95 border-white/10"}`}>
<div className="flex items-center gap-3 mb-2">
<div className="relative">
<div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColors[(liveReview?.name.charCodeAt(0) || 0) % avatarColors.length]} flex items-center justify-center text-white font-bold text-xs`}>
{liveReview?.name.charAt(0)}
</div>
<span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0b1333]" />
</div>
<div className="flex-1">
<p className={`font-semibold text-xs ${classicMode ? "text-gray-800" : "text-white"}`}>{liveReview?.name}</p>
<div className="flex items-center gap-2">
<div className="flex gap-0.5">
{Array.from({ length: 5 }).map((_, s) => (
<span key={s} className={`text-[9px] ${s < (liveReview?.stars || 5) ? "text-yellow-400" : "text-gray-600"}`}>★</span>
))}
</div>
<span className={`text-[10px] ${classicMode ? "text-gray-400" : "text-white/30"}`}>{liveReview?.time}</span>
</div>
</div>
</div>
<p className={`text-xs leading-relaxed ${classicMode ? "text-gray-600" : "text-white/60"}`}>
&ldquo;{lang === "RO" ? liveReview?.ro : liveReview?.en}&rdquo;
</p>
</div>
</div>

{/* REVIEW CARDS */}
<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[320px]">

{visible.map((r, i) => {

const globalIndex = page * pageSize + i

return (

<div
key={`${page}-${i}`}
className={`group relative p-7 rounded-2xl border backdrop-blur-sm transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 animate-fade-in-up
${classicMode
? "bg-white/80 border-gray-200 shadow-md hover:shadow-xl"
: "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"}
`}
style={{ animationDelay: `${i * 100}ms` }}
>

<div className="flex items-center gap-3 mb-4">

<div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[globalIndex % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
{r.name.charAt(0)}
</div>

<div>
<p className={`font-semibold text-sm ${classicMode ? "text-gray-800" : "text-white"}`}>
{r.name}
</p>
<div className="flex gap-0.5">
{Array.from({ length: 5 }).map((_, s) => (
<span key={s} className={`text-xs ${s < r.stars ? "text-yellow-400" : "text-gray-600"}`}>★</span>
))}
</div>
</div>

</div>

<div className={`w-8 h-8 mb-3 ${classicMode ? "text-gray-300" : "text-white/15"}`}>
<svg fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
</div>

<p className={`text-sm leading-relaxed italic ${classicMode ? "text-gray-600" : "text-white/70"}`}>
&ldquo;{lang === "RO" ? r.ro : r.en}&rdquo;
</p>

</div>

)

})}

</div>

{/* PAGINATION */}
<div className="flex justify-center mt-10 gap-4 items-center">

<div className="flex gap-2">
{Array.from({ length: totalPages }).map((_, i) => (
<button
key={i}
onClick={() => setPage(i)}
className={`w-2.5 h-2.5 rounded-full transition-all duration-300
${i === page
? "bg-emerald-500 w-8"
: classicMode ? "bg-gray-300 hover:bg-gray-400" : "bg-white/20 hover:bg-white/40"}
`}
/>
))}
</div>

<button
onClick={next}
className="group px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300
bg-gradient-to-r from-emerald-500 to-teal-500 text-white
hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
>
{t.btn} <span className="inline-block group-hover:translate-x-1 transition-transform">&rarr;</span>
</button>

</div>

</section>

)

}