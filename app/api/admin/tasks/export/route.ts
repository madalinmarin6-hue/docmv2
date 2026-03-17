import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../lib/auth"
import { supabaseAdmin } from "../../../../../lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: tasks } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })

    if (!tasks || tasks.length === 0) {
      return new NextResponse("No tasks found.", { headers: { "Content-Type": "text/plain; charset=utf-8" } })
    }

    const lines: string[] = [
      "=== DOCM TASK LIST ===",
      `Generated: ${new Date().toISOString()}`,
      `Total: ${tasks.length} | Pending: ${tasks.filter(t => t.status === "pending").length} | In Progress: ${tasks.filter(t => t.status === "in_progress").length} | Solved: ${tasks.filter(t => t.status === "solved").length}`,
      "",
    ]

    const pending = tasks.filter(t => t.status !== "solved")
    const solved = tasks.filter(t => t.status === "solved")

    if (pending.length > 0) {
      lines.push("── UNSOLVED / IN PROGRESS ──")
      lines.push("")
      pending.forEach((t, i) => {
        lines.push(`[TASK ${i + 1}] ${t.title}`)
        lines.push(`  Status: ${t.status.toUpperCase()}`)
        if (t.description) lines.push(`  Description: ${t.description}`)
        lines.push(`  Created: ${t.created_at}`)
        lines.push("")
      })
    }

    if (solved.length > 0) {
      lines.push("── SOLVED ──")
      lines.push("")
      solved.forEach((t, i) => {
        lines.push(`[SOLVED ${i + 1}] ${t.title}`)
        if (t.description) lines.push(`  Description: ${t.description}`)
        if (t.solution) lines.push(`  Resolution: ${t.solution}`)
        lines.push(`  Created: ${t.created_at} | Resolved: ${t.updated_at}`)
        lines.push("")
      })
    }

    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "inline; filename=tasks.txt",
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to export tasks" }, { status: 500 })
  }
}
