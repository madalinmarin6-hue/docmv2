"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useApp } from "@/components/AppContext"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

const txt = {
  EN: {
    badge: "Reviews",
    title: "What People Think About DocM",
    subtitle: "Read honest reviews from our community or share your own experience.",
    reviewLabel: "Your Review",
    reviewPlaceholder: "Tell us about your experience with DocM...",
    ratingLabel: "Rating",
    submit: "Publish Review",
    submitting: "Publishing...",
    noReviews: "No reviews yet. Be the first!",
    home: "Home",
    avgRating: "Average Rating",
    totalReviews: "Total Reviews",
    thankYou: "Thank you for your review!",
    required: "Please write your review and select a rating.",
    loginRequired: "You must be logged in to leave a review.",
    loginBtn: "Log In to Review",
  },
  RO: {
    badge: "Recenzii",
    title: "Ce cred oamenii despre DocM",
    subtitle: "Citeste recenzii sincere de la comunitatea noastra sau impartaseste-ti propria experienta.",
    reviewLabel: "Recenzia ta",
    reviewPlaceholder: "Spune-ne despre experienta ta cu DocM...",
    ratingLabel: "Nota",
    submit: "Publica Recenzia",
    submitting: "Se publica...",
    noReviews: "Nicio recenzie inca. Fii primul!",
    home: "Acasa",
    avgRating: "Rating mediu",
    totalReviews: "Total recenzii",
    thankYou: "Multumim pentru recenzia ta!",
    required: "Te rugam scrie recenzia si selecteaza o nota.",
    loginRequired: "Trebuie sa fii autentificat pentru a lasa o recenzie.",
    loginBtn: "Autentifica-te",
  },
}

type ReviewItem = {
  id: string
  user_name: string
  text: string
  stars: number
  created_at: string
}

const presetReviews: ReviewItem[] = [
  { id: "p1", user_name: "Michael R.", text: "This platform saved me hours of work. Converting and editing documents is incredibly fast and simple.", stars: 5, created_at: "2026-01-10" },
  { id: "p2", user_name: "Andreea P.", text: "I love the clean interface and the fact that everything works directly in the browser.", stars: 5, created_at: "2026-01-15" },
  { id: "p3", user_name: "Lucas M.", text: "Very useful tool for everyday office tasks. The conversion quality is excellent.", stars: 4, created_at: "2026-01-05" },
  { id: "p4", user_name: "Daniel K.", text: "One of the best online document editors I have used.", stars: 5, created_at: "2026-01-20" },
  { id: "p5", user_name: "Maria S.", text: "The platform works perfectly on both desktop and mobile devices.", stars: 5, created_at: "2026-02-01" },
  { id: "p6", user_name: "Sophie L.", text: "Perfect for students and professionals. Converted my thesis in seconds!", stars: 5, created_at: "2026-02-14" },
  { id: "p7", user_name: "Radu C.", text: "The Excel editor is surprisingly powerful for a browser tool.", stars: 4, created_at: "2026-02-20" },
  { id: "p8", user_name: "Thomas H.", text: "The PDF editor is brilliant. Adding text annotations is so easy.", stars: 5, created_at: "2026-03-01" },
  { id: "p9", user_name: "Ana V.", text: "Very intuitive interface. My team uses it daily for document work.", stars: 4, created_at: "2026-03-05" },
  { id: "p10", user_name: "Chris P.", text: "Replaced three different tools with just DocM. Incredible value.", stars: 5, created_at: "2026-03-08" },
]

const avatarColors = [
  "from-blue-500 to-cyan-400", "from-pink-500 to-rose-400", "from-green-500 to-emerald-400",
  "from-purple-500 to-violet-400", "from-orange-500 to-amber-400", "from-teal-500 to-cyan-400",
  "from-indigo-500 to-blue-400", "from-red-500 to-pink-400", "from-yellow-500 to-orange-400",
  "from-rose-500 to-red-400", "from-cyan-500 to-blue-400", "from-violet-500 to-purple-400",
]

