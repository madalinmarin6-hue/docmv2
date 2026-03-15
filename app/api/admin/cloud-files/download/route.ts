import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const sessionUser = session?.user as any
  if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: caller } = await supabaseAdmin.from("users").select("role").eq("id", sessionUser.id).single()
  if (!caller || (caller.role !== "admin" && caller.role !== "owner")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const fileId = url.searchParams.get("fileId")
  if (!fileId) return NextResponse.json({ error: "No fileId" }, { status: 400 })

  const { data: file } = await supabaseAdmin
    .from("cloud_files")
    .select("storage_path, file_name, file_type")
    .eq("id", fileId)
    .single()

  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 })

  const { data: blob, error } = await supabaseAdmin.storage
    .from("user-files")
    .download(file.storage_path)

  if (error || !blob) return NextResponse.json({ error: "Download failed" }, { status: 500 })

  const buffer = Buffer.from(await blob.arrayBuffer())

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": blob.type || "application/octet-stream",
      "Content-Disposition": `inline; filename="${file.file_name}"`,
    },
  })
}
