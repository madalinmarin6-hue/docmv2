import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const sessionUser = (session?.user as any)
  if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fileId = searchParams.get("fileId")
  if (!fileId) return NextResponse.json({ error: "No fileId" }, { status: 400 })

  const { data: file } = await supabaseAdmin
    .from("cloud_files")
    .select("*")
    .eq("id", fileId)
    .eq("user_id", sessionUser.id)
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
      "Content-Disposition": `attachment; filename="${file.file_name}"`,
      "Content-Length": buffer.length.toString(),
    },
  })
}
