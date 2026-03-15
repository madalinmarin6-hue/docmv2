import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth"
import { supabaseAdmin } from "../../../../lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { role?: string } | undefined
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: reviews } = await supabaseAdmin
      .from("reviews")
      .select("id, user_id, user_name, user_email, text, stars, pinned, hidden, created_at")
      .order("created_at", { ascending: false })

    return NextResponse.json(reviews || [])
  } catch (error) {
    console.error("Admin reviews GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { role?: string } | undefined
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "Review ID required" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("reviews")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin reviews DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { role?: string } | undefined
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id, pinned, hidden } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "Review ID required" }, { status: 400 })
    }

    const updateData: Record<string, boolean> = {}
    if (typeof pinned === "boolean") updateData.pinned = pinned
    if (typeof hidden === "boolean") updateData.hidden = hidden

    const { data: review, error } = await supabaseAdmin
      .from("reviews")
      .update(updateData)
      .eq("id", id)
      .select("id, user_name, user_email, text, stars, pinned, hidden, created_at")
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error("Admin reviews PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
