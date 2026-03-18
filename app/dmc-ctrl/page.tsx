"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

type Stats = {
  totalUsers: number
  totalFiles: number
  totalVisits: number
  premiumUsers: number
  freeUsers: number
  todayVisits: number
  weekVisits: number
  onlineUsers: number
  onlineVisitors: number
  onlineOwners: number
  onlineAdmins: number
  onlineRegular: number
  recentUsers: { id: string; name: string; email: string; plan: string; created_at: string }[]
}

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  plan: string
  emailVerified: boolean
  createdAt: string
  isOnline: boolean
  _count: { files: number }
}

type FileRow = {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  toolUsed: string | null
  createdAt: string
  user: { name: string; email: string }
}

type ReviewRow = {
  id: string
  user_name: string
  user_email: string
  text: string
  stars: number
  pinned: boolean
  hidden: boolean
  created_at: string
}

type BugRow = {
  id: string
  user_name: string
  user_email: string
  title: string
  description: string
  status: string
  created_at: string
}

type LogRow = {
  id: string
  user_name: string
  user_email: string
  page: string
  created_at: string
}

type CloudUser = {
  id: string
  name: string
  email: string
  plan: string
  cloudFiles: number
  cloudSize: number
}

type CloudFileRow = {
  id: string
  file_name: string
  file_size: number
  file_type: string
  tool_used: string | null
  storage_path: string
  created_at: string
  updated_at: string
}

type QuestionRow = {
  id: string
  email: string
  question: string
  created_at: string
}

type EncryptRecord = {
  id: string
  user_id: string
  user_name: string
  user_email: string
  file_name: string
  original_name: string
  file_size: number
  encrypted_at: string
  encrypt_password: string
}

