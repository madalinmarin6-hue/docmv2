import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth"
import { supabaseAdmin } from "../../../../lib/supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined

    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const [usersRes, filesRes, visitsRes, premiumRes, recentVisitsRes, recentUsersRes] = await Promise.all([
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("files").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("visits").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("plan", "premium"),
      supabaseAdmin.from("visits").select("*").order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("users").select("id, name, email, plan, created_at").order("created_at", { ascending: false }).limit(10),
    ])

    const totalUsers = usersRes.count || 0
    const totalFiles = filesRes.count || 0
    const totalVisits = visitsRes.count || 0
    const premiumUsers = premiumRes.count || 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: todayVisits } = await supabaseAdmin
      .from("visits").select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString())

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const { count: weekVisits } = await supabaseAdmin
      .from("visits").select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString())

    // Online tracking from active_visitors table (last 2 minutes)
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    let onlineUsers = 0
    let onlineVisitors = 0
    let onlineOwners = 0
    let onlineAdmins = 0
    let onlineRegular = 0
    try {
      // Get logged-in user IDs that are online
      const { data: onlineUserRows } = await supabaseAdmin
        .from("active_visitors")
        .select("user_id")
        .gte("last_ping", twoMinAgo)
        .not("user_id", "is", null)
      const onlineUserIds = (onlineUserRows || []).map(r => r.user_id).filter(Boolean)
      onlineUsers = onlineUserIds.length

      // Get roles for online users
      if (onlineUserIds.length > 0) {
        const { data: roleRows } = await supabaseAdmin
          .from("users")
          .select("id, role")
          .in("id", onlineUserIds)
        for (const r of roleRows || []) {
          if (r.role === "owner") onlineOwners++
          else if (r.role === "admin") onlineAdmins++
          else onlineRegular++
        }
      }

      // Count anonymous visitors (no user_id)
      const { count: visitorsOnline } = await supabaseAdmin
        .from("active_visitors")
        .select("*", { count: "exact", head: true })
        .gte("last_ping", twoMinAgo)
        .is("user_id", null)
      onlineVisitors = visitorsOnline || 0
    } catch {
      // Fallback to last_active on users table
      try {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { count: c } = await supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("last_active", fiveMinAgo)
        onlineUsers = c || 0
      } catch { /* ignore */ }
    }

    // Clean up old entries (older than 5 minutes)
    try {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      await supabaseAdmin.from("active_visitors").delete().lt("last_ping", fiveMinAgo)
    } catch { /* ignore */ }

    return NextResponse.json({
      totalUsers,
      totalFiles,
      totalVisits,
      premiumUsers,
      freeUsers: totalUsers - premiumUsers,
      todayVisits: todayVisits || 0,
      weekVisits: weekVisits || 0,
      onlineUsers,
      onlineVisitors,
      onlineOwners,
      onlineAdmins,
      onlineRegular,
      recentVisits: recentVisitsRes.data || [],
      recentUsers: recentUsersRes.data || [],
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
