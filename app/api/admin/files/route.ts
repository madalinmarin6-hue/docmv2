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

    const { data: files } = await supabaseAdmin
      .from("files")
      .select("*, users!inner(name, email)")
      .order("created_at", { ascending: false })
      .limit(100)

    // Map to match the old Prisma format
    const result = (files || []).map((f: Record<string, unknown>) => {
      const u = f.users as { name: string; email: string } | null
      return {
        id: f.id,
        userId: f.user_id,
        fileName: f.file_name,
        fileSize: f.file_size,
        fileType: f.file_type,
        toolUsed: f.tool_used,
        createdAt: f.created_at,
        user: u ? { name: u.name, email: u.email } : null,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Admin files error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
