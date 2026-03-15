import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import { supabaseAdmin } from "../../../../lib/supabase"

export async function POST(req: Request) {
  try {
    const { name, nickname, email, password, ref } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (!nickname || nickname.length < 3) {
      return NextResponse.json({ error: "Nickname must be at least 3 characters" }, { status: 400 })
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(nickname)) {
      return NextResponse.json({ error: "Nickname can only contain letters, numbers, underscores, dots, and hyphens" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one uppercase letter" }, { status: 400 })
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one special character" }, { status: 400 })
    }

    const { data: existingEmail } = await supabaseAdmin
      .from("users").select("id").eq("email", email).single()

    if (existingEmail) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const { data: existingNick } = await supabaseAdmin
      .from("users").select("id").eq("nickname", nickname.toLowerCase()).single()

    if (existingNick) {
      return NextResponse.json({ error: "This nickname is already taken" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const verifyToken = uuidv4()

    // Build insert data with only base columns
    const insertData: Record<string, unknown> = {
      name: name || email.split("@")[0],
      nickname: nickname.toLowerCase(),
      email,
      password: hashedPassword,
      verify_token: verifyToken,
    }

    // Look up referrer if ref code provided
    if (ref) {
      const { data: referrer } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("referral_code", ref)
        .single()
      if (referrer) insertData.referred_by = referrer.id
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .insert(insertData)
      .select("id")
      .single()

    if (error || !user) {
      console.error("Supabase insert error:", error)
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
    }

    await supabaseAdmin.rpc("increment_stat", { stat_name: "total_users", increment_by: 1 })

    return NextResponse.json({
      message: "Account created successfully",
      userId: user.id,
      verifyToken,
    })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
