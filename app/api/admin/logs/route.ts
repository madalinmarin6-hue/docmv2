import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth"
import { supabaseAdmin } from "../../../../lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { role?: string } | undefined

    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: logs, error } = await supabaseAdmin
      .from("access_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) {
      // Table might not exist yet
      return NextResponse.json([])
    }

    return NextResponse.json(logs || [])
  } catch (error) {
    console.error("Admin logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
