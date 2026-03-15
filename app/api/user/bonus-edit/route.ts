import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth"
import { supabaseAdmin } from "../../../../lib/supabase"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { id: string } | undefined

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("bonus_edits")
      .eq("id", sessionUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Grant 1 bonus edit per ad watched (frontend enforces 2 ads)
    const { data: updated } = await supabaseAdmin
      .from("users")
      .update({ bonus_edits: user.bonus_edits + 1 })
      .eq("id", sessionUser.id)
      .select("bonus_edits")
      .single()

    return NextResponse.json({ bonusEdits: updated?.bonus_edits || 0 })
  } catch (error) {
    console.error("Bonus edit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
