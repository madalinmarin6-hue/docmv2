import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "../../../../lib/supabase"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("reset_token", token)
      .gt("reset_token_exp", new Date().toISOString())
      .single()

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await supabaseAdmin
      .from("users")
      .update({ password: hashedPassword, reset_token: null, reset_token_exp: null })
      .eq("id", user.id)

    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
