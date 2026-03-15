"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { useApp } from "@/components/AppContext"

export default function ReportBugPage() {
  const { lang, setLang, classicMode, setClassicMode } = useApp()
  const { status } = useSession()
  const isLoggedIn = status === "authenticated"

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!title.trim() || !description.trim()) {
      setError("Please fill in both fields")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to submit")
      } else {
        setSuccess(true)
        setTitle("")
        setDescription("")
      }
    } catch {
      setError("Something went wrong")
    }
    setSubmitting(false)
  }

  const cm = classicMode

  return (
    <main className={`min-h-screen ${cm ? "bg-gray-50 text-black" : "bg-[#020617] text-white"}`}>
      <Navbar lang={lang} setLang={setLang} classicMode={classicMode} setClassicMode={setClassicMode} />

      <div className="max-w-2xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-10">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 ${cm ? "bg-red-50 border border-red-200" : "bg-red-500/10 border border-red-400/20"}`}>
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44.125 2.104.52 4.136 1.153 6.06M12 3.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
            </svg>
            <span className={`text-xs font-medium ${cm ? "text-red-600" : "text-red-400"}`}>Bug Report</span>
          </div>
          <h1 className={`text-3xl md:text-4xl font-bold ${cm ? "text-gray-800" : "text-white"}`}>
            {lang === "RO" ? "Raportează un Bug" : "Report a Bug"}
          </h1>
          <p className={`mt-3 ${cm ? "text-gray-500" : "text-white/50"}`}>
            {lang === "RO" ? "Ajută-ne să îmbunătățim platforma raportând orice problemă." : "Help us improve the platform by reporting any issues you encounter."}
          </p>
        </div>

        {!isLoggedIn ? (
          <div className={`p-8 rounded-2xl border text-center ${cm ? "bg-white border-gray-200" : "bg-white/5 border-white/10"}`}>
            <svg className={`w-12 h-12 mx-auto mb-4 ${cm ? "text-gray-300" : "text-white/20"}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className={`text-lg font-semibold mb-2 ${cm ? "text-gray-800" : "text-white"}`}>
              {lang === "RO" ? "Autentifică-te pentru a raporta" : "Sign in to report a bug"}
            </p>
            <p className={`text-sm mb-6 ${cm ? "text-gray-500" : "text-white/50"}`}>
              {lang === "RO" ? "Ai nevoie de un cont pentru a trimite un raport." : "You need an account to submit a bug report."}
            </p>
            <Link href="/auth/login" className="inline-block px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 transition-all">
              {lang === "RO" ? "Conectează-te" : "Sign In"}
            </Link>
          </div>
        ) : success ? (
          <div className={`p-8 rounded-2xl border text-center ${cm ? "bg-white border-emerald-200" : "bg-emerald-500/5 border-emerald-400/20"}`}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className={`text-lg font-semibold mb-2 ${cm ? "text-gray-800" : "text-white"}`}>
              {lang === "RO" ? "Raport trimis cu succes!" : "Bug report submitted!"}
            </p>
            <p className={`text-sm mb-6 ${cm ? "text-gray-500" : "text-white/50"}`}>
              {lang === "RO" ? "Mulțumim! Vom analiza problema cât mai curând." : "Thank you! We'll look into the issue as soon as possible."}
            </p>
            <button onClick={() => setSuccess(false)} className={`px-6 py-2.5 rounded-xl text-sm font-medium transition ${cm ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
              {lang === "RO" ? "Trimite alt raport" : "Submit another report"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={`p-8 rounded-2xl border space-y-5 ${cm ? "bg-white border-gray-200" : "bg-white/5 border-white/10"}`}>
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/20 text-red-300 text-sm text-center">{error}</div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${cm ? "text-gray-700" : "text-white/60"}`}>
                {lang === "RO" ? "Titlu" : "Title"}
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={200}
                required
                className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition ${cm ? "bg-gray-50 border border-gray-200 text-gray-800 focus:border-blue-400" : "bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-purple-400/50"}`}
                placeholder={lang === "RO" ? "Descrie pe scurt problema..." : "Brief description of the issue..."}
              />
              <p className={`text-xs mt-1 ${cm ? "text-gray-400" : "text-white/30"}`}>{title.length}/200</p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${cm ? "text-gray-700" : "text-white/60"}`}>
                {lang === "RO" ? "Descriere detaliată" : "Detailed Description"}
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={2000}
                required
                rows={6}
                className={`w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition ${cm ? "bg-gray-50 border border-gray-200 text-gray-800 focus:border-blue-400" : "bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-purple-400/50"}`}
                placeholder={lang === "RO" ? "Descrie pașii pentru a reproduce problema, ce ai așteptat și ce s-a întâmplat..." : "Describe the steps to reproduce, what you expected, and what happened..."}
              />
              <p className={`text-xs mt-1 ${cm ? "text-gray-400" : "text-white/30"}`}>{description.length}/2000</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-500 to-orange-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
            >
              {submitting ? (lang === "RO" ? "Se trimite..." : "Submitting...") : (lang === "RO" ? "Trimite Raportul" : "Submit Bug Report")}
            </button>
          </form>
        )}
      </div>

      <Footer lang={lang} classicMode={classicMode} />
    </main>
  )
}
