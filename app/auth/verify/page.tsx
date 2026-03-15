"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function VerifyContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      return
    }

    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (res.ok) setStatus("success")
        else setStatus("error")
      })
      .catch(() => setStatus("error"))
  }, [token])

  return (
    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-center space-y-4">
      {status === "loading" && (
        <>
          <div className="w-12 h-12 mx-auto border-4 border-white/20 border-t-blue-400 rounded-full animate-spin" />
          <p className="text-white/60">Verifying your email...</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-white/80 font-medium text-lg">Email Verified!</p>
          <p className="text-white/40 text-sm">Your email has been successfully verified.</p>
          <Link
            href="/auth/login"
            className="inline-block mt-4 px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-105 transition-all"
          >
            Go to Login
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-white/80 font-medium text-lg">Verification Failed</p>
          <p className="text-white/40 text-sm">The verification link is invalid or has expired.</p>
          <Link
            href="/auth/login"
            className="inline-block mt-4 text-sm text-blue-400 hover:text-blue-300 transition"
          >
            Back to Login
          </Link>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#020617] via-[#0b1333] to-[#020617]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img src="/logo.png" className="w-32 h-auto object-contain mx-auto" alt="DocM" />
          </Link>
        </div>
        <Suspense fallback={<div className="text-center text-white/50">Loading...</div>}>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  )
}
