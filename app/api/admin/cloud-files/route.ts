import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

// GET — list all cloud files grouped by user (admin/owner only)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const sessionUser = session?.user as any
  if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: caller } = await supabaseAdmin.from("users").select("role").eq("id", sessionUser.id).single()
  if (!caller || (caller.role !== "admin" && caller.role !== "owner")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const userId = url.searchParams.get("userId")

  if (userId) {
    // Get files for a specific user
    const { data: files, error } = await supabaseAdmin
      .from("cloud_files")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Get user info
    const { data: user } = await supabaseAdmin.from("users").select("id, name, email, plan").eq("id", userId).single()

    return NextResponse.json({ user, files: files || [] })
  }

  // Get summary: users with their cloud file count and total size
  const { data: allFiles, error } = await supabaseAdmin
    .from("cloud_files")
    .select("user_id, file_size")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by user
  const userMap = new Map<string, { count: number; totalSize: number }>()
  for (const f of allFiles || []) {
    const entry = userMap.get(f.user_id) || { count: 0, totalSize: 0 }
    entry.count++
    entry.totalSize += f.file_size || 0
    userMap.set(f.user_id, entry)
  }

  // Get user details
  const userIds = Array.from(userMap.keys())
  if (userIds.length === 0) return NextResponse.json({ users: [] })

  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, name, email, plan")
    .in("id", userIds)

  const result = (users || []).map(u => ({
    ...u,
    cloudFiles: userMap.get(u.id)?.count || 0,
    cloudSize: userMap.get(u.id)?.totalSize || 0,
  })).sort((a, b) => b.cloudFiles - a.cloudFiles)

  return NextResponse.json({ users: result })
}

// DELETE — admin delete a specific cloud file
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  const sessionUser = session?.user as any
  if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: caller } = await supabaseAdmin.from("users").select("role").eq("id", sessionUser.id).single()
  if (!caller || (caller.role !== "admin" && caller.role !== "owner")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { fileId } = await req.json()
  if (!fileId) return NextResponse.json({ error: "No fileId provided" }, { status: 400 })

  const { data: file } = await supabaseAdmin
    .from("cloud_files")
    .select("storage_path")
    .eq("id", fileId)
    .single()

  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 })

  // Delete from storage
  await supabaseAdmin.storage.from("user-files").remove([file.storage_path])

  // Delete from database
  const { error } = await supabaseAdmin.from("cloud_files").delete().eq("id", fileId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
