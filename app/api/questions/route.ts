import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { id?: string; email?: string; name?: string } | undefined
    if (!sessionUser) {
      return NextResponse.json({ error: "You must be logged in to ask a question" }, { status: 401 })
    }

    const { question } = await req.json()

    if (!question || typeof question !== "string" || question.trim().length < 3) {
      return NextResponse.json({ error: "Question is required (min 3 characters)" }, { status: 400 })
    }

    const { data: saved, error } = await supabaseAdmin
      .from("questions")
      .insert({ email: sessionUser.email || "anonymous", question: question.trim() })
      .select("id")
      .single()

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json({ error: "Failed to submit question" }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: saved.id })
  } catch (error) {
    console.error("Question submission error:", error)
    return NextResponse.json({ error: "Failed to submit question" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data: questions } = await supabaseAdmin
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    return NextResponse.json(questions || [])
  } catch {
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { role?: string } | undefined
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    await supabaseAdmin.from("questions").delete().eq("id", id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 })
  }
}
