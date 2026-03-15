"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useApp } from "@/components/AppContext"

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const { classicMode } = useApp()

  useEffect(() => {
    const accepted = localStorage.getItem("docm-cookies-accepted")
    if (!accepted) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem("docm-cookies-accepted", "true")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[9999] p-4 ${classicMode ? "bg-white border-t border-gray-200 shadow-xl" : "bg-[#0a0f2e]/95 backdrop-blur-xl border-t border-white/10"}`}>
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className={`text-sm ${classicMode ? "text-gray-600" : "text-white/60"}`}>
          We use cookies and local storage for authentication, preferences, and analytics.{" "}
          <Link href="/cookies" className={`underline ${classicMode ? "text-blue-600" : "text-blue-400"}`}>Learn more</Link>
        </p>
        <button
          onClick={accept}
          className="px-6 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap"
        >
          Accept Cookies
        </button>
      </div>
    </div>
  )
}
