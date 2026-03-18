import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { id: string; name?: string; email?: string } | undefined

    const { fileName, fileSize, timestamp } = await req.json()

    const { error } = await supabaseAdmin
      .from("encrypt_recovery_requests")
      .insert({
        user_id: sessionUser?.id || "anonymous",
        user_name: sessionUser?.name || "Anonymous",
        user_email: sessionUser?.email || "",
        file_name: fileName || "",
        file_size: fileSize || 0,
        requested_at: timestamp || new Date().toISOString(),
        status: "pending",
      })

    if (error) {
      console.error("Recovery request insert error:", error)
      return NextResponse.json({ error: "Failed to submit request" }, { status: 500 })
    }

    return NextResponse.json({ message: "Recovery request submitted" })
  } catch (err) {
    console.error("Recovery request error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { role?: string } | undefined
    if (user?.role !== "owner" && user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id, status: newStatus } = await req.json()
    if (!id || !newStatus) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("encrypt_recovery_requests")
      .update({ status: newStatus })
      .eq("id", id)

    if (error) {
      console.error("Recovery request update error:", error)
      return NextResponse.json({ error: "Failed to update" }, { status: 500 })
    }

    return NextResponse.json({ message: "Updated" })
  } catch (err) {
    console.error("Recovery request patch error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { role?: string } | undefined
    if (user?.role !== "owner" && user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from("encrypt_recovery_requests")
      .select("*")
      .order("requested_at", { ascending: false })
      .limit(200)

    if (error) {
      console.error("Recovery requests fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 })
    }

    return NextResponse.json({ requests: data || [] })
  } catch (err) {
    console.error("Recovery requests error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
