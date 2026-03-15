import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { email, question } = await req.json()

    if (!question || typeof question !== "string" || question.trim().length < 3) {
      return NextResponse.json({ error: "Question is required (min 3 characters)" }, { status: 400 })
    }

    const { data: saved, error } = await supabaseAdmin
      .from("questions")
      .insert({ email: email || "anonymous", question: question.trim() })
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
