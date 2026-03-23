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

    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    // Get all active visitors (last 2 minutes = online)
    const { data: onlineRows } = await supabaseAdmin
      .from("active_visitors")
      .select("visitor_id, user_id, ip, page, country, city, first_seen, last_ping")
      .gte("last_ping", twoMinAgo)
      .order("last_ping", { ascending: false })

    // Get recently disconnected (2-10 min ago)
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: recentRows } = await supabaseAdmin
      .from("active_visitors")
      .select("visitor_id, user_id, ip, page, country, city, first_seen, last_ping")
      .lt("last_ping", twoMinAgo)
      .gte("last_ping", tenMinAgo)
      .order("last_ping", { ascending: false })

    // Resolve user names for logged-in visitors
    const allRows = [...(onlineRows || []), ...(recentRows || [])]
    const userIds = allRows.map(r => r.user_id).filter(Boolean)
    let userMap: Record<string, { name: string; email: string; role: string; plan: string }> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("id, name, email, role, plan")
        .in("id", userIds)
      for (const u of users || []) {
        userMap[u.id] = { name: u.name, email: u.email, role: u.role, plan: u.plan }
      }
    }

    const mapRow = (r: typeof allRows[0], isOnline: boolean) => ({
      visitorId: r.visitor_id,
      userId: r.user_id,
      ip: r.ip || "Unknown",
      page: r.page || "/",
      country: r.country || "Unknown",
      city: r.city || "Unknown",
      firstSeen: r.first_seen,
      lastPing: r.last_ping,
      isOnline,
      isGuest: !r.user_id,
      userName: r.user_id && userMap[r.user_id] ? userMap[r.user_id].name : null,
      userEmail: r.user_id && userMap[r.user_id] ? userMap[r.user_id].email : null,
      userRole: r.user_id && userMap[r.user_id] ? userMap[r.user_id].role : null,
      userPlan: r.user_id && userMap[r.user_id] ? userMap[r.user_id].plan : null,
    })

    const online = (onlineRows || []).map(r => mapRow(r, true))
    const recent = (recentRows || []).map(r => mapRow(r, false))

    return NextResponse.json({
      online,
      recent,
      totalOnline: online.length,
      onlineGuests: online.filter(v => v.isGuest).length,
      onlineUsers: online.filter(v => !v.isGuest).length,
    })
  } catch (error) {
    console.error("Admin visitors error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
