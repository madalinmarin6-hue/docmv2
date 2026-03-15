"use client"

import { useApp } from "@/components/AppContext"

export default function LangToggle() {
  const { lang, setLang } = useApp()

  return (
    <div className="flex rounded-lg overflow-hidden text-xs font-medium bg-white/5 border border-white/10">
      <button
        onClick={() => setLang("EN")}
        className={`px-2.5 py-1 transition ${
          lang === "EN" ? "bg-blue-500/30 text-blue-300" : "text-white/40 hover:bg-white/5"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang("RO")}
        className={`px-2.5 py-1 transition ${
          lang === "RO" ? "bg-blue-500/30 text-blue-300" : "text-white/40 hover:bg-white/5"
        }`}
      >
        RO
      </button>
    </div>
  )
}
