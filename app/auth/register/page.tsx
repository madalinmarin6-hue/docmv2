"use client"

import { useState, useRef, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#0b1333] to-[#020617]">
        <div className="w-10 h-10 border-4 border-white/20 border-t-purple-400 rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ref = searchParams.get("ref") || ""
  const [name, setName] = useState("")
  const [nickname, setNickname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const termsRef = useRef<HTMLDivElement>(null)

  const handleTermsScroll = useCallback(() => {
    const el = termsRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolledToBottom(true)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!acceptTerms) {
      setError("You must accept the Terms and Conditions")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter")
      return
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      setError("Password must contain at least one special character")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nickname, email, password, ref }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed")
        setLoading(false)
        return
      }

      router.push("/auth/login?registered=true")
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#020617] via-[#0b1333] to-[#020617]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img src="/logo.png" className="w-32 h-auto object-contain mx-auto" alt="DocM" />
          </Link>
          <p className="text-white/50 mt-2 text-sm">Create your free account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/20 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">Nickname</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/30 transition"
                placeholder="cooluser123"
              />
            </div>
            <p className="text-[10px] text-white/30 mt-1">Letters, numbers, underscores, dots, hyphens. Min 3 chars.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">Full Name</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/30 transition"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">Email</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/30 transition"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">Password</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/30 transition"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                {showPw ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className={password.length >= 8 ? "text-emerald-400" : "text-white/30"}>✓ 8+ characters</span>
                  <span className={/[A-Z]/.test(password) ? "text-emerald-400" : "text-white/30"}>✓ Uppercase</span>
                  <span className={/[^a-zA-Z0-9]/.test(password) ? "text-emerald-400" : "text-white/30"}>✓ Special char</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">Confirm Password</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              <input
                type={showConfirmPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/30 transition"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                {showConfirmPw ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* Accept Terms — must scroll through first */}
          <div className="space-y-2">
            <button type="button" onClick={() => setShowTerms(true)}
              className={`w-full py-2.5 rounded-xl text-xs font-medium border transition ${acceptTerms ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-400" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"}`}>
              {acceptTerms ? "Terms & Conditions accepted" : "Read & Accept Terms and Conditions"}
            </button>
            {!acceptTerms && <p className="text-[10px] text-white/30 text-center">You must read and scroll through the terms before creating an account</p>}
          </div>

          {/* Terms Modal */}
          {showTerms && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="w-full max-w-lg bg-[#0d1340] border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Terms & Conditions</h3>
                  <button onClick={() => setShowTerms(false)} className="text-white/40 hover:text-white/70 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div ref={termsRef} onScroll={handleTermsScroll} className="flex-1 overflow-y-auto px-6 py-4 text-xs text-white/60 leading-relaxed space-y-4">
                  <p className="text-white/40">Last updated: March 11, 2026</p>
                  <div>
                    <h4 className="text-white/80 font-semibold mb-1">1. Acceptance of Terms</h4>
                    <p>By accessing and using DocM (&quot;the Service&quot;), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Service. These terms apply to all visitors, users, and others who access or use the Service.</p>
                  </div>
                  <div>
                    <h4 className="text-white/80 font-semibold mb-1">2. Description of Service</h4>
                    <p>DocM provides online document editing, conversion, and management tools including but not limited to: PDF editing, creation, splitting, and compression; document conversion between formats; online editors for Word, Excel, PowerPoint, TXT, and CSV files; background removal from images; file management and storage for registered users.</p>
                  </div>
                  <div>
                    <h4 className="text-white/80 font-semibold mb-1">3. User Accounts</h4>
                    <p>To access certain features of the Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information when creating your account and to keep this information up to date.</p>
                  </div>
                  <div>
                    <h4 className="text-white/80 font-semibold mb-1">4. Acceptable Use</h4>
                    <p>You agree not to: upload, convert, or process any content that is illegal, harmful, threatening, abusive, or otherwise objectionable; use the Service to infringe on the intellectual property rights of others; attempt to gain unauthorized access to any part of the Service; use automated tools or bots to access the Service excessively; distribute malware or harmful code through the Service.</p>
                  </div>
                  <div>
                    <h4 className="text-white/80 font-semibold mb-1">5. File Processing & Data Handling</h4>
                    <p>Files uploaded for conversion or editing are processed on our servers. We do not permanently store your files beyond the processing duration unless you are a registered user who explicitly saves files to their account. Temporary files are automatically deleted after processing is complete.</p>
                  </div>
                  <div>
                    <h4 className="text-white/80 font-semibold mb-1">6. Intellectual Property</h4>
                    <p>The Service and its original content, features, and functionality are owned by DocM and are protected by international copyright, trademark, and other intellectual property laws. You retain ownership of any content you upload or create using the Service.</p>
                  </div>
                  <div>
                    <h4 className="text-white/80 font-semibold mb-1">7. Free and Premium Plans</h4>
                    <p>DocM offers both free and premium plans. Free users may have limitations on file sizes, number of conversions, or available features. Premium plan pricing and features are described on our website and may be updated from time to time.</p>
                  </div>
                  <div>
                    <h4 className="text-white/80 font-semibold mb-1">8. Limitation of Liability</h4>
                    <p>DocM is provided &quot;as is&quot; without any warranties, expressed or implied. We do not guarantee that the Service will be uninterrupted, error-free, or that converted files will be 100% identical to the originals. In no event shall DocM be liable for any indirect, incidental, special, or consequential damages.</p>
                  </div>
                  <div>
                    <h4 className="text-white/80 font-semibold mb-1">9. Termination</h4>
                    <p>We reserve the right to terminate or suspend your account and access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users of the Service, us, or third parties.</p>
                  </div>
                  <div>
                    <h4 className="text-white/80 font-semibold mb-1">10. Changes to Terms</h4>
                    <p>We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes are posted constitutes acceptance of the modified terms.</p>
                  </div>
                  <div>
                    <h4 className="text-white/80 font-semibold mb-1">11. Cookie & Privacy Policy</h4>
                    <p>By using DocM, you also agree to our Cookie Policy and Privacy Policy. We use essential cookies for authentication and preferences, and analytics cookies to improve the platform. See our full Cookie Policy and Privacy Policy pages for details.</p>
                  </div>
                  <div>
                    <h4 className="text-white/80 font-semibold mb-1">12. Contact</h4>
                    <p>If you have any questions about these Terms, please contact us through our Help & Contact page or email support@docm.app.</p>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3">
                  {!scrolledToBottom && <p className="text-[10px] text-amber-400/70 flex-1">Scroll to the bottom to accept</p>}
                  {scrolledToBottom && <p className="text-[10px] text-emerald-400/70 flex-1">You have read the terms</p>}
                  <button onClick={() => setShowTerms(false)} className="px-4 py-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition">Cancel</button>
                  <button disabled={!scrolledToBottom} onClick={() => { setAcceptTerms(true); setShowTerms(false) }}
                    className="px-6 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    I Accept
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !acceptTerms}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-white/40">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-medium transition">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
