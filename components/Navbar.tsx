"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"

type NavbarProps = {
  lang: string
  setLang: (value: string) => void
  classicMode: boolean
  setClassicMode: (value: boolean) => void
}

export default function Navbar({
  lang,
  setLang,
  classicMode,
  setClassicMode
}: NavbarProps) {

  const { data: session, status } = useSession()
  const pathname = usePathname()
  const isLoggedIn = status === "authenticated"
  const onDashboard = pathname?.startsWith("/dashboard")
  const user = session?.user as { name?: string; email?: string; role?: string; plan?: string } | undefined
  const isOwner = user?.role === "owner"
  const isAdmin = user?.role === "admin" || isOwner
  const isPremium = user?.plan === "premium"
  const isFriend = user?.plan === "friend"

  const [menu, setMenu] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [onlineCount, setOnlineCount] = useState<{ users: number; visitors: number; owners: number; admins: number; regular: number } | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const [notifications, setNotifications] = useState<{ id: string; type: string; message: string; time: string }[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [seenNotifIds, setSeenNotifIds] = useState<Set<string>>(new Set())
  const toggleClassic = () => setClassicMode(!classicMode)

  // Fetch online count for admin/owner users
  const fetchOnline = useCallback(() => {
    if (!isAdmin) return
    fetch("/api/admin/stats").then(r => r.json()).then(d => {
      if (d && typeof d.onlineUsers === "number") {
        setOnlineCount({ users: d.onlineUsers, visitors: d.onlineVisitors ?? 0, owners: d.onlineOwners ?? 0, admins: d.onlineAdmins ?? 0, regular: d.onlineRegular ?? 0 })
      }
    }).catch(() => {})
  }, [isAdmin])

  useEffect(() => {
    fetchOnline()
    if (!isAdmin) return
    const iv = setInterval(fetchOnline, 10000)
    return () => clearInterval(iv)
  }, [isAdmin, fetchOnline])

  // Heartbeat ping for online tracking (all visitors)
  useEffect(() => {
    const getVisitorId = () => {
      let vid = localStorage.getItem("docm_vid")
      if (!vid) {
        vid = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
        localStorage.setItem("docm_vid", vid)
      }
      return vid
    }
    const ping = () => {
      fetch("/api/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: getVisitorId() }),
      }).catch(() => {})
    }
    ping()
    const iv = setInterval(ping, 30000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenu(null)
        setMobileOpen(false)
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setMenu(null)
  }, [])

  // Fetch notifications for owner
  useEffect(() => {
    if (!isOwner) return
    const stored = localStorage.getItem("docm_seen_notifs")
    if (stored) { try { setSeenNotifIds(new Set(JSON.parse(stored))) } catch {} }
    const fetchNotifs = () => {
      fetch("/api/admin/notifications").then(r => r.json()).then(d => {
        if (d.notifications) setNotifications(d.notifications)
      }).catch(() => {})
    }
    fetchNotifs()
    const iv = setInterval(fetchNotifs, 30000)
    return () => clearInterval(iv)
  }, [isOwner])

  const markAllSeen = () => {
    const ids = new Set(notifications.map(n => n.id))
    setSeenNotifIds(ids)
    localStorage.setItem("docm_seen_notifs", JSON.stringify([...ids]))
    setNotifOpen(false)
  }

  const unseenCount = notifications.filter(n => !seenNotifIds.has(n.id)).length

  const cm = classicMode

  const planBadge = isOwner
    ? cm ? "bg-red-50 text-red-600 border border-red-200" : "bg-red-500/15 text-red-400 border border-red-400/20"
    : isFriend
    ? cm ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-emerald-500/15 text-emerald-400 border border-emerald-400/20"
    : isPremium
    ? cm ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-amber-500/15 text-amber-400 border border-amber-400/20"
    : cm ? "bg-gray-100 text-gray-500 border border-gray-200" : "bg-white/5 text-white/40 border border-white/10"

  const planLabel = isOwner ? "Owner" : isFriend ? "Friend" : isPremium ? "Premium" : "Free"

  const btnCls = (active: boolean) => `px-3 py-1 rounded-lg flex items-center gap-1.5 text-[13px] font-medium transition ${
    active
      ? cm ? "bg-blue-50 text-blue-700" : "bg-white/10 text-white"
      : cm ? "text-gray-600 hover:bg-gray-100" : "text-white/70 hover:bg-white/5 hover:text-white"
  }`

  const dropCls = `rounded-2xl shadow-2xl backdrop-blur-xl border ${cm ? "bg-white/95 border-gray-200" : "bg-[#0b1026]/95 border-white/10"}`
  const linkCls = cm ? "hover:bg-gray-100 text-gray-700" : "hover:bg-white/5 text-white/80 hover:text-white"

  return (
<header
  ref={navRef}
  className={`fixed top-0 left-0 w-full z-50 backdrop-blur-xl ${cm ? "bg-white/90 shadow-[0_1px_3px_rgba(0,0,0,0.05)]" : "bg-black/30 border-b border-white/[0.06]"}`}
>
<div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-12">

{/* LOGO + CLOUD + ONLINE */}
<div className="flex items-center gap-2 flex-shrink-0">
  <Link href="/" className="flex items-center">
    <img src="/logo.png" className="w-24 sm:w-28 h-auto object-contain" />
  </Link>
  {isLoggedIn && (
    <Link href="/cloud" className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl text-[12px] font-semibold transition-all hover:scale-105 ${cm ? "bg-gradient-to-r from-violet-50 to-purple-50 text-purple-700 border border-purple-200 hover:border-purple-300" : "bg-gradient-to-r from-purple-500/15 to-violet-500/15 text-purple-300 border border-purple-400/20 hover:border-purple-400/40"}`}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" /></svg>
      My Cloud
    </Link>
  )}
  {isAdmin && onlineCount && (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cm ? "bg-green-50 text-green-700 border border-green-200" : "bg-green-500/15 text-green-400 border border-green-400/20"}`}>
      <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span></span>
      {onlineCount.users + onlineCount.visitors} online
    </span>
  )}
  {isAdmin && onlineCount && (
    <span className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${cm ? "bg-gray-100 text-gray-500 border border-gray-200" : "bg-white/5 text-white/40 border border-white/10"}`}>
      {onlineCount.owners > 0 && <span className="text-red-400">{onlineCount.owners} owner{onlineCount.owners > 1 ? "s" : ""}</span>}
      {onlineCount.owners > 0 && (onlineCount.admins > 0 || onlineCount.regular > 0 || onlineCount.visitors > 0) && <span className="opacity-30">·</span>}
      {onlineCount.admins > 0 && <span className="text-amber-400">{onlineCount.admins} admin{onlineCount.admins > 1 ? "s" : ""}</span>}
      {onlineCount.admins > 0 && (onlineCount.regular > 0 || onlineCount.visitors > 0) && <span className="opacity-30">·</span>}
      {onlineCount.regular > 0 && <span className={cm ? "text-blue-600" : "text-blue-400"}>{onlineCount.regular} user{onlineCount.regular > 1 ? "s" : ""}</span>}
      {onlineCount.regular > 0 && onlineCount.visitors > 0 && <span className="opacity-30">·</span>}
      <span className={cm ? "text-gray-400" : "text-white/30"}>{onlineCount.visitors} guest{onlineCount.visitors !== 1 ? "s" : ""}</span>
    </span>
  )}
</div>

{/* DESKTOP CENTER NAV */}
<div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">

  {/* CONVERTOR */}
  <div className="relative">
    <button onClick={() => setMenu(menu === "convert" ? null : "convert")} className={btnCls(menu === "convert")}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
      <span className={cm ? "text-blue-600" : "bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"}>Convertor</span>
      <svg className={`w-3 h-3 transition-transform ${menu === "convert" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
    </button>
    {menu === "convert" && (
      <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[780px] p-5 ${dropCls}`}>
        <div className="grid grid-cols-4 gap-5 text-sm">
          <div>
            <p className={`mb-2 font-semibold text-xs tracking-wider uppercase ${cm ? "text-blue-600" : "text-blue-400"}`}>From PDF</p>
            <div className="space-y-0.5">
              {[
                { href: "/convert/pdf-to-word", label: "PDF → Word" },
                { href: "/convert/pdf-to-excel", label: "PDF → Excel" },
                { href: "/convert/pdf-to-pptx", label: "PDF → PPTX" },
                { href: "/convert/pdf-to-jpg", label: "PDF → JPG" },
                { href: "/convert/pdf-to-png", label: "PDF → PNG" },
                { href: "/convert/pdf-to-html", label: "PDF → HTML" },
                { href: "/convert/pdf-to-txt", label: "PDF → TXT" },
                { href: "/convert/pdf-to-csv", label: "PDF → CSV" },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenu(null)} className={`block py-1.5 px-3 rounded-lg text-[13px] transition ${linkCls}`}>{item.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className={`mb-2 font-semibold text-xs tracking-wider uppercase ${cm ? "text-purple-600" : "text-purple-400"}`}>To PDF</p>
            <div className="space-y-0.5">
              {[
                { href: "/convert/word-to-pdf", label: "Word → PDF" },
                { href: "/convert/excel-to-pdf", label: "Excel → PDF" },
                { href: "/convert/pptx-to-pdf", label: "PPTX → PDF" },
                { href: "/convert/jpg-to-pdf", label: "JPG → PDF" },
                { href: "/convert/png-to-pdf", label: "PNG → PDF" },
                { href: "/convert/html-to-pdf", label: "HTML → PDF" },
                { href: "/convert/txt-to-pdf", label: "TXT → PDF" },
                { href: "/convert/csv-to-pdf", label: "CSV → PDF" },
                { href: "/convert/markdown-to-pdf", label: "Markdown → PDF" },
                { href: "/convert/image-to-pdf", label: "Image → PDF" },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenu(null)} className={`block py-1.5 px-3 rounded-lg text-[13px] transition ${linkCls}`}>{item.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className={`mb-2 font-semibold text-xs tracking-wider uppercase ${cm ? "text-emerald-600" : "text-emerald-400"}`}>Word</p>
            <div className="space-y-0.5">
              {[
                { href: "/convert/word-to-excel", label: "Word → Excel" },
                { href: "/convert/excel-to-word", label: "Excel → Word" },
                { href: "/convert/word-to-pptx", label: "Word → PPTX" },
                { href: "/convert/pptx-to-word", label: "PPTX → Word" },
                { href: "/convert/word-to-html", label: "Word → HTML" },
                { href: "/convert/html-to-word", label: "HTML → Word" },
                { href: "/convert/word-to-txt", label: "Word → TXT" },
                { href: "/convert/txt-to-word", label: "TXT → Word" },
                { href: "/convert/word-to-jpg", label: "Word → JPG" },
                { href: "/convert/word-to-png", label: "Word → PNG" },
                { href: "/convert/jpg-to-word", label: "JPG → Word" },
                { href: "/convert/png-to-word", label: "PNG → Word" },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenu(null)} className={`block py-1.5 px-3 rounded-lg text-[13px] transition ${linkCls}`}>{item.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className={`mb-2 font-semibold text-xs tracking-wider uppercase ${cm ? "text-orange-600" : "text-orange-400"}`}>Excel & Other</p>
            <div className="space-y-0.5">
              {[
                { href: "/convert/excel-to-csv", label: "Excel → CSV" },
                { href: "/convert/csv-to-excel", label: "CSV → Excel" },
                { href: "/convert/excel-to-html", label: "Excel → HTML" },
                { href: "/convert/html-to-excel", label: "HTML → Excel" },
                { href: "/convert/excel-to-txt", label: "Excel → TXT" },
                { href: "/convert/pptx-to-html", label: "PPTX → HTML" },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenu(null)} className={`block py-1.5 px-3 rounded-lg text-[13px] transition ${linkCls}`}>{item.label}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>

  {/* TOOLS */}
  <div className="relative">
    <button onClick={() => setMenu(menu === "tools" ? null : "tools")} className={btnCls(menu === "tools")}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.065A1.875 1.875 0 013.75 16.578V7.422a1.875 1.875 0 012.286-1.657l5.384 3.065m0 0l5.384-3.065A1.875 1.875 0 0119.09 5.765v9.157a1.875 1.875 0 01-2.286 1.657l-5.384-3.065" /></svg>
      <span className={cm ? "text-purple-600" : "bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"}>Tools</span>
      <svg className={`w-3 h-3 transition-transform ${menu === "tools" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
    </button>
    {menu === "tools" && (
      <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[820px] p-5 ${dropCls}`}>
        <div className="grid grid-cols-4 gap-5 text-[13px]">
          <div>
            <p className={`mb-2 font-semibold text-xs tracking-wider uppercase ${cm ? "text-red-600" : "text-red-400"}`}>PDF Core</p>
            <div className="space-y-0.5">
              {[
                { href: "/tools/pdf-viewer", label: "PDF Viewer" },
                { href: "/tools/pdf-editor", label: "PDF Editor" },
                { href: "/tools/pdf-creator", label: "PDF Creator" },
                { href: "/tools/split-pdf", label: "Split PDF" },
                { href: "/tools/merge-pdf", label: "Merge PDF" },
                { href: "/tools/rotate-pdf", label: "Rotate PDF" },
                { href: "/tools/compress", label: "Compress PDF" },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenu(null)} className={`block py-1.5 px-3 rounded-lg transition ${linkCls}`}>{item.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className={`mb-2 font-semibold text-xs tracking-wider uppercase ${cm ? "text-orange-600" : "text-orange-400"}`}>PDF Enhance</p>
            <div className="space-y-0.5">
              {[
                { href: "/tools/watermark", label: "Add Watermark" },
                { href: "/tools/stamp", label: "Add Stamp" },
                { href: "/tools/sign-pdf", label: "Sign PDF" },
                { href: "/tools/header-footer", label: "Header & Footer" },
                { href: "/tools/encrypt-pdf", label: "Encrypt / Decrypt" },
                { href: "/tools/flatten-pdf", label: "Flatten PDF" },
                { href: "/tools/repair-pdf", label: "Repair PDF" },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenu(null)} className={`block py-1.5 px-3 rounded-lg transition ${linkCls}`}>{item.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className={`mb-2 font-semibold text-xs tracking-wider uppercase ${cm ? "text-sky-600" : "text-sky-400"}`}>PDF Pages & Info</p>
            <div className="space-y-0.5">
              {[
                { href: "/tools/delete-pages", label: "Delete Pages" },
                { href: "/tools/extract-pages", label: "Extract Pages" },
                { href: "/tools/reorganize-pdf", label: "Reorganize Pages" },
                { href: "/tools/compare-pdf", label: "Compare PDFs" },
                { href: "/tools/edit-metadata", label: "Edit Metadata" },
                { href: "/tools/pdf-info", label: "PDF Info" },
                { href: "/tools/extract-images", label: "Extract Images" },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenu(null)} className={`block py-1.5 px-3 rounded-lg transition ${linkCls}`}>{item.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className={`mb-2 font-semibold text-xs tracking-wider uppercase ${cm ? "text-purple-600" : "text-purple-400"}`}>Editors</p>
            <div className="space-y-0.5">
              {[
                { href: "/tools/word-editor", label: "Word Editor" },
                { href: "/tools/excel-editor", label: "Excel Editor" },
                { href: "/tools/powerpoint-editor", label: "PowerPoint" },
                { href: "/tools/txt-editor", label: "TXT Editor" },
                { href: "/tools/csv-editor", label: "CSV Editor" },
                { href: "/tools/word-viewer", label: "Word Viewer" },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenu(null)} className={`block py-1.5 px-3 rounded-lg transition ${linkCls}`}>{item.label}</Link>
              ))}
            </div>
            <p className={`mb-2 mt-3 font-semibold text-xs tracking-wider uppercase ${cm ? "text-emerald-600" : "text-emerald-400"}`}>Utilities</p>
            <div className="space-y-0.5">
              {[
                { href: "/tools/ocr", label: "OCR (Image → Text)" },
                { href: "/tools/remove-bg", label: "Remove Background" },
                { href: "/tools/adjust-colors", label: "Adjust Colors" },
                { href: "/tools/background-color", label: "Background Color" },
                { href: "/tools/scanner-effect", label: "Scanner Effect" },
                { href: "/tools/rasterize-pdf", label: "Rasterize PDF" },
                { href: "/tools/url-to-pdf", label: "URL → PDF" },
                { href: "/tools/screenshot", label: "Screenshot" },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenu(null)} className={`block py-1.5 px-3 rounded-lg transition ${linkCls}`}>{item.label}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>

  {/* MORE */}
  <div className="relative">
    <button onClick={() => setMenu(menu === "more" ? null : "more")} className={btnCls(menu === "more")}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
      <span className={cm ? "text-emerald-600" : "bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"}>More</span>
      <svg className={`w-3 h-3 transition-transform ${menu === "more" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
    </button>
    {menu === "more" && (
      <div className={`absolute top-full right-0 mt-2 w-[180px] p-3 ${dropCls}`}>
        <div className="space-y-0.5 text-[13px]">
          {[
            { href: "/about", label: "About Us", color: cm ? "text-blue-600" : "text-blue-400" },
            { href: "/reviews", label: "Reviews", color: cm ? "text-amber-600" : "text-amber-400" },
            { href: "/blog", label: "Blog", color: cm ? "text-emerald-600" : "text-emerald-400" },
            { href: "/help", label: "Help & Contact", color: cm ? "text-violet-600" : "text-violet-400" },
          ].map(item => (
            <Link key={item.href} href={item.href} onClick={() => setMenu(null)} className={`block py-1.5 px-3 rounded-lg transition font-medium ${item.color} ${cm ? "hover:bg-gray-100" : "hover:bg-white/10"}`}>{item.label}</Link>
          ))}
          <Link href="/report-bug" onClick={() => setMenu(null)} className={`flex items-center gap-2 py-1.5 px-3 rounded-lg transition font-semibold ${cm ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-red-400 bg-red-500/10 hover:bg-red-500/20"}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            Report a Bug
          </Link>
        </div>
      </div>
    )}
  </div>

</div>

{/* DESKTOP RIGHT SIDE */}
<div className="hidden md:flex items-center gap-2">

  {/* THEME SLIDER */}
  <div className="flex items-center gap-1.5">
    <svg className={`w-3.5 h-3.5 transition ${cm ? "text-yellow-500" : "text-gray-500"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
    <button onClick={toggleClassic} className={`relative w-9 h-[18px] rounded-full transition ${cm ? "bg-gray-300" : "bg-purple-500"}`}>
      <span className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full transition shadow-sm ${cm ? "left-[2px]" : "left-[19px]"}`} />
    </button>
    <svg className={`w-3.5 h-3.5 transition ${cm ? "text-gray-400" : "text-purple-400"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1111.21 3c0 5 4 9 9.79 9.79z"/>
    </svg>
  </div>

  {/* LANGUAGE */}
  <div className={`flex rounded-md overflow-hidden text-[11px] font-medium ${cm ? "bg-gray-100" : "bg-white/5"}`}>
    <button onClick={() => setLang("EN")} className={`px-2 py-0.5 transition ${lang === "EN" ? cm ? "bg-blue-100 text-blue-700" : "bg-blue-500/30 text-blue-300" : cm ? "text-gray-500 hover:bg-gray-200" : "text-white/40 hover:bg-white/5"}`}>EN</button>
    <button onClick={() => setLang("RO")} className={`px-2 py-0.5 transition ${lang === "RO" ? cm ? "bg-blue-100 text-blue-700" : "bg-blue-500/30 text-blue-300" : cm ? "text-gray-500 hover:bg-gray-200" : "text-white/40 hover:bg-white/5"}`}>RO</button>
  </div>

  {/* AUTH / USER INFO */}
  {isLoggedIn ? (
    <div className="flex items-center gap-1.5">
      {/* Plan badge — hidden for owner since the button already says Owner Panel */}
      {!isOwner && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${planBadge}`}>{planLabel}</span>
      )}
      {/* Admin link */}
      {isAdmin && (
        <Link href="/dmc-ctrl" className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition ${isOwner ? cm ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-red-500/15 text-red-400 hover:bg-red-500/25" : cm ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"}`}>
          {isOwner ? "Owner Panel" : "Admin"}
        </Link>
      )}
      {/* Owner notification bell */}
      {isOwner && (
        <div className="relative">
          <button onClick={() => { setNotifOpen(!notifOpen); setMenu(null) }} className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition ${cm ? "hover:bg-gray-100 text-gray-600" : "hover:bg-white/10 text-white/60"}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
            {unseenCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">{unseenCount > 9 ? "9+" : unseenCount}</span>
            )}
          </button>
          {notifOpen && (
            <div className={`absolute top-full right-0 mt-2 w-[340px] rounded-2xl shadow-2xl backdrop-blur-xl border z-50 ${cm ? "bg-white/95 border-gray-200" : "bg-[#0b1026]/95 border-white/10"}`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b ${cm ? "border-gray-200" : "border-white/10"}`}>
                <span className={`text-xs font-semibold ${cm ? "text-gray-800" : "text-white"}`}>Notifications</span>
                {unseenCount > 0 && <button onClick={markAllSeen} className="text-[10px] text-blue-400 hover:text-blue-300 transition">Mark all read</button>}
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className={`text-xs py-8 text-center ${cm ? "text-gray-400" : "text-white/30"}`}>No notifications</p>
                ) : (
                  notifications.slice(0, 20).map(n => {
                    const unseen = !seenNotifIds.has(n.id)
                    const icon = n.type === "bug" ? "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" : n.type === "user" ? "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" : "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                    const color = n.type === "bug" ? "text-red-400" : n.type === "user" ? "text-blue-400" : "text-emerald-400"
                    return (
                      <div key={n.id} className={`px-4 py-2.5 flex items-start gap-2.5 transition ${unseen ? cm ? "bg-blue-50/50" : "bg-white/[0.03]" : ""} ${cm ? "hover:bg-gray-50" : "hover:bg-white/5"}`}>
                        <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${color}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[11px] leading-relaxed ${cm ? "text-gray-700" : "text-white/70"}`}>{n.message}</p>
                          <p className={`text-[9px] mt-0.5 ${cm ? "text-gray-400" : "text-white/25"}`}>{new Date(n.time).toLocaleDateString()} {new Date(n.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                        {unseen && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Profile */}
      <Link href="/dashboard" className={`px-3 py-1 rounded-lg text-[13px] font-medium transition ${cm ? "text-gray-700 hover:bg-gray-100" : "text-white/70 hover:text-white hover:bg-white/5"}`}>
        Profile
      </Link>
      {/* Sign out */}
      <button onClick={() => signOut({ callbackUrl: "/" })} className="px-3 py-1 rounded-lg text-[13px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">
        Sign Out
      </button>
    </div>
  ) : (
    <Link href="/login" className="px-4 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all text-[13px] font-semibold text-white">
      Sign In
    </Link>
  )}

</div>

{/* MOBILE HAMBURGER */}
<button
  onClick={() => { setMobileOpen(!mobileOpen); setMenu(null) }}
  className={`md:hidden p-1.5 rounded-lg transition ${cm ? "hover:bg-gray-100 text-gray-700" : "hover:bg-white/10 text-white/70"}`}
>
  {mobileOpen ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
  )}
</button>

</div>

{/* MOBILE MENU */}
{mobileOpen && (
<div className={`md:hidden border-t mt-1 pb-4 ${cm ? "border-gray-200 bg-white/95" : "border-white/10 bg-[#0b1026]/95"} backdrop-blur-xl`}>
  <div className="px-4 pt-3 space-y-2">

    {/* Auth buttons at top for mobile */}
    {isLoggedIn ? (
      <div className={`flex items-center justify-between p-3 rounded-xl mb-2 ${cm ? "bg-gray-50" : "bg-white/5"}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold truncate ${cm ? "text-gray-800" : "text-white"}`}>{user?.name || "User"}</p>
            <p className={`text-xs truncate ${cm ? "text-gray-400" : "text-white/40"}`}>{user?.email}</p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${planBadge}`}>{planLabel}</span>
        </div>
      </div>
    ) : (
      <Link href="/login" onClick={() => setMobileOpen(false)} className="block w-full py-3 rounded-xl text-sm font-semibold text-center bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20 mb-2">
        Sign In
      </Link>
    )}
    <div className={`flex gap-2 mb-3 ${!isLoggedIn ? "hidden" : ""}`}>
      {isAdmin && (
        <Link href="/dmc-ctrl" onClick={() => setMobileOpen(false)} className={`flex-1 py-2 rounded-xl text-[13px] font-medium text-center ${isOwner ? cm ? "bg-red-50 text-red-600" : "bg-red-500/15 text-red-400" : cm ? "bg-amber-50 text-amber-600" : "bg-amber-500/15 text-amber-400"}`}>
          {isOwner ? "Owner Panel" : "Admin"}
        </Link>
      )}
      <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex-1 py-2 rounded-xl text-[13px] font-medium text-center bg-gradient-to-r from-blue-500 to-purple-500 text-white">Profile</Link>
      {isLoggedIn && (
        <Link href="/cloud" onClick={() => setMobileOpen(false)} className={`flex-1 py-2 rounded-xl text-[13px] font-medium text-center ${cm ? "bg-purple-50 text-purple-600" : "bg-purple-500/15 text-purple-400"}`}>Cloud</Link>
      )}
      <button onClick={() => { signOut({ callbackUrl: "/" }); setMobileOpen(false) }} className="flex-1 py-2 rounded-xl text-[13px] font-medium bg-red-500/10 text-red-400">
        Sign Out
      </button>
    </div>

    {/* Convertor – From PDF */}
    <p className={`text-xs font-semibold tracking-wider uppercase px-2 ${cm ? "text-blue-600" : "text-blue-400"}`}>From PDF</p>
    <div className="grid grid-cols-2 gap-1 text-sm">
      {[
        { href: "/convert/pdf-to-word", label: "PDF → Word" },
        { href: "/convert/pdf-to-excel", label: "PDF → Excel" },
        { href: "/convert/pdf-to-pptx", label: "PDF → PPTX" },
        { href: "/convert/pdf-to-jpg", label: "PDF → JPG" },
        { href: "/convert/pdf-to-png", label: "PDF → PNG" },
        { href: "/convert/pdf-to-html", label: "PDF → HTML" },
        { href: "/convert/pdf-to-txt", label: "PDF → TXT" },
        { href: "/convert/pdf-to-csv", label: "PDF → CSV" },
      ].map(item => (
        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`py-2 px-3 rounded-lg transition text-[13px] ${linkCls}`}>{item.label}</Link>
      ))}
    </div>
    <p className={`text-xs font-semibold tracking-wider uppercase px-2 pt-2 ${cm ? "text-purple-600" : "text-purple-400"}`}>To PDF</p>
    <div className="grid grid-cols-2 gap-1 text-sm">
      {[
        { href: "/convert/word-to-pdf", label: "Word → PDF" },
        { href: "/convert/excel-to-pdf", label: "Excel → PDF" },
        { href: "/convert/pptx-to-pdf", label: "PPTX → PDF" },
        { href: "/convert/jpg-to-pdf", label: "JPG → PDF" },
        { href: "/convert/png-to-pdf", label: "PNG → PDF" },
        { href: "/convert/html-to-pdf", label: "HTML → PDF" },
        { href: "/convert/txt-to-pdf", label: "TXT → PDF" },
        { href: "/convert/csv-to-pdf", label: "CSV → PDF" },
        { href: "/convert/markdown-to-pdf", label: "Markdown → PDF" },
        { href: "/convert/image-to-pdf", label: "Image → PDF" },
      ].map(item => (
        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`py-2 px-3 rounded-lg transition text-[13px] ${linkCls}`}>{item.label}</Link>
      ))}
    </div>
    <p className={`text-xs font-semibold tracking-wider uppercase px-2 pt-2 ${cm ? "text-emerald-600" : "text-emerald-400"}`}>Word & Office</p>
    <div className="grid grid-cols-2 gap-1 text-sm">
      {[
        { href: "/convert/word-to-excel", label: "Word → Excel" },
        { href: "/convert/excel-to-word", label: "Excel → Word" },
        { href: "/convert/word-to-pptx", label: "Word → PPTX" },
        { href: "/convert/pptx-to-word", label: "PPTX → Word" },
        { href: "/convert/word-to-html", label: "Word → HTML" },
        { href: "/convert/html-to-word", label: "HTML → Word" },
        { href: "/convert/word-to-txt", label: "Word → TXT" },
        { href: "/convert/txt-to-word", label: "TXT → Word" },
        { href: "/convert/word-to-jpg", label: "Word → JPG" },
        { href: "/convert/word-to-png", label: "Word → PNG" },
        { href: "/convert/jpg-to-word", label: "JPG → Word" },
        { href: "/convert/png-to-word", label: "PNG → Word" },
        { href: "/convert/excel-to-csv", label: "Excel → CSV" },
        { href: "/convert/csv-to-excel", label: "CSV → Excel" },
        { href: "/convert/excel-to-html", label: "Excel → HTML" },
        { href: "/convert/html-to-excel", label: "HTML → Excel" },
        { href: "/convert/excel-to-txt", label: "Excel → TXT" },
        { href: "/convert/pptx-to-html", label: "PPTX → HTML" },
      ].map(item => (
        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`py-2 px-3 rounded-lg transition text-[13px] ${linkCls}`}>{item.label}</Link>
      ))}
    </div>

    {/* PDF Tools section */}
    <p className={`text-xs font-semibold tracking-wider uppercase px-2 pt-2 ${cm ? "text-red-600" : "text-red-400"}`}>PDF Tools</p>
    <div className="grid grid-cols-2 gap-1 text-sm">
      {[
        { href: "/tools/pdf-viewer", label: "PDF Viewer" },
        { href: "/tools/pdf-editor", label: "PDF Editor" },
        { href: "/tools/pdf-creator", label: "PDF Creator" },
        { href: "/tools/split-pdf", label: "Split PDF" },
        { href: "/tools/merge-pdf", label: "Merge PDF" },
        { href: "/tools/rotate-pdf", label: "Rotate PDF" },
        { href: "/tools/compress", label: "Compress" },
        { href: "/tools/watermark", label: "Add Watermark" },
        { href: "/tools/encrypt-pdf", label: "Encrypt / Decrypt" },
        { href: "/tools/extract-images", label: "Extract Images" },
        { href: "/tools/delete-pages", label: "Delete Pages" },
        { href: "/tools/extract-pages", label: "Extract Pages" },
        { href: "/tools/reorganize-pdf", label: "Reorganize" },
        { href: "/tools/sign-pdf", label: "Sign PDF" },
        { href: "/tools/stamp", label: "Add Stamp" },
        { href: "/tools/header-footer", label: "Header & Footer" },
        { href: "/tools/flatten-pdf", label: "Flatten PDF" },
        { href: "/tools/repair-pdf", label: "Repair PDF" },
        { href: "/tools/compare-pdf", label: "Compare PDFs" },
        { href: "/tools/edit-metadata", label: "Edit Metadata" },
        { href: "/tools/pdf-info", label: "PDF Info" },
      ].map(item => (
        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`py-2 px-3 rounded-lg transition text-[13px] ${linkCls}`}>{item.label}</Link>
      ))}
    </div>

    {/* Editors section */}
    <p className={`text-xs font-semibold tracking-wider uppercase px-2 pt-2 ${cm ? "text-purple-600" : "text-purple-400"}`}>Editors</p>
    <div className="grid grid-cols-2 gap-1 text-sm">
      {[
        { href: "/tools/word-editor", label: "Word Editor" },
        { href: "/tools/excel-editor", label: "Excel Editor" },
        { href: "/tools/powerpoint-editor", label: "PowerPoint" },
        { href: "/tools/txt-editor", label: "TXT Editor" },
        { href: "/tools/csv-editor", label: "CSV Editor" },
        { href: "/tools/word-viewer", label: "Word Viewer" },
      ].map(item => (
        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`py-2 px-3 rounded-lg transition text-[13px] ${linkCls}`}>{item.label}</Link>
      ))}
    </div>

    {/* Utilities section */}
    <p className={`text-xs font-semibold tracking-wider uppercase px-2 pt-2 ${cm ? "text-teal-600" : "text-teal-400"}`}>Utilities</p>
    <div className="grid grid-cols-2 gap-1 text-sm">
      {[
        { href: "/tools/ocr", label: "OCR (Image → Text)" },
        { href: "/tools/remove-bg", label: "Remove Background" },
        { href: "/tools/adjust-colors", label: "Adjust Colors" },
        { href: "/tools/background-color", label: "Background Color" },
        { href: "/tools/scanner-effect", label: "Scanner Effect" },
        { href: "/tools/rasterize-pdf", label: "Rasterize PDF" },
        { href: "/tools/url-to-pdf", label: "URL → PDF" },
        { href: "/tools/screenshot", label: "Screenshot" },
      ].map(item => (
        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`py-2 px-3 rounded-lg transition text-[13px] ${linkCls}`}>{item.label}</Link>
      ))}
    </div>

    {/* More links */}
    <p className={`text-xs font-semibold tracking-wider uppercase px-2 pt-2 ${cm ? "text-gray-500" : "text-white/40"}`}>More</p>
    <div className="grid grid-cols-2 gap-1 text-sm">
      {[
        { href: "/about", label: "About Us" },
        { href: "/reviews", label: "Reviews" },
        { href: "/blog", label: "Blog" },
        { href: "/cloud", label: "My Cloud" },
        { href: "/help", label: "Help & Contact" },
      ].map(item => (
        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`py-2 px-3 rounded-lg transition text-[13px] ${linkCls}`}>{item.label}</Link>
      ))}
      <Link href="/report-bug" onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 py-2 px-3 rounded-lg transition text-[13px] font-semibold ${cm ? "text-red-600 bg-red-50" : "text-red-400 bg-red-500/10"}`}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
        Report a Bug
      </Link>
    </div>

    {/* Theme + Language row */}
    <div className={`flex items-center justify-between pt-3 border-t ${cm ? "border-gray-200" : "border-white/10"}`}>
      <div className="flex items-center gap-1.5">
        <svg className={`w-3.5 h-3.5 ${cm ? "text-yellow-500" : "text-gray-500"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        <button onClick={toggleClassic} className={`relative w-9 h-[18px] rounded-full transition ${cm ? "bg-gray-300" : "bg-purple-500"}`}>
          <span className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full transition shadow-sm ${cm ? "left-[2px]" : "left-[19px]"}`} />
        </button>
        <svg className={`w-3.5 h-3.5 ${cm ? "text-gray-400" : "text-purple-400"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3c0 5 4 9 9.79 9.79z"/></svg>
      </div>
      <div className={`flex rounded-md overflow-hidden text-[11px] font-medium ${cm ? "bg-gray-100" : "bg-white/5"}`}>
        <button onClick={() => setLang("EN")} className={`px-2 py-0.5 transition ${lang === "EN" ? cm ? "bg-blue-100 text-blue-700" : "bg-blue-500/30 text-blue-300" : cm ? "text-gray-500" : "text-white/40"}`}>EN</button>
        <button onClick={() => setLang("RO")} className={`px-2 py-0.5 transition ${lang === "RO" ? cm ? "bg-blue-100 text-blue-700" : "bg-blue-500/30 text-blue-300" : cm ? "text-gray-500" : "text-white/40"}`}>RO</button>
      </div>
    </div>

    {/* Auth buttons moved to top of mobile menu */}

  </div>
</div>
)}

</header>
  )
}
