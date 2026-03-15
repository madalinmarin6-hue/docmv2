import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  const sessionUser = (session?.user as any)
  if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { fileId, newName } = await req.json()
  if (!fileId || !newName) return NextResponse.json({ error: "Missing fileId or newName" }, { status: 400 })

  const { error } = await supabaseAdmin
    .from("cloud_files")
    .update({ file_name: newName.trim(), updated_at: new Date().toISOString() })
    .eq("id", fileId)
    .eq("user_id", sessionUser.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
