import { NextResponse } from "next/server"
import { supabaseAdmin } from "../../../lib/supabase"

export async function POST(req: Request) {
  try {
    const { page } = await req.json()
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    const userAgent = req.headers.get("user-agent") || "unknown"

    await supabaseAdmin
      .from("visits")
      .insert({ page: page || "/", ip, user_agent: userAgent })

    await supabaseAdmin.rpc("increment_stat", { stat_name: "total_visits", increment_by: 1 })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Visit tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
