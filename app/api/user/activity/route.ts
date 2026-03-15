import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { id: string } | undefined
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Recent files (last 10)
    const { data: recentFiles } = await supabaseAdmin
      .from("files")
      .select("id, file_name, file_type, file_size, tool_used, created_at")
      .eq("user_id", sessionUser.id)
      .order("created_at", { ascending: false })
      .limit(10)

    // Cloud storage usage
    const { data: cloudFiles } = await supabaseAdmin
      .from("cloud_files")
      .select("file_size")
      .eq("user_id", sessionUser.id)

    const cloudUsed = (cloudFiles || []).reduce((sum, f) => sum + (f.file_size || 0), 0)
    const cloudCount = cloudFiles?.length || 0

    // User plan for limit calc
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("plan, created_at")
      .eq("id", sessionUser.id)
      .single()

    const maxBytes = user?.plan === "premium" || user?.plan === "friend" ? 2 * 1024 * 1024 * 1024 : 500 * 1024 * 1024

    // Access logs (last 10)
    const { data: accessLogs } = await supabaseAdmin
      .from("access_logs")
      .select("page, created_at")
      .eq("user_id", sessionUser.id)
      .order("created_at", { ascending: false })
      .limit(10)

    // File type breakdown
    const { data: allFiles } = await supabaseAdmin
      .from("files")
      .select("file_type, tool_used")
      .eq("user_id", sessionUser.id)

    const typeBreakdown: Record<string, number> = {}
    const toolBreakdown: Record<string, number> = {}
    for (const f of allFiles || []) {
      const ext = (f.file_type || "other").toLowerCase()
      typeBreakdown[ext] = (typeBreakdown[ext] || 0) + 1
      if (f.tool_used) {
        toolBreakdown[f.tool_used] = (toolBreakdown[f.tool_used] || 0) + 1
      }
    }

    // Account age in days
    const accountAgeDays = user?.created_at
      ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return NextResponse.json({
      recentFiles: recentFiles || [],
      accessLogs: accessLogs || [],
      cloudUsed,
      cloudCount,
      cloudMax: maxBytes,
      typeBreakdown,
      toolBreakdown,
      accountAgeDays,
    })
  } catch (error) {
    console.error("Activity GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
