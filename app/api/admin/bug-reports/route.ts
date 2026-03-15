import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { role?: string } | undefined
    if (!sessionUser || (sessionUser.role !== "admin" && sessionUser.role !== "owner")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch bug reports" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err) {
    console.error("Admin bug reports GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { role?: string } | undefined
    if (!sessionUser || (sessionUser.role !== "admin" && sessionUser.role !== "owner")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ error: "ID and status required" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("bug_reports")
      .update({ status })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 })
    }

    return NextResponse.json({ message: "Updated" })
  } catch (err) {
    console.error("Admin bug reports PATCH error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { role?: string } | undefined
    if (!sessionUser || (sessionUser.role !== "admin" && sessionUser.role !== "owner")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("bug_reports")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
    }

    return NextResponse.json({ message: "Deleted" })
  } catch (err) {
    console.error("Admin bug reports DELETE error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
