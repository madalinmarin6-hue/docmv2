"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useApp } from "@/components/AppContext"
import Navbar from "@/components/Navbar"

type UserProfile = {
  id: string
  name: string
  email: string
  role: string
  plan: string
  emailVerified: boolean
  createdAt: string
  _count: { files: number }
  dailyEditsUsed?: number
  dailyEditsDate?: string
  bonusEdits?: number
  totalFiles?: number
  cloudEnabled?: boolean
}

const txt = {
  EN: {
    welcome: "Welcome back,",
    tools: "Tools",
    convertor: "Convertor",
    more: "More",
    profile: "Profile Settings",
    signOut: "Sign Out",
    admin: "Admin Panel",
    upgrade: "Upgrade to Premium",
    upgradeDesc: "Unlimited conversions, no ads, priority processing, and access to all tools.",
    upgradeBtn: "Upgrade Now",
    filesProcessed: "Files Processed",
    editsLeft: "Edits Left Today",
    bonusEdits: "Bonus Edits",
    plan: "Current Plan",
    quickConvert: "Quick Convert",
    editProfile: "Edit Profile",
    displayName: "Display Name",
    currentPw: "Current Password",
    newPw: "New Password",
    save: "Save Changes",
    saving: "Saving...",
    changePw: "Change Password (leave blank to keep current)",
    accountInfo: "Account Information",
    email: "Email",
    role: "Role",
    verified: "Email Verified",
    memberSince: "Member Since",
    watchAds: "Watch 2 Ads for +1 Bonus Edit",
    watchAdsDesc: "Get an extra free edit by watching 2 short video ads.",
    watchBtn: "Watch Ads",
    watching: "Watching...",
    adComplete: "Bonus edit granted!",
    inviteFriend: "Invite a Friend",
    inviteDesc: "Share your referral link. When someone signs up and verifies their email, you both get 1 week of free Premium!",
    referralLink: "Your Referral Link",
    copyLink: "Copy Link",
    linkCopied: "Copied!",
    friendsReferred: "Friends Referred",
    verifyEmail: "Verify Your Email",
    verifyEmailDesc: "Verify your email to unlock account upgrades and full platform features.",
    verifyBtn: "Send Verification Email",
    verifyEmailRequired: "Email verification required to upgrade.",
    home: "Home",
    about: "About",
    reviews: "Reviews",
    help: "Help",
    contact: "Contact",
    blog: "Blog",
  },
  RO: {
    welcome: "Bine ai revenit,",
    tools: "Instrumente",
    convertor: "Convertor",
    more: "Mai mult",
    profile: "Setari Profil",
    signOut: "Deconectare",
    admin: "Panou Admin",
    upgrade: "Upgrade la Premium",
    upgradeDesc: "Conversii nelimitate, fara reclame, procesare prioritara si acces la toate instrumentele.",
    upgradeBtn: "Upgrade Acum",
    filesProcessed: "Fisiere Procesate",
    editsLeft: "Editari Ramase Azi",
    bonusEdits: "Editari Bonus",
    plan: "Plan Curent",
    quickConvert: "Conversie Rapida",
    editProfile: "Editeaza Profilul",
    displayName: "Nume Afisat",
    currentPw: "Parola Curenta",
    newPw: "Parola Noua",
    save: "Salveaza",
    saving: "Se salveaza...",
    changePw: "Schimba Parola (lasa gol pentru a pastra)",
    accountInfo: "Informatii Cont",
    email: "Email",
    role: "Rol",
    verified: "Email Verificat",
    memberSince: "Membru Din",
    watchAds: "Priveste 2 Reclame pentru +1 Editare Bonus",
    watchAdsDesc: "Primeste o editare gratuita suplimentara privind 2 reclame scurte.",
    watchBtn: "Priveste Reclame",
    watching: "Se incarca...",
    adComplete: "Editare bonus acordata!",
    inviteFriend: "Invita un Prieten",
    inviteDesc: "Distribuie link-ul tau de referral. Cand cineva se inregistreaza si isi verifica email-ul, amandoi primiti 1 saptamana de Premium gratuit!",
    referralLink: "Link-ul Tau de Referral",
    copyLink: "Copiaza Link",
    linkCopied: "Copiat!",
    friendsReferred: "Prieteni Invitati",
    verifyEmail: "Verifica Email-ul",
    verifyEmailDesc: "Verifica email-ul pentru a debloca upgrade-ul contului si toate functiile platformei.",
    verifyBtn: "Trimite Email de Verificare",
    verifyEmailRequired: "Verificarea email-ului este necesara pentru upgrade.",
    home: "Acasa",
    about: "Despre",
    reviews: "Recenzii",
    help: "Ajutor",
    contact: "Contact",
    blog: "Blog",
  },
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { lang, setLang, classicMode, setClassicMode } = useApp()
  const c = txt[lang as "EN" | "RO"] || txt.EN

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tab, setTab] = useState<"overview" | "profile">("overview")
  const [name, setName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [adWatching, setAdWatching] = useState(false)
  const [adMsg, setAdMsg] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [referralCount, setReferralCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState("")
  const [activity, setActivity] = useState<{
    recentFiles: { id: string; file_name: string; file_type: string; file_size: number; tool_used: string | null; created_at: string }[]
    accessLogs: { page: string; created_at: string }[]
    cloudUsed: number; cloudCount: number; cloudMax: number
    typeBreakdown: Record<string, number>
    toolBreakdown: Record<string, number>
    accountAgeDays: number
  } | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login")
  }, [status, router])

  const fetchProfile = () => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error && data.id) {
          setProfile(data)
          setName(data.name || "")
        }
      })
      .catch(console.error)
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile()
      fetch("/api/user/referral").then(r => r.json()).then(d => {
        if (d.referralCode) setReferralCode(d.referralCode)
        setReferralCount(d.referralCount || 0)
      }).catch(() => {})
      fetch("/api/user/activity").then(r => r.json()).then(d => {
        if (d && !d.error) setActivity(d)
      }).catch(() => {})
    }
  }, [status])

  // Poll for real-time updates
  useEffect(() => {
    if (status !== "authenticated") return
    const interval = setInterval(fetchProfile, 5000)
    return () => clearInterval(interval)
  }, [status])


  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(""); setMessage(""); setSaving(true)
    try {
      const body: Record<string, string> = { name }
      if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword }
      const res = await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) setError(data.error || "Failed to update")
      else { setMessage(lang === "RO" ? "Profil actualizat cu succes" : "Profile updated successfully"); setCurrentPassword(""); setNewPassword(""); fetchProfile() }
    } catch { setError("Something went wrong") }
    setSaving(false)
  }

  async function handleWatchAds() {
    setAdWatching(true); setAdMsg("")
    // Simulate watching 2 ads (2x 3 seconds)
    await new Promise(r => setTimeout(r, 3000))
    await fetch("/api/user/bonus-edit", { method: "POST" })
    await new Promise(r => setTimeout(r, 3000))
    await fetch("/api/user/bonus-edit", { method: "POST" })
    setAdMsg(c.adComplete)
    setAdWatching(false)
    fetchProfile()
    setTimeout(() => setAdMsg(""), 4000)
  }

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#0b1333] to-[#020617]">
        <div className="w-10 h-10 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin" />
      </div>
    )
  }

  const user = session.user as { name?: string; email?: string; role?: string; plan?: string }
  const isOwner = user.role === "owner"
  const isAdmin = user.role === "admin" || isOwner
  const isPremium = user.plan === "premium"
  const isFriend = user.plan === "friend"
  const isUnlimited = isPremium || isFriend || isOwner

  const today = new Date().toISOString().split("T")[0]
  const editsUsed = profile?.dailyEditsDate === today ? (profile?.dailyEditsUsed ?? 0) : 0
  const editsLeft = isUnlimited ? -1 : Math.max(0, 10 - editsUsed)
  const bonusEdits = profile?.bonusEdits ?? 0

  const planBadge = isOwner
    ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border border-red-400/20"
    : isFriend
    ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-400/20"
    : isPremium
    ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-400/20"
    : "bg-white/5 text-white/40 border border-white/10"

  const planLabel = isOwner ? "\ud83d\udc51 Owner" : isFriend ? "\ud83d\udc9a Friend" : isPremium ? "\u2b50 Premium" : "Free Plan"

  const tools = [
    { name: "PDF Editor", href: "/tools/pdf-editor", icon: "P", color: "from-red-500 to-rose-500" },
    { name: "Word Editor", href: "/tools/word-editor", icon: "W", color: "from-blue-500 to-cyan-500" },
    { name: "Excel Editor", href: "/tools/excel-editor", icon: "X", color: "from-green-500 to-emerald-500" },
    { name: "PowerPoint", href: "/tools/powerpoint-editor", icon: "S", color: "from-orange-500 to-amber-500" },
    { name: "TXT Editor", href: "/tools/txt-editor", icon: "T", color: "from-gray-500 to-slate-500" },
    { name: "CSV Editor", href: "/tools/csv-editor", icon: "C", color: "from-teal-500 to-cyan-500" },
    { name: "PDF Creator", href: "/tools/pdf-creator", icon: "+", color: "from-purple-500 to-violet-500" },
    { name: "Split PDF", href: "/tools/split-pdf", icon: "/", color: "from-pink-500 to-rose-500" },
    { name: "Compress", href: "/tools/compress", icon: "Z", color: "from-indigo-500 to-blue-500" },
    { name: "Remove BG", href: "/tools/remove-bg", icon: "B", color: "from-fuchsia-500 to-pink-500" },
    { name: "OCR", href: "/tools/ocr", icon: "O", color: "from-yellow-500 to-orange-500" },
    { name: "PDF Viewer", href: "/tools/pdf-viewer", icon: "V", color: "from-sky-500 to-blue-500" },
    { name: "Word Viewer", href: "/tools/word-viewer", icon: "D", color: "from-blue-400 to-indigo-500" },
    { name: "My Cloud", href: "/cloud", icon: "☁", color: "from-violet-500 to-purple-500" },
  ]

  const conversions = [
    { name: "PDF → Word", href: "/convert/pdf-to-word" },
    { name: "Word → PDF", href: "/convert/word-to-pdf" },
    { name: "PDF → Excel", href: "/convert/pdf-to-excel" },
    { name: "Excel → PDF", href: "/convert/excel-to-pdf" },
    { name: "PDF → PPTX", href: "/convert/pdf-to-pptx" },
    { name: "PPTX → PDF", href: "/convert/pptx-to-pdf" },
    { name: "PDF → JPG", href: "/convert/pdf-to-jpg" },
    { name: "JPG → PDF", href: "/convert/jpg-to-pdf" },
    { name: "PDF → PNG", href: "/convert/pdf-to-png" },
    { name: "PNG → PDF", href: "/convert/png-to-pdf" },
    { name: "PDF → HTML", href: "/convert/pdf-to-html" },
    { name: "HTML → PDF", href: "/convert/html-to-pdf" },
    { name: "PDF → TXT", href: "/convert/pdf-to-txt" },
    { name: "TXT → PDF", href: "/convert/txt-to-pdf" },
    { name: "Word → Excel", href: "/convert/word-to-excel" },
    { name: "Excel → Word", href: "/convert/excel-to-word" },
    { name: "Word → PPTX", href: "/convert/word-to-pptx" },
    { name: "PPTX → Word", href: "/convert/pptx-to-word" },
    { name: "Word → HTML", href: "/convert/word-to-html" },
    { name: "HTML → Word", href: "/convert/html-to-word" },
    { name: "Word → TXT", href: "/convert/word-to-txt" },
    { name: "TXT → Word", href: "/convert/txt-to-word" },
    { name: "Word → JPG", href: "/convert/word-to-jpg" },
    { name: "Word → PNG", href: "/convert/word-to-png" },
    { name: "JPG → Word", href: "/convert/jpg-to-word" },
    { name: "PNG → Word", href: "/convert/png-to-word" },
    { name: "Excel → CSV", href: "/convert/excel-to-csv" },
    { name: "CSV → Excel", href: "/convert/csv-to-excel" },
    { name: "Excel → HTML", href: "/convert/excel-to-html" },
    { name: "HTML → Excel", href: "/convert/html-to-excel" },
    { name: "Excel → TXT", href: "/convert/excel-to-txt" },
    { name: "PPTX → HTML", href: "/convert/pptx-to-html" },
  ]

  const cm = classicMode

  return (
    <div className={`min-h-screen ${cm ? "bg-gray-50" : "bg-gradient-to-br from-[#020617] via-[#0b1333] to-[#020617]"}`}>
      <Navbar lang={lang} setLang={setLang} classicMode={classicMode} setClassicMode={setClassicMode} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pt-20">

        {/* TAB SWITCH */}
        <div className="flex gap-2 mb-8">
          <button onClick={() => setTab("overview")} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "overview" ? cm ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-white/10 text-white border border-white/20" : cm ? "text-gray-500 hover:text-gray-700 border border-transparent" : "text-white/40 hover:text-white/60 border border-transparent"}`}>
            Dashboard
          </button>
          <button onClick={() => setTab("profile")} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "profile" ? cm ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-white/10 text-white border border-white/20" : cm ? "text-gray-500 hover:text-gray-700 border border-transparent" : "text-white/40 hover:text-white/60 border border-transparent"}`}>
            {c.profile}
          </button>
        </div>

        {/* UPGRADE CTA (free users only) */}
        {!isPremium && !isFriend && !isOwner && (
          <section className={`p-6 rounded-2xl mb-8 ${cm ? "bg-amber-50 border border-amber-200" : "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/20"}`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className={`text-xl font-bold ${cm ? "text-gray-900" : "text-white"}`}>{c.upgrade}</h3>
                <p className={`mt-1 text-sm ${cm ? "text-gray-500" : "text-white/50"}`}>{c.upgradeDesc}</p>
                {!profile?.emailVerified && (
                  <p className={`text-xs mt-2 ${cm ? "text-amber-600" : "text-amber-400"}`}>{c.verifyEmailRequired}</p>
                )}
              </div>
              <button disabled={!profile?.emailVerified} className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
                {c.upgradeBtn}
              </button>
            </div>
          </section>
        )}

        {tab === "overview" && (
          <>
            {/* WELCOME */}
            <div className="mb-8">
              <h1 className={`text-3xl font-bold ${cm ? "text-gray-900" : "text-white"}`}>
                {c.welcome} <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{user.name || "User"}</span>
              </h1>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className={`p-5 rounded-2xl ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
                <p className="text-2xl font-bold text-blue-400">{profile?.totalFiles ?? profile?._count?.files ?? 0}</p>
                <p className={`text-xs mt-1 ${cm ? "text-gray-400" : "text-white/40"}`}>{c.filesProcessed}</p>
              </div>
              <div className={`p-5 rounded-2xl ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
                <p className="text-2xl font-bold text-emerald-400">{isUnlimited ? "∞" : `${editsLeft}/10`}</p>
                <p className={`text-xs mt-1 ${cm ? "text-gray-400" : "text-white/40"}`}>{c.editsLeft}</p>
              </div>
              <div className={`p-5 rounded-2xl ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
                <p className="text-2xl font-bold text-purple-400">{isUnlimited ? "∞" : bonusEdits}</p>
                <p className={`text-xs mt-1 ${cm ? "text-gray-400" : "text-white/40"}`}>{c.bonusEdits}</p>
              </div>
              <div className={`p-5 rounded-2xl ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
                <p className={`text-2xl font-bold capitalize ${isOwner ? "text-red-400" : isPremium ? "text-amber-400" : cm ? "text-gray-600" : "text-white/60"}`}>{isOwner ? "Owner" : user.plan}</p>
                <p className={`text-xs mt-1 ${cm ? "text-gray-400" : "text-white/40"}`}>{c.plan}</p>
              </div>
            </div>

            {/* WATCH ADS FOR BONUS (free users only) */}
            {!isUnlimited && (
              <section className={`p-5 rounded-2xl mb-10 flex flex-col sm:flex-row items-center justify-between gap-4 ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
                <div>
                  <h3 className={`text-sm font-semibold ${cm ? "text-gray-900" : "text-white"}`}>{c.watchAds}</h3>
                  <p className={`text-xs mt-0.5 ${cm ? "text-gray-400" : "text-white/40"}`}>{c.watchAdsDesc}</p>
                  {adMsg && <p className="text-xs text-emerald-400 mt-1">{adMsg}</p>}
                </div>
                <button onClick={handleWatchAds} disabled={adWatching} className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap">
                  {adWatching ? c.watching : c.watchBtn}
                </button>
              </section>
            )}

            {/* TOOLS */}
            <section className="mb-12">
              <h2 className={`text-xl font-bold mb-5 ${cm ? "text-gray-900" : "text-white"}`}>{c.tools}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tools.map((tool) => (
                  <Link key={tool.href} href={tool.href}
                    className={`group p-4 rounded-2xl transition-all duration-300 hover:scale-[1.03] text-center ${cm ? "bg-white border border-gray-200 hover:border-gray-300 shadow-sm" : "bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10"}`}>
                    <div className={`w-11 h-11 mx-auto rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform`}>
                      {tool.icon}
                    </div>
                    <p className={`text-xs font-medium ${cm ? "text-gray-700" : "text-white/80"}`}>{tool.name}</p>
                  </Link>
                ))}
              </div>
            </section>

            {/* CLOUD STORAGE USAGE */}
            {activity && (
              <section className="mb-10">
                <h2 className={`text-xl font-bold mb-5 ${cm ? "text-gray-900" : "text-white"}`}>{lang === "RO" ? "Stocare Cloud" : "Cloud Storage"}</h2>
                <div className={`p-5 rounded-2xl ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" /></svg>
                      <span className={`text-sm font-medium ${cm ? "text-gray-700" : "text-white/80"}`}>{activity.cloudCount} {lang === "RO" ? "fi\u0219iere" : "files"}</span>
                    </div>
                    <span className={`text-xs ${cm ? "text-gray-400" : "text-white/40"}`}>
                      {(activity.cloudUsed / 1024 / 1024).toFixed(1)} MB / {(activity.cloudMax / 1024 / 1024).toFixed(0)} MB
                    </span>
                  </div>
                  <div className={`w-full h-3 rounded-full overflow-hidden ${cm ? "bg-gray-100" : "bg-white/10"}`}>
                    <div
                      className={`h-full rounded-full transition-all ${activity.cloudUsed / activity.cloudMax > 0.9 ? "bg-red-500" : activity.cloudUsed / activity.cloudMax > 0.7 ? "bg-amber-500" : "bg-gradient-to-r from-purple-500 to-blue-500"}`}
                      style={{ width: `${Math.min(100, (activity.cloudUsed / activity.cloudMax) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className={`text-[10px] ${cm ? "text-gray-400" : "text-white/30"}`}>{((activity.cloudUsed / activity.cloudMax) * 100).toFixed(1)}% {lang === "RO" ? "utilizat" : "used"}</span>
                    <Link href="/cloud" className="text-[10px] text-purple-400 hover:text-purple-300 transition">{lang === "RO" ? "Gestioneaz\u0103 \u2192" : "Manage \u2192"}</Link>
                  </div>
                </div>
              </section>
            )}

            {/* RECENT FILES + MOST USED TOOLS — side by side */}
            {activity && (
              <section className="grid lg:grid-cols-2 gap-6 mb-10">
                {/* Recent Files */}
                <div className={`p-5 rounded-2xl ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${cm ? "text-gray-900" : "text-white"}`}>{lang === "RO" ? "Fi\u0219iere Recente" : "Recent Files"}</h3>
                  {activity.recentFiles.length > 0 ? (
                    <div className="space-y-2">
                      {activity.recentFiles.slice(0, 6).map(f => (
                        <div key={f.id} className={`flex items-center justify-between p-2.5 rounded-lg ${cm ? "bg-gray-50" : "bg-white/[0.03]"}`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-blue-400 uppercase">{f.file_type?.slice(0, 4)}</span>
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-medium truncate ${cm ? "text-gray-700" : "text-white/80"}`}>{f.file_name}</p>
                              <p className={`text-[10px] ${cm ? "text-gray-400" : "text-white/30"}`}>{f.tool_used || f.file_type} \u2022 {(f.file_size / 1024).toFixed(0)} KB</p>
                            </div>
                          </div>
                          <span className={`text-[10px] flex-shrink-0 ml-2 ${cm ? "text-gray-300" : "text-white/20"}`}>{new Date(f.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-xs text-center py-6 ${cm ? "text-gray-400" : "text-white/30"}`}>{lang === "RO" ? "Niciun fi\u0219ier \u00eenc\u0103" : "No files yet"}</p>
                  )}
                </div>

                {/* Most Used Tools + File Types */}
                <div className="space-y-6">
                  {/* Most Used Tools */}
                  <div className={`p-5 rounded-2xl ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
                    <h3 className={`text-sm font-semibold mb-4 ${cm ? "text-gray-900" : "text-white"}`}>{lang === "RO" ? "Instrumente Folosite" : "Most Used Tools"}</h3>
                    {Object.keys(activity.toolBreakdown).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(activity.toolBreakdown)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5)
                          .map(([tool, count]) => {
                            const max = Math.max(...Object.values(activity.toolBreakdown))
                            return (
                              <div key={tool} className="flex items-center gap-3">
                                <span className={`text-xs w-28 truncate ${cm ? "text-gray-600" : "text-white/60"}`}>{tool}</span>
                                <div className={`flex-1 h-2 rounded-full overflow-hidden ${cm ? "bg-gray-100" : "bg-white/10"}`}>
                                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${(count / max) * 100}%` }} />
                                </div>
                                <span className={`text-[10px] w-6 text-right ${cm ? "text-gray-400" : "text-white/30"}`}>{count}</span>
                              </div>
                            )
                          })}
                      </div>
                    ) : (
                      <p className={`text-xs text-center py-4 ${cm ? "text-gray-400" : "text-white/30"}`}>{lang === "RO" ? "Nicio activitate" : "No activity yet"}</p>
                    )}
                  </div>

                  {/* File Type Breakdown */}
                  <div className={`p-5 rounded-2xl ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
                    <h3 className={`text-sm font-semibold mb-4 ${cm ? "text-gray-900" : "text-white"}`}>{lang === "RO" ? "Tipuri de Fi\u0219iere" : "File Types"}</h3>
                    {Object.keys(activity.typeBreakdown).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(activity.typeBreakdown)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 8)
                          .map(([ext, count]) => (
                            <span key={ext} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${cm ? "bg-gray-50 border border-gray-200 text-gray-600" : "bg-white/[0.04] border border-white/10 text-white/60"}`}>
                              .{ext} <span className={cm ? "text-gray-400" : "text-white/30"}>({count})</span>
                            </span>
                          ))}
                      </div>
                    ) : (
                      <p className={`text-xs text-center py-4 ${cm ? "text-gray-400" : "text-white/30"}`}>{lang === "RO" ? "Nicio activitate" : "No activity yet"}</p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ACCOUNT SUMMARY */}
            {activity && (
              <section className="mb-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-2xl text-center ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
                    <p className="text-2xl font-bold text-cyan-400">{activity.accountAgeDays}</p>
                    <p className={`text-[10px] mt-1 ${cm ? "text-gray-400" : "text-white/40"}`}>{lang === "RO" ? "Zile de la \u00eenregistrare" : "Days since signup"}</p>
                  </div>
                  <div className={`p-4 rounded-2xl text-center ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
                    <p className="text-2xl font-bold text-pink-400">{activity.cloudCount}</p>
                    <p className={`text-[10px] mt-1 ${cm ? "text-gray-400" : "text-white/40"}`}>{lang === "RO" ? "Fi\u0219iere Cloud" : "Cloud Files"}</p>
                  </div>
                  <div className={`p-4 rounded-2xl text-center ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
                    <p className="text-2xl font-bold text-amber-400">{Object.keys(activity.toolBreakdown).length}</p>
                    <p className={`text-[10px] mt-1 ${cm ? "text-gray-400" : "text-white/40"}`}>{lang === "RO" ? "Instrumente folosite" : "Tools Used"}</p>
                  </div>
                  <div className={`p-4 rounded-2xl text-center ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
                    <p className="text-2xl font-bold text-emerald-400">{referralCount}</p>
                    <p className={`text-[10px] mt-1 ${cm ? "text-gray-400" : "text-white/40"}`}>{lang === "RO" ? "Prieteni invita\u021bi" : "Friends Referred"}</p>
                  </div>
                </div>
              </section>
            )}

            {/* CONVERSIONS */}
            <section className="mb-12">
              <h2 className={`text-xl font-bold mb-5 ${cm ? "text-gray-900" : "text-white"}`}>{c.quickConvert}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {conversions.map((cv) => (
                  <Link key={cv.href} href={cv.href}
                    className={`px-4 py-3 rounded-xl transition-all text-center text-sm font-medium ${cm ? "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 shadow-sm" : "bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white/60 hover:text-white"}`}>
                    {cv.name}
                  </Link>
                ))}
              </div>
            </section>

            {/* RECENT ACTIVITY LOG */}
            {activity && activity.accessLogs.length > 0 && (
              <section className="mb-12">
                <h2 className={`text-xl font-bold mb-5 ${cm ? "text-gray-900" : "text-white"}`}>{lang === "RO" ? "Activitate Recent\u0103" : "Recent Activity"}</h2>
                <div className={`p-5 rounded-2xl ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
                  <div className="space-y-2">
                    {activity.accessLogs.slice(0, 8).map((log, i) => (
                      <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg ${cm ? "bg-gray-50" : "bg-white/[0.03]"}`}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <span className={`text-xs ${cm ? "text-gray-700" : "text-white/70"}`}>{log.page}</span>
                        </div>
                        <span className={`text-[10px] ${cm ? "text-gray-300" : "text-white/25"}`}>{new Date(log.created_at).toLocaleString(lang === "RO" ? "ro-RO" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {tab === "profile" && (
          <div className="max-w-2xl mx-auto">
            {/* ACCOUNT INFO */}
            <div className={`p-6 rounded-2xl mb-6 ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
              <h2 className={`text-lg font-semibold mb-4 ${cm ? "text-gray-900" : "text-white"}`}>{c.accountInfo}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className={cm ? "text-gray-400" : "text-white/40"}>{c.email}</p>
                  <p className={`font-medium ${cm ? "text-gray-700" : "text-white/80"}`}>{profile?.email}</p>
                </div>
                <div>
                  <p className={cm ? "text-gray-400" : "text-white/40"}>{c.plan}</p>
                  <p className={`font-medium capitalize ${isOwner ? "text-red-400" : isPremium ? "text-amber-400" : cm ? "text-gray-700" : "text-white/80"}`}>
                    {planLabel}
                  </p>
                </div>
                <div>
                  <p className={cm ? "text-gray-400" : "text-white/40"}>{c.verified}</p>
                  <p className={`font-medium ${profile?.emailVerified ? "text-emerald-400" : "text-red-400"}`}>
                    {profile?.emailVerified ? "✅ Verified" : "❌ Not Verified"}
                  </p>
                </div>
                <div>
                  <p className={cm ? "text-gray-400" : "text-white/40"}>{c.memberSince}</p>
                  <p className={`font-medium ${cm ? "text-gray-700" : "text-white/80"}`}>{profile?.createdAt ? new Date(profile.createdAt).toLocaleString(lang === "RO" ? "ro-RO" : "en-US", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                </div>
                <div>
                  <p className={cm ? "text-gray-400" : "text-white/40"}>{c.filesProcessed}</p>
                  <p className={`font-medium ${cm ? "text-gray-700" : "text-white/80"}`}>{profile?.totalFiles ?? profile?._count?.files ?? 0}</p>
                </div>
              </div>
            </div>

            {/* EMAIL VERIFICATION */}
            {!profile?.emailVerified && (
              <div className={`p-6 rounded-2xl mb-6 ${cm ? "bg-amber-50 border border-amber-200" : "bg-amber-500/5 border border-amber-400/20"}`}>
                <h2 className={`text-lg font-semibold mb-2 ${cm ? "text-gray-900" : "text-white"}`}>{c.verifyEmail}</h2>
                <p className={`text-sm mb-4 ${cm ? "text-gray-500" : "text-white/50"}`}>{c.verifyEmailDesc}</p>
                {verifyMsg && <p className="text-xs text-emerald-400 mb-3">{verifyMsg}</p>}
                <button
                  onClick={async () => {
                    setVerifying(true); setVerifyMsg("")
                    try {
                      const res = await fetch("/api/auth/send-verify", { method: "POST" })
                      const data = await res.json()
                      setVerifyMsg(data.message || data.error || "Check your email")
                    } catch { setVerifyMsg("Failed to send") }
                    setVerifying(false)
                  }}
                  disabled={verifying}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {verifying ? "..." : c.verifyBtn}
                </button>
              </div>
            )}

            {/* INVITE A FRIEND */}
            <div className={`p-6 rounded-2xl mb-6 ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
              <h2 className={`text-lg font-semibold mb-2 ${cm ? "text-gray-900" : "text-white"}`}>{c.inviteFriend}</h2>
              <p className={`text-sm mb-4 ${cm ? "text-gray-500" : "text-white/50"}`}>{c.inviteDesc}</p>
              <div className="flex items-center gap-2 mb-4">
                <input
                  readOnly
                  value={referralCode ? `${typeof window !== "undefined" ? window.location.origin : ""}/auth/register?ref=${referralCode}` : "..."}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-mono ${cm ? "bg-gray-50 border border-gray-200 text-gray-700" : "bg-white/5 border border-white/10 text-white/80"}`}
                />
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/auth/register?ref=${referralCode}`
                    navigator.clipboard.writeText(link)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                >
                  {copied ? c.linkCopied : c.copyLink}
                </button>
              </div>
              <p className={`text-xs ${cm ? "text-gray-400" : "text-white/40"}`}>{c.friendsReferred}: <span className="text-emerald-400 font-bold">{referralCount}</span></p>
            </div>

            {/* CLOUD STORAGE TOGGLE */}
            <div className={`p-6 rounded-2xl mb-6 ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-lg font-semibold ${cm ? "text-gray-900" : "text-white"}`}>{lang === "RO" ? "Stocare Cloud" : "Cloud Storage"}</h2>
                  <p className={`text-xs mt-1 ${cm ? "text-gray-400" : "text-white/40"}`}>{lang === "RO" ? "Activează sau dezactivează stocarea fișierelor în cloud pentru re-editare ulterioară." : "Enable or disable cloud file storage for easier re-editing later."}</p>
                </div>
                <button
                  onClick={async () => {
                    const newVal = !(profile?.cloudEnabled ?? true)
                    await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cloudEnabled: newVal }) })
                    fetchProfile()
                  }}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    (profile?.cloudEnabled ?? true) ? "bg-emerald-500" : "bg-white/20"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    (profile?.cloudEnabled ?? true) ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
              <p className={`text-[11px] mt-2 ${(profile?.cloudEnabled ?? true) ? "text-emerald-400" : cm ? "text-gray-400" : "text-white/30"}`}>
                {(profile?.cloudEnabled ?? true)
                  ? (lang === "RO" ? "✓ Cloud activ — fișierele tale sunt salvate pentru re-editare." : "✓ Cloud active — your files are saved for re-editing.")
                  : (lang === "RO" ? "✗ Cloud dezactivat — fișierele nu vor fi salvate în cloud." : "✗ Cloud disabled — files will not be saved to cloud.")}
              </p>
            </div>

            {/* EDIT FORM */}
            <form onSubmit={handleSave} className={`p-6 rounded-2xl space-y-5 ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
              <h2 className={`text-lg font-semibold ${cm ? "text-gray-900" : "text-white"}`}>{c.editProfile}</h2>
              {message && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-sm text-center">{message}</div>}
              {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/20 text-red-300 text-sm text-center">{error}</div>}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${cm ? "text-gray-600" : "text-white/60"}`}>{c.displayName}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 transition ${cm ? "bg-gray-50 border border-gray-200 text-gray-800" : "bg-white/5 border border-white/10 text-white placeholder-white/30"}`} />
              </div>
              <div className={`border-t pt-5 ${cm ? "border-gray-200" : "border-white/10"}`}>
                <p className={`text-sm mb-4 ${cm ? "text-gray-400" : "text-white/40"}`}>{c.changePw}</p>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${cm ? "text-gray-600" : "text-white/60"}`}>{c.currentPw}</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 transition ${cm ? "bg-gray-50 border border-gray-200 text-gray-800" : "bg-white/5 border border-white/10 text-white placeholder-white/30"}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${cm ? "text-gray-600" : "text-white/60"}`}>{c.newPw}</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 transition ${cm ? "bg-gray-50 border border-gray-200 text-gray-800" : "bg-white/5 border border-white/10 text-white placeholder-white/30"}`} />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-50">
                {saving ? c.saving : c.save}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
