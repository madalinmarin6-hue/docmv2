import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

// GET: fetch the global tool/section order
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("tool_order")
      .select("section_order")
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ section_order: null })
    }

    return NextResponse.json({ section_order: data.section_order })
  } catch {
    return NextResponse.json({ section_order: null })
  }
}

// PUT: save the global tool/section order (admin/owner only)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { role?: string; email?: string } | undefined
    if (!sessionUser || (sessionUser.role !== "admin" && sessionUser.role !== "owner")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { section_order } = await req.json()
    if (!Array.isArray(section_order)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    // Upsert: check if row exists
    const { data: existing } = await supabaseAdmin
      .from("tool_order")
      .select("id")
      .limit(1)
      .single()

    if (existing) {
      await supabaseAdmin
        .from("tool_order")
        .update({ section_order, updated_at: new Date().toISOString(), updated_by: sessionUser.email || "" })
        .eq("id", existing.id)
    } else {
      await supabaseAdmin
        .from("tool_order")
        .insert({ section_order, updated_by: sessionUser.email || "" })
    }

    return NextResponse.json({ message: "Saved" })
  } catch (err) {
    console.error("Tool order PUT error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
