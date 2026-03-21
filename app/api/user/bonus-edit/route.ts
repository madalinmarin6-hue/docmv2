import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth"
import { supabaseAdmin } from "../../../../lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { id: string } | undefined
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("bonus_edits, daily_ad_claims, daily_ad_claims_date")
      .eq("id", sessionUser.id)
      .single()

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const today = new Date().toISOString().split("T")[0]
    const claims = user.daily_ad_claims_date === today ? (user.daily_ad_claims ?? 0) : 0
    const adsRequired = claims < 3 ? 2 : 4

    return NextResponse.json({ bonusEdits: user.bonus_edits ?? 0, dailyAdClaims: claims, adsRequired })
  } catch (error) {
    console.error("Bonus edit GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { id: string } | undefined

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("bonus_edits, daily_ad_claims, daily_ad_claims_date")
      .eq("id", sessionUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const today = new Date().toISOString().split("T")[0]
    const isNewDay = user.daily_ad_claims_date !== today
    const currentClaims = isNewDay ? 0 : (user.daily_ad_claims ?? 0)
    const newClaims = currentClaims + 1

    const { data: updated } = await supabaseAdmin
      .from("users")
      .update({
        bonus_edits: (user.bonus_edits ?? 0) + 1,
        daily_ad_claims: newClaims,
        daily_ad_claims_date: today,
      })
      .eq("id", sessionUser.id)
      .select("bonus_edits, daily_ad_claims")
      .single()

    const nextAdsRequired = (updated?.daily_ad_claims ?? newClaims) < 3 ? 2 : 4

    return NextResponse.json({
      bonusEdits: updated?.bonus_edits || 0,
      dailyAdClaims: updated?.daily_ad_claims ?? newClaims,
      adsRequired: nextAdsRequired,
    })
  } catch (error) {
    console.error("Bonus edit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