type RecoveryRequest = {
  id: string
  user_id: string
  user_name: string
  user_email: string
  file_name: string
  file_size: number
  requested_at: string
  status: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<"overview" | "users" | "activity" | "reviews" | "bugs" | "cloud" | "questions" | "encrypt">("overview")
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [files, setFiles] = useState<FileRow[]>([])
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [bugs, setBugs] = useState<BugRow[]>([])
  const [logs, setLogs] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)

  // Cloud files state
  const [cloudUsers, setCloudUsers] = useState<CloudUser[]>([])
  const [cloudSelectedUser, setCloudSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [cloudFiles, setCloudFiles] = useState<CloudFileRow[]>([])
  const [cloudLoading, setCloudLoading] = useState(false)
  const [cloudViewUrl, setCloudViewUrl] = useState<string | null>(null)
  const [cloudViewing, setCloudViewing] = useState<CloudFileRow | null>(null)
  const [cloudTotalSize, setCloudTotalSize] = useState(0)

  // Activity sub-tab
  const [activityView, setActivityView] = useState<"files" | "logs">("files")

  // Bugs expanded
  const [expandedBug, setExpandedBug] = useState<string | null>(null)

  // Questions
  const [questions, setQuestions] = useState<QuestionRow[]>([])

  // Encrypt records
  const [encryptRecords, setEncryptRecords] = useState<EncryptRecord[]>([])
  const [recoveryRequests, setRecoveryRequests] = useState<RecoveryRequest[]>([])
  const [encryptSubTab, setEncryptSubTab] = useState<"records" | "recovery">("records")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login")
    if (status === "authenticated") {
      const user = session?.user as { role?: string } | undefined
      if (user?.role !== "admin" && user?.role !== "owner") router.push("/dashboard")
    }
  }, [status, session, router])

  useEffect(() => {
    if (status !== "authenticated") return
    setLoading(true)
    if (tab === "overview") {
      Promise.all([
        fetch("/api/admin/stats").then(r => r.json()).then(setStats),
        fetch("/api/admin/bug-reports").then(r => r.json()).then(setBugs),
        fetch("/api/admin/reviews").then(r => r.json()).then(setReviews),
      ]).finally(() => setLoading(false))
    } else if (tab === "users") {
      fetch("/api/admin/users").then(r => r.json()).then(setUsers).finally(() => setLoading(false))
    } else if (tab === "activity") {
      Promise.all([
        fetch("/api/admin/files").then(r => r.json()).then(setFiles),
        fetch("/api/admin/logs").then(r => r.json()).then(setLogs),
      ]).finally(() => setLoading(false))
    } else if (tab === "reviews") {
      fetch("/api/admin/reviews").then(r => r.json()).then(setReviews).finally(() => setLoading(false))
    } else if (tab === "bugs") {
      fetch("/api/admin/bug-reports").then(r => r.json()).then(setBugs).finally(() => setLoading(false))
    } else if (tab === "cloud") {
      fetch("/api/admin/cloud-files").then(r => r.json()).then(d => {
        const u = d.users || []
        setCloudUsers(u)
        setCloudTotalSize(u.reduce((sum: number, cu: CloudUser) => sum + (cu.cloudSize || 0), 0))
      }).finally(() => setLoading(false))
    } else if (tab === "questions") {
      fetch("/api/questions").then(r => r.json()).then(setQuestions).finally(() => setLoading(false))
    } else if (tab === "encrypt") {
      Promise.all([
        fetch("/api/encrypt-record").then(r => r.json()).then(d => setEncryptRecords(d.records || [])),
        fetch("/api/encrypt-recovery").then(r => r.json()).then(d => setRecoveryRequests(d.requests || [])),
      ]).finally(() => setLoading(false))
    }
  }, [tab, status])

  useEffect(() => {
    if (tab !== "overview" || status !== "authenticated") return
    const iv = setInterval(() => {
      fetch("/api/admin/stats").then(r => r.json()).then(setStats)
      fetch("/api/admin/bug-reports").then(r => r.json()).then(setBugs)
      fetch("/api/admin/reviews").then(r => r.json()).then(setReviews)
    }, 5000)
    return () => clearInterval(iv)
  }, [tab, status])

  useEffect(() => {
    if (tab !== "users" || status !== "authenticated") return
    const iv = setInterval(() => {
      fetch("/api/admin/users").then(r => r.json()).then(setUsers)
    }, 10000)
    return () => clearInterval(iv)
  }, [tab, status])

  async function updateUser(id: string, data: { plan?: string; role?: string; premiumDuration?: string; email_verified?: boolean }) {
    const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    if (res.ok) {
      if (typeof data.email_verified === "boolean") {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, emailVerified: data.email_verified! } : u))
      } else {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u))
      }
    }
  }

  async function resendVerifyEmail(userId: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email_verified: false }) })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, emailVerified: false } : u))
        alert("User set to unverified. They will need to re-verify.")
      }
    } catch { alert("Failed") }
  }

  async function deleteUser(id: string) {
    if (!confirm("Are you sure you want to delete this user?")) return
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== id))
  }

  async function updateBugStatus(id: string, newStatus: string) {
    const res = await fetch("/api/admin/bug-reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: newStatus }) })
    if (res.ok) setBugs(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
  }

  async function deleteBug(id: string) {
    if (!confirm("Delete this bug report?")) return
    const res = await fetch("/api/admin/bug-reports", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    if (res.ok) setBugs(prev => prev.filter(b => b.id !== id))
  }

  async function deleteReview(id: string) {
    if (!confirm("Delete this review?")) return
    const res = await fetch("/api/admin/reviews", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    if (res.ok) setReviews(prev => prev.filter(r => r.id !== id))
  }

  async function toggleReview(id: string, field: "pinned" | "hidden", value: boolean) {
    const res = await fetch("/api/admin/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, [field]: value }) })
    if (res.ok) { const updated = await res.json(); setReviews(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r)) }
  }

  async function loadCloudUserFiles(user: { id: string; name: string; email: string }) {
    setCloudSelectedUser(user)
    setCloudLoading(true)
    try { const res = await fetch(`/api/admin/cloud-files?userId=${user.id}`); const d = await res.json(); setCloudFiles(d.files || []) } catch { setCloudFiles([]) }
    setCloudLoading(false)
  }

  async function adminDeleteCloudFile(fileId: string) {
    if (!confirm("Delete this cloud file?")) return
    const res = await fetch("/api/admin/cloud-files", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileId }) })
    if (res.ok) { setCloudFiles(prev => prev.filter(f => f.id !== fileId)); setCloudUsers(prev => prev.map(u => u.id === cloudSelectedUser?.id ? { ...u, cloudFiles: u.cloudFiles - 1 } : u)) }
  }

  async function adminViewCloudFile(file: CloudFileRow) {
    setCloudViewing(file); setCloudViewUrl(null)
    try { const res = await fetch(`/api/admin/cloud-files/download?fileId=${file.id}`); if (res.ok) { const blob = await res.blob(); setCloudViewUrl(URL.createObjectURL(blob)) } } catch { /* ignore */ }
  }

  function closeCloudView() { if (cloudViewUrl) URL.revokeObjectURL(cloudViewUrl); setCloudViewing(null); setCloudViewUrl(null) }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return
    try { await fetch("/api/questions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); setQuestions(prev => prev.filter(q => q.id !== id)) } catch {}
  }

  const userRole = (session?.user as { role?: string } | undefined)?.role
  const isOwner = userRole === "owner"

  if (status === "loading") {
    return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#0b1333] to-[#020617]"><div className="w-10 h-10 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin" /></div>)
  }

  const cloudSizeLabel = cloudTotalSize > 0 ? ` (${cloudTotalSize < 1024*1024 ? (cloudTotalSize/1024).toFixed(1)+" KB" : (cloudTotalSize/(1024*1024)).toFixed(1)+" MB"})` : ""
  const tabs = ["overview", "users", "activity", "reviews", "bugs", "cloud", "questions", "encrypt"] as const
  const tabIcons: Record<string, string> = {
    overview: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z",
    users: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
    activity: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    reviews: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
    bugs: "M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152-6.135 3 3 0 10-2.055 0c-.16 2.14-.613 4.248-1.34 6.24M12 12.75a2.25 2.25 0 002.248-2.354M12 12.75a2.25 2.25 0 01-2.248-2.354M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 00-.399-2.25M12 8.25c-.995 0-1.97-.08-2.922-.236-.402-.066-.74-.358-.795-.762a3.734 3.734 0 01.4-2.253M12 8.25a2.25 2.25 0 00-2.248 2.146M12 8.25a2.25 2.25 0 012.248 2.146M8.683 5a6.032 6.032 0 01-1.155-1.002c.07-.63.27-1.222.574-1.747m.581 2.749A3.75 3.75 0 0112 3.75c1.274 0 2.404.634 3.087 1.603m-.17-.354c.304.525.504 1.117.574 1.747A6.034 6.034 0 0115.317 5",
    cloud: "M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z",
    questions: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z",
    encrypt: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
  }
  const onlineTotal = (stats?.onlineUsers ?? 0) + (stats?.onlineVisitors ?? 0)

  const avgStars = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1) : "—"
  const openBugs = bugs.filter(b => b.status !== "resolved" && b.status !== "closed").length
  const verifiedUsers = users.filter(u => u.emailVerified).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0b1333] to-[#020617]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center"><img src="/logo.png" className="w-24 sm:w-28 h-auto object-contain" alt="DocM" /></Link>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${isOwner ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border border-red-400/20" : "bg-amber-500/20 text-amber-400 border border-amber-400/20"}`}>
              {isOwner ? "Owner Panel" : "Admin Panel"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {stats && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-400/20">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                <span className="text-[11px] font-medium text-green-400">{onlineTotal} online</span>
                <span className="text-[10px] text-green-400/60 hidden sm:inline">({stats.onlineOwners ? `${stats.onlineOwners} owner, ` : ""}{stats.onlineAdmins ? `${stats.onlineAdmins} admin, ` : ""}{stats.onlineRegular ?? 0} users, {stats.onlineVisitors} guests)</span>
              </div>
            )}
            <Link href="/dashboard" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition">&larr; Profile</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* TABS */}
        <div className="flex gap-1.5 mb-6 flex-wrap">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 capitalize
                ${tab === t ? "bg-white/10 text-white border border-white/20 shadow-lg shadow-white/5" : "text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent"}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={tabIcons[t]} /></svg>
              {t}{t === "cloud" && cloudSizeLabel && <span className="text-purple-400/70 ml-1">{cloudSizeLabel}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin" /></div>
        ) : (
          <>
            {/* ═══ OVERVIEW ═══ */}
            {tab === "overview" && stats && (
              <div className="space-y-6">
                {/* Stats Grid — 2 symmetric rows */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <StatCard label="Total Users" value={stats.totalUsers} color="text-blue-400" />
                  <StatCard label="Premium" value={stats.premiumUsers} color="text-amber-400" />
                  <StatCard label="Free" value={stats.freeUsers} color="text-white/60" />
                  <StatCard label="Total Files" value={stats.totalFiles} color="text-emerald-400" />
                  <StatCard label="Verified" value={verifiedUsers} color="text-green-400" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <StatCard label="Total Visits" value={stats.totalVisits} color="text-purple-400" />
                  <StatCard label="Today" value={stats.todayVisits} color="text-cyan-400" />
                  <StatCard label="This Week" value={stats.weekVisits} color="text-pink-400" />
                  <StatCard label="Avg/Day" value={stats.weekVisits > 0 ? Math.round(stats.weekVisits / 7) : 0} color="text-orange-400" />
                  <StatCard label="Reviews" value={reviews.length} color="text-purple-400" subtitle={`${avgStars} avg \u2605`} />
                </div>

                {/* Two-column info cards */}
                <div className="grid lg:grid-cols-2 gap-4">
                  {/* Recent Users */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white">Recent Users</h3>
                      <button onClick={() => setTab("users")} className="text-[10px] text-white/30 hover:text-white/60 transition">View all &rarr;</button>
                    </div>
                    <div className="space-y-2">
                      {stats.recentUsers.slice(0, 5).map(u => (
                        <div key={u.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03]">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-[10px]">{u.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-white/80 truncate">{u.name}</p>
                              <p className="text-[10px] text-white/30 truncate">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${u.plan === "premium" ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-white/30"}`}>{u.plan}</span>
                            <span className="text-[10px] text-white/20">{new Date(u.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                      {stats.recentUsers.length === 0 && <p className="text-white/30 text-xs text-center py-4">No users yet</p>}
                    </div>
                  </div>

                  {/* Health & Summary */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-semibold text-white mb-4">Platform Health</h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-white/[0.03] text-center">
                        <p className="text-lg font-bold text-emerald-400">{verifiedUsers || stats.totalUsers}</p>
                        <p className="text-[10px] text-white/30">Verified Emails</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] text-center">
                        <p className={`text-lg font-bold ${openBugs > 0 ? "text-red-400" : "text-emerald-400"}`}>{openBugs}</p>
                        <p className="text-[10px] text-white/30">Open Bugs</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] text-center">
                        <p className="text-lg font-bold text-yellow-400">{avgStars}</p>
                        <p className="text-[10px] text-white/30">Avg Rating</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] text-center">
                        <p className="text-lg font-bold text-purple-400">{reviews.filter(r => r.pinned).length}</p>
                        <p className="text-[10px] text-white/30">Pinned Reviews</p>
                      </div>
                    </div>
                    {/* Quick actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setTab("activity")} className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition">Activity Log</button>
                      <button onClick={() => setTab("cloud")} className="p-2 rounded-lg bg-purple-500/10 border border-purple-400/20 text-purple-400 text-[11px] font-medium hover:bg-purple-500/20 transition">Cloud Files</button>
                      <button onClick={() => setTab("reviews")} className="p-2 rounded-lg bg-amber-500/10 border border-amber-400/20 text-amber-400 text-[11px] font-medium hover:bg-amber-500/20 transition">Reviews</button>
                      <button onClick={() => setTab("bugs")} className="p-2 rounded-lg bg-red-500/10 border border-red-400/20 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition">Bug Reports</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ USERS ═══ */}
            {tab === "users" && (
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">All Users ({users.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-white/40 text-left border-b border-white/10">
                        <th className="pb-2.5 pr-3">User</th>
                        <th className="pb-2.5 pr-3">Role</th>
                        <th className="pb-2.5 pr-3">Plan</th>
                        <th className="pb-2.5 pr-3">Verified</th>
                        <th className="pb-2.5 pr-3">Files</th>
                        <th className="pb-2.5 pr-3">Joined</th>
                        <th className="pb-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2">
                              <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-[10px]">{u.name.charAt(0).toUpperCase()}</span>
                                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0b1333] ${u.isOnline ? "bg-green-500" : "bg-white/20"}`} title={u.isOnline ? "Online" : "Offline"} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-white/80 font-medium truncate">{u.name}</p>
                                <p className="text-white/30 text-[10px] truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 pr-3">
                            <select value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value })}
                              className="bg-[#0b1333] border border-white/10 rounded-lg px-1.5 py-1 text-[11px] text-white focus:outline-none">
                              <option value="user">user</option><option value="admin">admin</option><option value="owner">owner</option>
                            </select>
                          </td>
                          <td className="py-2.5 pr-3">
                            <select value={u.plan} onChange={(e) => { const p = e.target.value; if (p === "premium") { const dur = prompt("Duration: 1w / 2w / 1m / 1y", "1m"); if (dur && ["1w","2w","1m","1y"].includes(dur)) updateUser(u.id, { plan: p, premiumDuration: dur }) } else updateUser(u.id, { plan: p }) }}
                              className="bg-[#0b1333] border border-white/10 rounded-lg px-1.5 py-1 text-[11px] text-white focus:outline-none">
                              <option value="free">free</option><option value="premium">premium</option><option value="friend">friend</option>
                            </select>
                          </td>
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => updateUser(u.id, { email_verified: !u.emailVerified })}
                                className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition ${u.emailVerified ? "bg-emerald-500/15 text-emerald-400 hover:bg-red-500/15 hover:text-red-400" : "bg-red-500/15 text-red-400 hover:bg-emerald-500/15 hover:text-emerald-400"}`}>
                                {u.emailVerified ? "Verified" : "Unverified"}
                              </button>
                              {u.emailVerified && (
                                <button onClick={() => resendVerifyEmail(u.id)} title="Reset to unverified"
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition">Re-verify</button>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 pr-3 text-white/50">{u._count.files}</td>
                          <td className="py-2.5 pr-3 text-white/30">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="py-2.5">
                            {isOwner && <button onClick={() => deleteUser(u.id)} className="text-[10px] text-red-400/40 hover:text-red-400 transition">Delete</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && <p className="text-white/30 text-xs py-8 text-center">No users found</p>}
                </div>
              </div>
            )}

            {/* ═══ ACTIVITY (files + logs merged) ═══ */}
            {tab === "activity" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => setActivityView("files")} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${activityView === "files" ? "bg-white/10 text-white border border-white/20" : "text-white/40 hover:text-white/60 border border-transparent"}`}>
                    Uploaded Files ({files.length})
                  </button>
                  <button onClick={() => setActivityView("logs")} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${activityView === "logs" ? "bg-white/10 text-white border border-white/20" : "text-white/40 hover:text-white/60 border border-transparent"}`}>
                    Access Logs ({logs.length})
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  {activityView === "files" ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-white/40 text-left border-b border-white/10">
                            <th className="pb-2.5 pr-3">File Name</th>
                            <th className="pb-2.5 pr-3">Type</th>
                            <th className="pb-2.5 pr-3">Size</th>
                            <th className="pb-2.5 pr-3">Tool</th>
                            <th className="pb-2.5 pr-3">User</th>
                            <th className="pb-2.5">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {files.map(f => (
                            <tr key={f.id} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="py-2.5 pr-3 text-white/80 font-medium truncate max-w-[180px]">{f.fileName}</td>
                              <td className="py-2.5 pr-3"><span className="px-1.5 py-0.5 rounded bg-white/5 text-white/50">{f.fileType}</span></td>
                              <td className="py-2.5 pr-3 text-white/50">{f.fileSize < 1024 * 1024 ? (f.fileSize / 1024).toFixed(1) + " KB" : (f.fileSize / (1024 * 1024)).toFixed(1) + " MB"}</td>
                              <td className="py-2.5 pr-3 text-white/40">{f.toolUsed || "\u2014"}</td>
                              <td className="py-2.5 pr-3">
                                <p className="text-white/60">{f.user.name}</p>
                                <p className="text-white/25 text-[10px]">{f.user.email}</p>
                              </td>
                              <td className="py-2.5 text-white/30">{new Date(f.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {files.length === 0 && <p className="text-white/30 text-xs py-8 text-center">No files uploaded yet</p>}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-white/40 text-left border-b border-white/10">
                            <th className="pb-2.5 pr-3">User</th>
                            <th className="pb-2.5 pr-3">Page</th>
                            <th className="pb-2.5">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map(l => (
                            <tr key={l.id} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="py-2 pr-3">
                                <p className="text-white/70">{l.user_name || "Guest"}</p>
                                <p className="text-white/25 text-[10px]">{l.user_email || "\u2014"}</p>
                              </td>
                              <td className="py-2 pr-3 text-white/50 font-mono">{l.page}</td>
                              <td className="py-2 text-white/30">{new Date(l.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {logs.length === 0 && <p className="text-white/30 text-xs py-8 text-center">No logs yet</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ REVIEWS ═══ */}
            {tab === "reviews" && (
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Reviews ({reviews.length})</h3>
                  <p className="text-[10px] text-white/30">Pin to show on main page</p>
                </div>
                <div className="space-y-2">
                  {reviews.map(r => (
                    <div key={r.id} className={`p-4 rounded-xl border transition ${r.pinned ? "bg-amber-500/10 border-amber-400/20" : r.hidden ? "bg-white/[0.02] border-white/5 opacity-50" : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-xs font-medium text-white/80">{r.user_name}</p>
                            <p className="text-[10px] text-white/30">{r.user_email}</p>
                            <div className="flex gap-0.5">{[1,2,3,4,5].map(s => (<span key={s} className={`text-[10px] ${s <= r.stars ? "text-yellow-400" : "text-white/15"}`}>{"\u2605"}</span>))}</div>
                            {r.pinned && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">Pinned</span>}
                            {r.hidden && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/40 font-medium">Hidden</span>}
                          </div>
                          <p className="text-xs text-white/60">&ldquo;{r.text}&rdquo;</p>
                          <p className="text-[10px] text-white/20 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button onClick={() => toggleReview(r.id, "pinned", !r.pinned)} className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition ${r.pinned ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-white/40 hover:text-amber-400"}`}>{r.pinned ? "Unpin" : "Pin"}</button>
                          <button onClick={() => toggleReview(r.id, "hidden", !r.hidden)} className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition ${r.hidden ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-white/40 hover:text-blue-400"}`}>{r.hidden ? "Show" : "Hide"}</button>
                          <button onClick={() => deleteReview(r.id)} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 text-red-400/50 hover:text-red-400 transition">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {reviews.length === 0 && <p className="text-white/30 text-xs py-8 text-center">No reviews yet</p>}
                </div>
              </div>
            )}

            {/* ═══ BUGS ═══ */}
            {tab === "bugs" && (
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-4">Bug Reports ({bugs.length})</h3>
                <div className="space-y-2">
                  {bugs.map(b => {
                    const isExpanded = expandedBug === b.id
                    const preview = b.description.length > 100 ? b.description.slice(0, 100) + "..." : b.description
                    return (
                    <div key={b.id} className="rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition border border-white/5 overflow-hidden">
                      <div className="p-4 cursor-pointer" onClick={() => setExpandedBug(isExpanded ? null : b.id)}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-xs font-semibold text-white/90">{b.title}</p>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${b.status === "open" ? "bg-red-500/20 text-red-400" : b.status === "in_progress" ? "bg-amber-500/20 text-amber-400" : b.status === "resolved" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/40"}`}>{b.status}</span>
                              <svg className={`w-3 h-3 text-white/30 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                            </div>
                            <p className="text-xs text-white/50 mb-1">{isExpanded ? b.description : preview}</p>
                            <p className="text-[10px] text-white/25">{b.user_name} ({b.user_email}) &middot; {new Date(b.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                            <select value={b.status} onChange={(e) => updateBugStatus(b.id, e.target.value)} className="bg-[#0b1333] border border-white/10 rounded-lg px-1.5 py-1 text-[11px] text-white focus:outline-none">
                              <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                            </select>
                            <button onClick={() => deleteBug(b.id)} className="text-[10px] text-red-400/40 hover:text-red-400 transition">Delete</button>
                          </div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 border-t border-white/5">
                          <p className="text-xs text-white/60 whitespace-pre-wrap leading-relaxed">{b.description}</p>
                        </div>
                      )}
                    </div>
                    )
                  })}
                  {bugs.length === 0 && <p className="text-white/30 text-xs py-8 text-center">No bug reports yet</p>}
                </div>
              </div>
            )}

            {/* ═══ CLOUD FILES ═══ */}
            {tab === "cloud" && (
              <div className="space-y-4">
                {!cloudSelectedUser ? (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-semibold text-white mb-4">Users with Cloud Files ({cloudUsers.length})</h3>
                    {cloudUsers.length === 0 ? (
                      <p className="text-white/30 text-xs py-8 text-center">No users have cloud files yet</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {cloudUsers.map(u => (
                          <button key={u.id} onClick={() => loadCloudUserFiles(u)}
                            className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] transition text-left w-full">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-xs">{u.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white/80 truncate">{u.name}</p>
                              <p className="text-[10px] text-white/30 truncate">{u.email}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-semibold text-purple-400">{u.cloudFiles}</p>
                              <p className="text-[10px] text-white/25">{u.cloudSize < 1024 * 1024 ? (u.cloudSize / 1024).toFixed(1) + " KB" : (u.cloudSize / (1024 * 1024)).toFixed(1) + " MB"}</p>
                            </div>
                            <svg className="w-3.5 h-3.5 text-white/15 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-5">
                      <button onClick={() => { setCloudSelectedUser(null); setCloudFiles([]) }} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition">&larr; Back</button>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{cloudSelectedUser.name}&apos;s Cloud</h3>
                        <p className="text-[10px] text-white/30">{cloudSelectedUser.email}</p>
                      </div>
                      <div className="flex-1" />
                      <span className="text-xs text-purple-400 font-medium">{cloudFiles.length} file{cloudFiles.length !== 1 ? "s" : ""}</span>
                    </div>
                    {cloudLoading ? (
                      <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>
                    ) : cloudFiles.length === 0 ? (
                      <p className="text-white/30 text-xs py-8 text-center">No cloud files</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead><tr className="text-white/40 text-left border-b border-white/10"><th className="pb-2.5 pr-3">Name</th><th className="pb-2.5 pr-3">Type</th><th className="pb-2.5 pr-3">Size</th><th className="pb-2.5 pr-3">Tool</th><th className="pb-2.5 pr-3">Date</th><th className="pb-2.5">Actions</th></tr></thead>
                          <tbody>
                            {cloudFiles.map(f => (
                              <tr key={f.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                <td className="py-2.5 pr-3 text-white/80 font-medium truncate max-w-[180px]">{f.file_name}</td>
                                <td className="py-2.5 pr-3"><span className="px-1.5 py-0.5 rounded bg-white/5 text-white/50 text-[10px]">{f.file_type.toUpperCase()}</span></td>
                                <td className="py-2.5 pr-3 text-white/50">{f.file_size < 1024 ? f.file_size + " B" : f.file_size < 1024 * 1024 ? (f.file_size / 1024).toFixed(1) + " KB" : (f.file_size / (1024 * 1024)).toFixed(1) + " MB"}</td>
                                <td className="py-2.5 pr-3 text-white/40">{f.tool_used || "\u2014"}</td>
                                <td className="py-2.5 pr-3 text-white/30">{new Date(f.created_at).toLocaleDateString()}</td>
                                <td className="py-2.5">
                                  <div className="flex gap-1.5">
                                    <button onClick={() => adminViewCloudFile(f)} className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition">View</button>
                                    <button onClick={() => adminDeleteCloudFile(f.id)} className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">Delete</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {cloudViewing && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={closeCloudView}>
                    <div className="w-full max-w-3xl max-h-[85vh] bg-[#0d1340] border border-white/10 rounded-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                      <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white truncate">{cloudViewing.file_name}</h3>
                        <button onClick={closeCloudView} className="text-white/40 hover:text-white/70 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                        {!cloudViewUrl ? (<div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                        ) : ["jpg","jpeg","png","webp","bmp","gif","svg"].includes(cloudViewing.file_type.toLowerCase()) ? (
                          <img src={cloudViewUrl} alt={cloudViewing.file_name} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
                        ) : cloudViewing.file_type.toLowerCase() === "pdf" ? (
                          <iframe src={cloudViewUrl} className="w-full h-[70vh] rounded-lg border border-white/10" />
                        ) : ["txt","csv","md","json"].includes(cloudViewing.file_type.toLowerCase()) ? (
                          <AdminTextPreview url={cloudViewUrl} />
                        ) : (
                          <div className="text-center text-white/40 space-y-2">
                            <svg className="w-12 h-12 mx-auto text-white/10" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                            <p className="text-xs">No preview for .{cloudViewing.file_type}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ ENCRYPT RECORDS ═══ */}
            {tab === "encrypt" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => setEncryptSubTab("records")} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${encryptSubTab === "records" ? "bg-white/10 text-white border border-white/20" : "text-white/40 hover:text-white/60 border border-transparent"}`}>
                    Encryption Records ({encryptRecords.length})
                  </button>
                  <button onClick={() => setEncryptSubTab("recovery")} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${encryptSubTab === "recovery" ? "bg-white/10 text-white border border-white/20" : "text-white/40 hover:text-white/60 border border-transparent"}`}>
                    Recovery Requests ({recoveryRequests.length})
                    {recoveryRequests.filter(r => r.status === "pending").length > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px]">{recoveryRequests.filter(r => r.status === "pending").length} new</span>}
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  {encryptSubTab === "records" ? (
                    <>
                      <h3 className="text-sm font-semibold text-white mb-4">All Encryption Records</h3>
                      <p className="text-[10px] text-white/30 mb-3">Every PDF encrypted through DocFlow is logged here with the password used.</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-white/40 text-left border-b border-white/10">
                              <th className="pb-2.5 pr-3">User</th>
                              <th className="pb-2.5 pr-3">Original File</th>
                              <th className="pb-2.5 pr-3">Encrypted File</th>
                              <th className="pb-2.5 pr-3">Password</th>
                              <th className="pb-2.5 pr-3">Size</th>
                              <th className="pb-2.5">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {encryptRecords.map(r => (
                              <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                <td className="py-2.5 pr-3">
                                  <p className="text-white/70">{r.user_name}</p>
                                  <p className="text-white/25 text-[10px]">{r.user_email}</p>
                                </td>
                                <td className="py-2.5 pr-3 text-white/50 truncate max-w-[150px]">{r.original_name || "\u2014"}</td>
                                <td className="py-2.5 pr-3 text-orange-400/70 truncate max-w-[150px]">{r.file_name}</td>
                                <td className="py-2.5 pr-3"><span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-300 font-mono text-[11px] select-all">{r.encrypt_password || "\u2014"}</span></td>
                                <td className="py-2.5 pr-3 text-white/40">{r.file_size < 1024 * 1024 ? (r.file_size / 1024).toFixed(1) + " KB" : (r.file_size / (1024 * 1024)).toFixed(1) + " MB"}</td>
                                <td className="py-2.5 text-white/30">{new Date(r.encrypted_at).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {encryptRecords.length === 0 && <p className="text-white/30 text-xs py-8 text-center">No encryption records yet</p>}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-sm font-semibold text-white mb-4">Password Recovery Requests</h3>
                      <p className="text-[10px] text-white/30 mb-3">Users who forgot their encryption password and requested recovery assistance.</p>
                      <div className="space-y-2">
                        {recoveryRequests.map(r => (
                          <div key={r.id} className={`p-4 rounded-xl border transition ${r.status === "pending" ? "bg-amber-500/5 border-amber-500/20" : r.status === "resolved" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/[0.03] border-white/5"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="text-xs font-medium text-white/80">{r.user_name}</p>
                                  <p className="text-[10px] text-white/30">{r.user_email}</p>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${r.status === "pending" ? "bg-amber-500/20 text-amber-400" : r.status === "resolved" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/40"}`}>{r.status}</span>
                                </div>
                                <p className="text-xs text-white/50">File: <span className="text-orange-400/70">{r.file_name}</span></p>
                                <p className="text-[10px] text-white/25 mt-1">{new Date(r.requested_at).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {r.status === "pending" && (
                                  <button onClick={async () => { await fetch("/api/encrypt-recovery", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, status: "resolved" }) }); setRecoveryRequests(prev => prev.map(rr => rr.id === r.id ? { ...rr, status: "resolved" } : rr)) }}
                                    className="text-[11px] px-2.5 py-1 rounded-lg font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition">Mark Resolved</button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {recoveryRequests.length === 0 && <p className="text-white/30 text-xs py-8 text-center">No recovery requests yet</p>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ═══ QUESTIONS ═══ */}
            {tab === "questions" && (
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-4">User Questions ({questions.length})</h3>
                <div className="space-y-2">
                  {questions.map(q => (
                    <div key={q.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/80 whitespace-pre-wrap mb-1">{q.question}</p>
                          <p className="text-[10px] text-white/25">{q.email} &middot; {new Date(q.created_at).toLocaleString()}</p>
                        </div>
                        <button onClick={() => deleteQuestion(q.id)} className="text-[10px] text-red-400/40 hover:text-red-400 transition flex-shrink-0">Delete</button>
                      </div>
                    </div>
                  ))}
                  {questions.length === 0 && <p className="text-white/30 text-xs py-8 text-center">No questions yet</p>}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value, color, pulse, subtitle }: { label: string; value: number; color: string; pulse?: boolean; subtitle?: string }) {
  return (
    <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.06] transition-all ${pulse ? "ring-1 ring-green-500/30" : ""}`}>
      <div className="flex items-center gap-2">
        {pulse && (<span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span></span>)}
        <p className={`text-xl font-bold ${color}`}>{value.toLocaleString('en-US')}</p>
      </div>
      <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
      {subtitle && <p className="text-[9px] text-white/25 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function AdminTextPreview({ url }: { url: string }) {
  const [text, setText] = useState("")
  useEffect(() => { fetch(url).then(r => r.text()).then(setText).catch(() => setText("Failed to load")) }, [url])
  return <pre className="w-full max-h-[70vh] overflow-auto text-xs text-white/70 bg-white/5 rounded-lg p-4 whitespace-pre-wrap font-mono">{text}</pre>
}
