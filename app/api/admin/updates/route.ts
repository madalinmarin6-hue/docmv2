import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { role?: string } | undefined
    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from("site_updates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      // Table might not exist yet, try to create it
      if (error.code === "42P01") {
        return NextResponse.json({ updates: [] })
      }
      throw error
    }

    return NextResponse.json({ updates: data || [] })
  } catch {
    return NextResponse.json({ updates: [] })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { role?: string; name?: string } | undefined
    if (!user || user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { title, description, type } = await req.json()
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("site_updates")
      .insert({
        title: title.trim(),
        description: (description || "").trim(),
        type: type || "update",
        author: user.name || "Owner",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ update: data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { role?: string } | undefined
    if (!user || user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    await supabaseAdmin.from("site_updates").delete().eq("id", id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
