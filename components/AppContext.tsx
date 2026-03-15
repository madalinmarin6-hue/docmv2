"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type AppContextType = {
  lang: string
  setLang: (v: string) => void
  classicMode: boolean
  setClassicMode: (v: boolean) => void
}

const AppContext = createContext<AppContextType>({
  lang: "EN",
  setLang: () => {},
  classicMode: false,
  setClassicMode: () => {},
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState("EN")
  const [classicMode, setClassicMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedLang = localStorage.getItem("docm-lang")
    const savedMode = localStorage.getItem("docm-classic")
    if (savedLang === "RO" || savedLang === "EN") setLang(savedLang)
    if (savedMode === "true") setClassicMode(true)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) localStorage.setItem("docm-lang", lang)
  }, [lang, mounted])

  useEffect(() => {
    if (mounted) localStorage.setItem("docm-classic", String(classicMode))
  }, [classicMode, mounted])

  return (
    <AppContext.Provider value={{ lang, setLang, classicMode, setClassicMode }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
