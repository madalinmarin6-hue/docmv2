import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../lib/auth"
import { supabaseAdmin } from "../../../../../lib/supabase"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const currentUser = session?.user as { id: string; role: string } | undefined

    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { plan, role, premiumDuration, email_verified } = body

    const updateData: Record<string, unknown> = {}
    if (plan && ["free", "premium", "friend"].includes(plan)) updateData.plan = plan
    if (role && ["user", "admin", "owner"].includes(role)) updateData.role = role
    if (typeof email_verified === "boolean") {
      updateData.email_verified = email_verified
      if (!email_verified) updateData.verify_token = null
    }

    // Set premium_until based on duration selection
    if (plan === "premium" && premiumDuration) {
      const now = new Date()
      const durationDays: Record<string, number> = {
        "1w": 7, "2w": 14, "1m": 30, "1y": 365,
      }
      const days = durationDays[premiumDuration]
      if (days) {
        now.setDate(now.getDate() + days)
        updateData.premium_until = now.toISOString()
      }
    }
    // Clear premium_until if downgrading to free
    if (plan === "free") {
      updateData.premium_until = null
    }

    const { data: updated } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select("id, name, email, role, plan, premium_until")
      .single()

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Admin update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const currentUser = session?.user as { id: string; role: string } | undefined

    if (!currentUser || currentUser.role !== "owner") {
      return NextResponse.json({ error: "Only owners can delete users" }, { status: 403 })
    }

    const { id } = await params

    await supabaseAdmin.from("users").delete().eq("id", id)

    return NextResponse.json({ message: "User deleted" })
  } catch (error) {
    console.error("Admin delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