export default function ReviewsPage() {
  const { lang, setLang, classicMode, setClassicMode } = useApp()
  const c = txt[lang as "EN" | "RO"] || txt.EN
  const cm = classicMode
  const { status } = useSession()
  const isLoggedIn = status === "authenticated"

  const [reviews, setReviews] = useState<ReviewItem[]>([...presetReviews])
  const [text, setText] = useState("")
  const [stars, setStars] = useState(0)
  const [hoverStar, setHoverStar] = useState(0)
  const [msg, setMsg] = useState("")
  const [msgType, setMsgType] = useState<"ok" | "err">("ok")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch("/api/reviews")
      .then(r => r.json())
      .then((dbReviews: ReviewItem[]) => {
        if (Array.isArray(dbReviews) && dbReviews.length > 0) {
          setReviews([...presetReviews, ...dbReviews])
        }
      })
      .catch(() => {})
  }, [])

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1) : "0"

  const submit = async () => {
    if (!text.trim() || stars === 0) {
      setMsg(c.required); setMsgType("err"); return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), stars }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error || "Error"); setMsgType("err") }
      else {
        setReviews(prev => [...prev, data])
        setText(""); setStars(0)
        setMsg(c.thankYou); setMsgType("ok")
        setTimeout(() => setMsg(""), 4000)
      }
    } catch { setMsg("Error"); setMsgType("err") }
    setSubmitting(false)
  }

  return (
    <main className={`min-h-screen relative ${cm ? "bg-gradient-to-br from-[#f1f5f9] via-[#e2e8f0] to-[#cbd5f5] text-black" : "bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e] text-white"}`}>

      <Navbar lang={lang} setLang={setLang} classicMode={classicMode} setClassicMode={setClassicMode} />

      {/* HEADER */}
      <section className="max-w-4xl mx-auto px-6 text-center pb-10 pt-20">
        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4 ${cm ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400 border border-emerald-400/20"}`}>
          {c.badge}
        </span>
        <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${cm ? "text-gray-800" : "text-white"}`}>{c.title}</h1>
        <p className={`text-lg max-w-2xl mx-auto ${cm ? "text-gray-500" : "text-white/50"}`}>{c.subtitle}</p>

        {/* STATS */}
        <div className="flex items-center justify-center gap-8 mt-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-3xl font-bold text-yellow-400">{avgRating}</span>
              <span className="text-yellow-400 text-xl">★</span>
            </div>
            <p className={`text-xs ${cm ? "text-gray-400" : "text-white/40"}`}>{c.avgRating}</p>
          </div>
          <div className={`w-px h-10 ${cm ? "bg-gray-200" : "bg-white/10"}`} />
          <div className="text-center">
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{reviews.length}</p>
            <p className={`text-xs ${cm ? "text-gray-400" : "text-white/40"}`}>{c.totalReviews}</p>
          </div>
        </div>
      </section>

      {/* SUBMIT FORM */}
      <section className="max-w-2xl mx-auto px-6 mb-12">
        {isLoggedIn ? (
          <div className={`rounded-2xl p-6 border ${cm ? "bg-white/80 border-gray-200 shadow-lg" : "bg-white/5 border-white/10 backdrop-blur-sm"}`}>
            <div className="mb-4">
              <label className={`text-xs font-medium mb-1 block ${cm ? "text-gray-600" : "text-white/50"}`}>{c.ratingLabel}</label>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setStars(s)} onMouseEnter={() => setHoverStar(s)} onMouseLeave={() => setHoverStar(0)} className="text-2xl transition-transform hover:scale-125">
                    <span className={s <= (hoverStar || stars) ? "text-yellow-400" : cm ? "text-gray-300" : "text-white/20"}>★</span>
                  </button>
                ))}
                {stars > 0 && <span className={`text-xs ml-2 ${cm ? "text-gray-400" : "text-white/40"}`}>{stars}/5</span>}
              </div>
            </div>
            <div className="mb-4">
              <label className={`text-xs font-medium mb-1 block ${cm ? "text-gray-600" : "text-white/50"}`}>{c.reviewLabel}</label>
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder={c.reviewPlaceholder} rows={3}
                className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none transition ${cm ? "bg-gray-50 border border-gray-200 text-gray-800 focus:border-blue-400" : "bg-white/5 border border-white/10 text-white focus:border-blue-400/50"}`} />
            </div>
            {msg && <p className={`text-sm mb-3 ${msgType === "ok" ? "text-emerald-400" : "text-red-400"}`}>{msg}</p>}
            <button onClick={submit} disabled={submitting} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">
              {submitting ? c.submitting : c.submit}
            </button>
          </div>
        ) : (
          <div className={`rounded-2xl p-6 border text-center ${cm ? "bg-white/80 border-gray-200 shadow-lg" : "bg-white/5 border-white/10 backdrop-blur-sm"}`}>
            <p className={`text-sm mb-4 ${cm ? "text-gray-500" : "text-white/50"}`}>{c.loginRequired}</p>
            <Link href="/login" className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 inline-block">
              {c.loginBtn}
            </Link>
          </div>
        )}
      </section>

      {/* ALL REVIEWS */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...reviews].reverse().map((r, i) => (
            <div key={r.id || `${r.user_name}-${i}`}
              className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] hover:-translate-y-1 ${cm ? "bg-white/80 border-gray-200 shadow-md hover:shadow-xl" : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                  {r.user_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${cm ? "text-gray-800" : "text-white"}`}>{r.user_name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} className={`text-xs ${s <= r.stars ? "text-yellow-400" : cm ? "text-gray-300" : "text-white/15"}`}>★</span>
                      ))}
                    </div>
                    <span className={`text-[10px] ${cm ? "text-gray-400" : "text-white/30"}`}>{r.created_at?.split("T")[0]}</span>
                  </div>
                </div>
              </div>
              <p className={`text-sm leading-relaxed ${cm ? "text-gray-600" : "text-white/70"}`}>&ldquo;{r.text}&rdquo;</p>
            </div>
          ))}
        </div>
        {reviews.length === 0 && (
          <p className={`text-center py-20 text-lg ${cm ? "text-gray-400" : "text-white/30"}`}>{c.noReviews}</p>
        )}
      </section>
      <Footer lang={lang} classicMode={classicMode} />
    </main>
  )
}
