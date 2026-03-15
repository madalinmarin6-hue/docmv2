"use client"

import { useState, useEffect } from "react"

type Props = { lang: string; classicMode: boolean }

const names = ["Alex", "Maria", "Andrei", "Elena", "Dan", "Ioana", "Cristian", "Ana", "Mihai", "Laura", "Stefan", "Catalina", "George", "Diana", "Radu", "Bianca", "Victor", "Simona", "Paul", "Monica"]
const actions = {
  EN: ["converted a PDF to Word", "compressed a PDF", "created a presentation", "converted Excel to PDF", "edited a PDF", "split a document", "converted an image to PDF", "created a Word document"],
  RO: ["a convertit un PDF in Word", "a comprimat un PDF", "a creat o prezentare", "a convertit Excel in PDF", "a editat un PDF", "a separat un document", "a convertit o imagine in PDF", "a creat un document Word"],
}
const cities = ["Bucharest", "Cluj", "Iasi", "Timisoara", "London", "Berlin", "Paris", "Madrid", "Rome", "Vienna", "Warsaw", "Prague", "Budapest", "Amsterdam", "Brussels"]

const txt = {
  EN: {
    liveNow: "Live now",
    usersOnline: "users online",
    docsToday: "documents today",
    limitedTitle: "Limited Free Access",
    limitedDesc: "Free tools available for a limited time",
    hours: "h", minutes: "m", seconds: "s",
    trustedBy: "Trusted by 150,000+ users worldwide",
    rating: "4.9/5 average rating",
    secure: "256-bit SSL encrypted",
    noInstall: "No installation required",
  },
  RO: {
    liveNow: "Live acum",
    usersOnline: "utilizatori online",
    docsToday: "documente azi",
    limitedTitle: "Acces Gratuit Limitat",
    limitedDesc: "Instrumente gratuite disponibile pentru o perioada limitata",
    hours: "h", minutes: "m", seconds: "s",
    trustedBy: "De incredere pentru 150.000+ utilizatori",
    rating: "4.9/5 rating mediu",
    secure: "Criptat SSL 256-bit",
    noInstall: "Fara instalare necesara",
  },
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default function Fomo({ lang, classicMode }: Props) {
  const c = txt[lang as "EN" | "RO"] || txt.EN
  const cm = classicMode
  const actList = actions[lang as "EN" | "RO"] || actions.EN

  // Live counters
  const [usersOnline, setUsersOnline] = useState(0)
  const [docsToday, setDocsToday] = useState(0)

  // Toast notification
  const [toast, setToast] = useState<{ name: string; action: string; city: string; ago: string } | null>(null)
  const [showToast, setShowToast] = useState(false)

  // Countdown (resets every 24h from midnight)
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 })

  useEffect(() => {
    setUsersOnline(randomBetween(340, 890))
    setDocsToday(randomBetween(12000, 48000))

    const statsInterval = setInterval(() => {
      setUsersOnline(prev => prev + randomBetween(-5, 8))
      setDocsToday(prev => prev + randomBetween(1, 15))
    }, 3000)

    return () => clearInterval(statsInterval)
  }, [])

  // Toast popup every 8-15s
  useEffect(() => {
    const showRandomToast = () => {
      const name = names[randomBetween(0, names.length - 1)]
      const action = actList[randomBetween(0, actList.length - 1)]
      const city = cities[randomBetween(0, cities.length - 1)]
      const ago = `${randomBetween(1, 45)}s`
      setToast({ name, action, city, ago })
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)
    }

    const interval = setInterval(showRandomToast, randomBetween(8000, 15000))
    const first = setTimeout(showRandomToast, 3000)
    return () => { clearInterval(interval); clearTimeout(first) }
  }, [actList])

  // Countdown to midnight
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown({ h, m, s })
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* LIVE STATS BAR */}
      <section className="py-6">
        <div className="max-w-5xl mx-auto px-6">
          <div className={`rounded-2xl p-4 flex flex-wrap items-center justify-center gap-6 md:gap-10 ${cm ? "bg-gray-50 border border-gray-200" : "bg-white/5 border border-white/10 backdrop-blur-sm"}`}>
            {/* Live dot */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className={`text-xs font-semibold ${cm ? "text-emerald-600" : "text-emerald-400"}`}>{c.liveNow}</span>
            </div>
            {/* Users online */}
            <div className="text-center">
              <p className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{usersOnline.toLocaleString('en-US')}</p>
              <p className={`text-[10px] ${cm ? "text-gray-400" : "text-white/40"}`}>{c.usersOnline}</p>
            </div>
            {/* Docs today */}
            <div className="text-center">
              <p className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{docsToday.toLocaleString('en-US')}</p>
              <p className={`text-[10px] ${cm ? "text-gray-400" : "text-white/40"}`}>{c.docsToday}</p>
            </div>
            {/* Countdown */}
            <div className="flex items-center gap-1">
              <div className={`px-2 py-1 rounded-lg text-center ${cm ? "bg-gray-100" : "bg-white/5"}`}>
                <p className={`text-sm font-bold ${cm ? "text-gray-900" : "text-white"}`}>{String(countdown.h).padStart(2, "0")}</p>
                <p className={`text-[8px] ${cm ? "text-gray-400" : "text-white/30"}`}>{c.hours}</p>
              </div>
              <span className={`text-xs font-bold ${cm ? "text-gray-300" : "text-white/20"}`}>:</span>
              <div className={`px-2 py-1 rounded-lg text-center ${cm ? "bg-gray-100" : "bg-white/5"}`}>
                <p className={`text-sm font-bold ${cm ? "text-gray-900" : "text-white"}`}>{String(countdown.m).padStart(2, "0")}</p>
                <p className={`text-[8px] ${cm ? "text-gray-400" : "text-white/30"}`}>{c.minutes}</p>
              </div>
              <span className={`text-xs font-bold ${cm ? "text-gray-300" : "text-white/20"}`}>:</span>
              <div className={`px-2 py-1 rounded-lg text-center ${cm ? "bg-gray-100" : "bg-white/5"}`}>
                <p className={`text-sm font-bold ${cm ? "text-gray-900" : "text-white"}`}>{String(countdown.s).padStart(2, "0")}</p>
                <p className={`text-[8px] ${cm ? "text-gray-400" : "text-white/30"}`}>{c.seconds}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="py-4">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-4 md:gap-6">
          {[
            { icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z", text: c.trustedBy },
            { icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z", text: c.rating },
            { icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z", text: c.secure },
            { icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3", text: c.noInstall },
          ].map((badge, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${cm ? "bg-gray-50 text-gray-600 border border-gray-200" : "bg-white/5 text-white/50 border border-white/10"}`}>
              <svg className={`w-4 h-4 ${cm ? "text-emerald-500" : "text-emerald-400"}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={badge.icon} /></svg>
              {badge.text}
            </div>
          ))}
        </div>
      </section>

      {/* TOAST NOTIFICATION */}
      <div className={`fixed bottom-6 left-6 z-50 transition-all duration-500 ${showToast ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}`}>
        {toast && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl max-w-xs ${cm ? "bg-white border border-gray-200 text-gray-800" : "bg-[#0d1235] border border-white/10 text-white"}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {toast.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{toast.name} <span className={`font-normal ${cm ? "text-gray-500" : "text-white/50"}`}>{toast.action}</span></p>
              <p className={`text-[10px] ${cm ? "text-gray-400" : "text-white/30"}`}>{toast.city} · {toast.ago} ago</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
