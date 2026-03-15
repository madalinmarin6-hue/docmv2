import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../lib/auth"
import { supabaseAdmin } from "../../../lib/supabase"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const pinnedOnly = searchParams.get("pinned") === "true"

    let query = supabaseAdmin
      .from("reviews")
      .select("id, user_id, user_name, user_email, text, stars, pinned, hidden, created_at")
      .order("created_at", { ascending: false })

    if (pinnedOnly) {
      query = query.eq("pinned", true).eq("hidden", false)
    } else {
      query = query.eq("hidden", false).limit(100)
    }

    const { data: reviews } = await query

    return NextResponse.json(reviews || [])
  } catch (error) {
    console.error("Reviews GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; name?: string; email?: string } | undefined

    if (!user) {
      return NextResponse.json({ error: "You must be logged in to leave a review" }, { status: 401 })
    }

    const { text, stars } = await req.json()

    if (!text?.trim() || !stars || stars < 1 || stars > 5) {
      return NextResponse.json({ error: "Review text and rating (1-5) are required" }, { status: 400 })
    }

    const { data: review, error } = await supabaseAdmin
      .from("reviews")
      .insert({
        user_id: user.id,
        user_name: user.name || user.email?.split("@")[0] || "User",
        user_email: user.email || "",
        text: text.trim(),
        stars,
      })
      .select()
      .single()

    if (error) {
      console.error("Review insert error:", error)
      return NextResponse.json({ error: "Failed to save review" }, { status: 500 })
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error("Reviews POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
