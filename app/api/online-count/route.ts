import { NextResponse } from "next/server"
import { supabaseAdmin } from "../../../lib/supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    // Count logged-in users online
    const { data: onlineUserRows } = await supabaseAdmin
      .from("active_visitors")
      .select("user_id")
      .gte("last_ping", twoMinAgo)
      .not("user_id", "is", null)

    const onlineUsers = (onlineUserRows || []).filter(r => r.user_id).length

    // Count anonymous guests online
    const { count: onlineGuests } = await supabaseAdmin
      .from("active_visitors")
      .select("*", { count: "exact", head: true })
      .gte("last_ping", twoMinAgo)
      .is("user_id", null)

    return NextResponse.json({
      users: onlineUsers,
      guests: onlineGuests || 0,
      total: onlineUsers + (onlineGuests || 0),
    })
  } catch {
    return NextResponse.json({ users: 0, guests: 0, total: 0 })
  }
}
