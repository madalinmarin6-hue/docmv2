import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import bcrypt from "bcryptjs"
import { authOptions } from "../../../../lib/auth"
import { supabaseAdmin } from "../../../../lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { id: string } | undefined

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use select(*) to avoid failures from missing columns
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", sessionUser.id)
      .single()

    if (error || !user) {
      console.error("Profile fetch error:", error)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Always count from files table (reliable source of truth)
    const { count } = await supabaseAdmin
      .from("files")
      .select("*", { count: "exact", head: true })
      .eq("user_id", sessionUser.id)

    const totalFiles = count || 0

    // Update last_active for online tracking (ignore if column missing)
    try {
      await supabaseAdmin
        .from("users")
        .update({ last_active: new Date().toISOString() })
        .eq("id", sessionUser.id)
    } catch { /* last_active column may not exist yet */ }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      emailVerified: user.email_verified ?? false,
      avatar: user.avatar ?? null,
      createdAt: user.created_at,
      dailyEditsUsed: user.daily_edits_used ?? 0,
      dailyEditsDate: user.daily_edits_date ?? null,
      bonusEdits: user.bonus_edits ?? 0,
      totalFiles,
      cloudEnabled: user.cloud_enabled ?? true,
      _count: { files: totalFiles },
    })
  } catch (error) {
    console.error("Profile GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { id: string } | undefined

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, currentPassword, newPassword, cloudEnabled } = await req.json()

    const updateData: Record<string, string | boolean> = {}

    if (typeof cloudEnabled === "boolean") {
      updateData.cloud_enabled = cloudEnabled
    }

    if (name) {
      updateData.name = name
      updateData.nickname = name.toLowerCase().replace(/\s+/g, "")
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 })
      }

      const { data: user } = await supabaseAdmin
        .from("users").select("password").eq("id", sessionUser.id).single()

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    const { data: updated } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", sessionUser.id)
      .select("id, name, email, role, plan")
      .single()

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Profile PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
