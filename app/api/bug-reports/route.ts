import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { id: string; name?: string; email?: string } | undefined
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description } = await req.json()

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    if (title.length > 200) {
      return NextResponse.json({ error: "Title must be under 200 characters" }, { status: 400 })
    }

    if (description.length > 2000) {
      return NextResponse.json({ error: "Description must be under 2000 characters" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("bug_reports")
      .insert({
        user_id: sessionUser.id,
        user_name: sessionUser.name || "User",
        user_email: sessionUser.email || "",
        title: title.trim(),
        description: description.trim(),
      })

    if (error) {
      console.error("Bug report insert error:", error)
      return NextResponse.json({ error: "Failed to submit report" }, { status: 500 })
    }

    return NextResponse.json({ message: "Bug report submitted successfully" })
  } catch (err) {
    console.error("Bug report error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
