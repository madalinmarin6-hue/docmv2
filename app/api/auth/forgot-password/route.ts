import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { supabaseAdmin } from "../../../../lib/supabase"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const { data: user } = await supabaseAdmin
      .from("users").select("id").eq("email", email).single()

    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json({ message: "If an account exists, a reset link has been sent" })
    }

    const resetToken = uuidv4()
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    await supabaseAdmin
      .from("users")
      .update({ reset_token: resetToken, reset_token_exp: resetTokenExp })
      .eq("id", user.id)

    // In production, send email with reset link
    // For now, return the token for development
    return NextResponse.json({
      message: "If an account exists, a reset link has been sent",
      resetToken, // Remove in production
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
