import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../lib/auth"
import { supabaseAdmin } from "../../../lib/supabase"

export async function POST(req: Request) {
  try {
    const { page } = await req.json()
    if (!page) {
      return NextResponse.json({ error: "Page required" }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const user = session?.user as { id?: string; name?: string; email?: string } | undefined

    try {
      await supabaseAdmin.from("access_logs").insert({
        user_id: user?.id || null,
        user_name: user?.name || "Guest",
        user_email: user?.email || null,
        page,
      })
    } catch {
      // Table might not exist yet - silently ignore
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
