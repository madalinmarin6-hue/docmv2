import { NextResponse } from "next/server"
import { supabaseAdmin } from "../../../../lib/supabase"

export async function POST(req: Request) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 })
    }

    const { data: user } = await supabaseAdmin
      .from("users").select("id, referred_by").eq("verify_token", token).single()

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 })
    }

    const premiumUntil = new Date()
    premiumUntil.setDate(premiumUntil.getDate() + 7) // 1 week

    await supabaseAdmin
      .from("users")
      .update({ email_verified: true, verify_token: null })
      .eq("id", user.id)

    // Referral reward: grant both users 2 weeks premium
    if (user.referred_by) {
      // Grant new user 2 weeks premium
      await supabaseAdmin
        .from("users")
        .update({ plan: "premium", premium_until: premiumUntil.toISOString() })
        .eq("id", user.id)

      // Grant referrer 1 week premium (extend if already premium)
      const { data: referrer } = await supabaseAdmin
        .from("users")
        .select("premium_until")
        .eq("id", user.referred_by)
        .single()

      if (referrer) {
        const referrerExpiry = referrer.premium_until && new Date(referrer.premium_until) > new Date()
          ? new Date(referrer.premium_until)
          : new Date()
        referrerExpiry.setDate(referrerExpiry.getDate() + 7)
        await supabaseAdmin
          .from("users")
          .update({ plan: "premium", premium_until: referrerExpiry.toISOString() })
          .eq("id", user.referred_by)
      }
    }

    return NextResponse.json({ message: "Email verified successfully" })
  } catch (error) {
    console.error("Verify error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
