"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace("/") }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#0b1333] to-[#020617]">
      <div className="w-10 h-10 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin" />
    </div>
  )
}
