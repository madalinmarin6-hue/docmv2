import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth"
import { supabaseAdmin } from "../../../../lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    const { data } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    const { title, description } = await req.json()
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title required" }, { status: 400 })
    }
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert({ id, title: title.trim(), description: description?.trim() || null, status: "pending", created_at: now, updated_at: now })
      .select("*")
      .single()
    if (error || !data) {
      console.error("Task insert error:", error)
      return NextResponse.json({ error: error?.message || "Insert failed", details: error?.details, hint: error?.hint }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error("Task create exception:", e)
    return NextResponse.json({ error: "Failed to create task", message: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    const body = await req.json()
    const { id, status, solution, title, description } = body
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status) updateData.status = status
    if (typeof solution === "string") updateData.solution = solution
    if (typeof title === "string") updateData.title = title.trim()
    if (typeof description === "string") updateData.description = description.trim() || null
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single()
    if (error || !data) return NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    await supabaseAdmin.from("tasks").delete().eq("id", id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
