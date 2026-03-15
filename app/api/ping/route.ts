import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../lib/auth"
import { supabaseAdmin } from "../../../lib/supabase"

export async function POST(req: Request) {
  try {
    const { visitorId } = await req.json()
    if (!visitorId) return NextResponse.json({ ok: false }, { status: 400 })

    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id || null

    // Upsert into active_visitors
    await supabaseAdmin.from("active_visitors").upsert(
      {
        visitor_id: visitorId,
        user_id: userId,
        last_ping: new Date().toISOString(),
      },
      { onConflict: "visitor_id" }
    )

    // Also update last_active on users table if logged in
    if (userId) {
      try {
        await supabaseAdmin
          .from("users")
          .update({ last_active: new Date().toISOString() })
          .eq("id", userId)
      } catch { /* ignore */ }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
