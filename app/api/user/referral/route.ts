import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { id: string } | undefined
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("referral_code")
      .eq("id", sessionUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate referral code if not exists
    let code = user.referral_code
    if (!code) {
      code = uuidv4().slice(0, 8)
      await supabaseAdmin
        .from("users")
        .update({ referral_code: code })
        .eq("id", sessionUser.id)
    }

    // Count successful referrals
    const { count } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("referred_by", sessionUser.id)
      .eq("email_verified", true)

    return NextResponse.json({
      referralCode: code,
      referralCount: count || 0,
    })
  } catch (err) {
    console.error("Referral GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
