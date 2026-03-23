import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth"
import { supabaseAdmin } from "../../../../lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined

    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, name, email, role, plan, email_verified, created_at, cloud_enabled, daily_edits_used, daily_edits_date, bonus_edits")
      .order("created_at", { ascending: false })

    // Get online user data from active_visitors (last 2 minutes) — includes IP, location, page
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const onlineMap: Record<string, { ip: string; country: string; city: string; page: string }> = {}
    try {
      const { data: onlineRows } = await supabaseAdmin
        .from("active_visitors")
        .select("user_id, ip, country, city, page")
        .gte("last_ping", twoMinAgo)
        .not("user_id", "is", null)
      for (const r of onlineRows || []) {
        if (r.user_id) {
          onlineMap[r.user_id] = {
            ip: r.ip || "Unknown",
            country: r.country || "Unknown",
            city: r.city || "Unknown",
            page: r.page || "/",
          }
        }
      }
    } catch { /* ignore if table doesn't exist */ }

    const today = new Date().toISOString().split("T")[0]

    // Get file counts per user
    const result = await Promise.all(
      (users || []).map(async (u) => {
        const { count } = await supabaseAdmin
          .from("files").select("*", { count: "exact", head: true }).eq("user_id", u.id)

        const fileCount = count || 0
        const isUnlimited = u.plan === "premium" || u.plan === "friend" || u.role === "owner"
        const usedToday = u.daily_edits_date === today ? (u.daily_edits_used ?? 0) : 0
        const editsLeft = isUnlimited ? -1 : Math.max(0, 10 - usedToday)
        const online = onlineMap[u.id] || null

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          plan: u.plan,
          emailVerified: u.email_verified,
          cloudEnabled: u.cloud_enabled ?? false,
          createdAt: u.created_at,
          isOnline: !!online,
          _count: { files: fileCount },
          editsLeft,
          bonusEdits: u.bonus_edits ?? 0,
          hasConverted: fileCount > 0,
          ip: online?.ip || null,
          country: online?.country || null,
          city: online?.city || null,
          currentPage: online?.page || null,
        }
      })
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Admin users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
