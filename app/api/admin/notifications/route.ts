import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { role?: string } | undefined
    if (!user || user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const notifications: { id: string; type: string; message: string; time: string }[] = []

    // New bug reports (open, last 24h)
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: bugs } = await supabaseAdmin
        .from("bug_reports")
        .select("id, title, user_name, created_at")
        .eq("status", "open")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10)

      for (const b of bugs || []) {
        notifications.push({
          id: `bug-${b.id}`,
          type: "bug",
          message: `Bug report: "${b.title}" from ${b.user_name}`,
          time: b.created_at,
        })
      }
    } catch { /* ignore */ }

    // New users (last 24h)
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("id, name, email, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10)

      for (const u of users || []) {
        notifications.push({
          id: `user-${u.id}`,
          type: "user",
          message: `New user: ${u.name || u.email}`,
          time: u.created_at,
        })
      }
    } catch { /* ignore */ }

    // New questions (last 24h)
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: questions } = await supabaseAdmin
        .from("questions")
        .select("id, email, question, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10)

      for (const q of questions || []) {
        notifications.push({
          id: `q-${q.id}`,
          type: "question",
          message: `Question from ${q.email}: "${q.question.slice(0, 60)}${q.question.length > 60 ? "..." : ""}"`,
          time: q.created_at,
        })
      }
    } catch { /* ignore */ }

    // Sort all by time descending
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return NextResponse.json({ notifications, count: notifications.length })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
