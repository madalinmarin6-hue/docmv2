import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth"
import { supabaseAdmin } from "../../../../lib/supabase"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { id: string; plan?: string; role?: string } | undefined

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileName, fileSize, fileType, toolUsed } = await req.json()

    // Get current user data for edit tracking (select * to avoid missing column errors)
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", sessionUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const today = new Date().toISOString().split("T")[0]
    const isNewDay = user.daily_edits_date !== today
    const currentUsed = isNewDay ? 0 : (user.daily_edits_used ?? 0)
    const isUnlimited = user.plan === "premium" || user.plan === "friend" || user.role === "owner"

    if (!isUnlimited && currentUsed >= 10 && (user.bonus_edits ?? 0) <= 0) {
      return NextResponse.json({
        error: "Daily edit limit reached. Upgrade to Premium or watch ads for bonus edits.",
        editsUsed: currentUsed,
        editsLeft: 0,
        bonusEdits: 0,
      }, { status: 429 })
    }

    // Decrement bonus if over daily limit
    let newBonusEdits = user.bonus_edits ?? 0
    let newDailyUsed = currentUsed + 1
    if (!isUnlimited && currentUsed >= 10 && newBonusEdits > 0) {
      newBonusEdits = newBonusEdits - 1
    }

    // Update user daily tracking
    const updatePayload: Record<string, unknown> = {
      daily_edits_used: isNewDay ? 1 : newDailyUsed,
      daily_edits_date: today,
      bonus_edits: newBonusEdits,
    }

    // Increment total_files if column exists
    if (typeof user.total_files === "number") {
      updatePayload.total_files = user.total_files + 1
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update(updatePayload)
      .eq("id", sessionUser.id)

    if (updateError) {
      console.error("Track edit - user update failed:", updateError, "payload:", updatePayload)
    }

    // Insert file record (always, regardless of user update)
    await supabaseAdmin.from("files").insert({
      user_id: sessionUser.id,
      file_name: fileName || "unknown",
      file_size: fileSize || 0,
      file_type: fileType || "unknown",
      tool_used: toolUsed || null,
    })

    // Increment site stats (ignore errors if function doesn't exist)
    try { await supabaseAdmin.rpc("increment_stat", { stat_name: "total_files" }) } catch { /* ignore */ }

    const editsLeft = isUnlimited ? -1 : Math.max(0, 10 - newDailyUsed)

    return NextResponse.json({
      success: true,
      editsUsed: newDailyUsed,
      editsLeft,
      bonusEdits: newBonusEdits,
      unlimited: isUnlimited,
    })
  } catch (error) {
    console.error("Track edit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
