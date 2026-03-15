"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ContactPage() {
  const router = useRouter()
  useEffect(() => { router.replace("/help") }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#0b1333] to-[#020617]">
      <div className="w-10 h-10 border-4 border-white/20 border-t-purple-400 rounded-full animate-spin" />
    </div>
  )
}
