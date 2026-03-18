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
      .select("id, name, email, role, plan, email_verified, created_at")
      .order("created_at", { ascending: false })

    // Get online user IDs from active_visitors (last 2 minutes)
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    let onlineUserIds: Set<string> = new Set()
    try {
      const { data: onlineRows } = await supabaseAdmin
        .from("active_visitors")
        .select("user_id")
        .gte("last_ping", twoMinAgo)
        .not("user_id", "is", null)
      for (const r of onlineRows || []) {
        if (r.user_id) onlineUserIds.add(r.user_id)
      }
    } catch { /* ignore if table doesn't exist */ }

    // Get file counts per user
    const result = await Promise.all(
      (users || []).map(async (u) => {
        const { count } = await supabaseAdmin
          .from("files").select("*", { count: "exact", head: true }).eq("user_id", u.id)
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          plan: u.plan,
          emailVerified: u.email_verified,
          createdAt: u.created_at,
          isOnline: onlineUserIds.has(u.id),
          _count: { files: count || 0 },
        }
      })
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Admin users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
