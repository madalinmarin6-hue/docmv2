import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

// GET — list user's cloud files
export async function GET() {
  const session = await getServerSession(authOptions)
  const sessionUser = (session?.user as any)
  if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from("cloud_files")
    .select("*")
    .eq("user_id", sessionUser.id)
    .order("updated_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ files: data || [] })
}

// POST — upload a file to cloud storage
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const sessionUser = (session?.user as any)
  if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const toolUsed = formData.get("toolUsed") as string | null
    const existingId = formData.get("fileId") as string | null

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    // Block dangerous file types
    const blockedExtensions = ["exe","msi","bat","cmd","com","scr","pif","vbs","vbe","js","jse","ws","wsf","wsc","wsh","ps1","ps2","psc1","psc2","msh","msh1","msh2","inf","reg","rgs","sct","shb","shs","lnk","dll","sys","drv","ocx","cpl","hta","jar","app","action","command","workflow","sh","csh","ksh","out","run","bin"]
    const fileExt = (file.name.split(".").pop() || "").toLowerCase()
    if (blockedExtensions.includes(fileExt)) {
      return NextResponse.json({ error: `File type .${fileExt} is not allowed for security reasons.` }, { status: 400 })
    }

    // Check for duplicate file (same name + same size)
    if (!existingId) {
      const { data: dupes } = await supabaseAdmin
        .from("cloud_files")
        .select("id")
        .eq("user_id", sessionUser.id)
        .eq("file_name", file.name)
        .eq("file_size", file.size)
      if (dupes && dupes.length > 0) {
        return NextResponse.json({ error: `"${file.name}" already exists in your cloud.` }, { status: 400 })
      }
    }

    // Check if cloud storage is enabled for this user
    const { data: user } = await supabaseAdmin.from("users").select("plan, cloud_enabled").eq("id", sessionUser.id).single()
    if (user?.cloud_enabled === false) {
      return NextResponse.json({ error: "Cloud storage is disabled. Enable it from your Profile settings." }, { status: 403 })
    }

    // Check storage limit: free=500MB, premium=2GB
    const maxBytes = user?.plan === "premium" || user?.plan === "friend" ? 2 * 1024 * 1024 * 1024 : 500 * 1024 * 1024

    const { data: existingFiles } = await supabaseAdmin
      .from("cloud_files")
      .select("file_size")
      .eq("user_id", sessionUser.id)

    const currentUsage = (existingFiles || []).reduce((sum, f) => sum + (f.file_size || 0), 0)
    if (currentUsage + file.size > maxBytes) {
      const limitMB = Math.round(maxBytes / 1024 / 1024)
      return NextResponse.json({ error: `Storage limit exceeded (${limitMB}MB). Upgrade to premium for more space.` }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split(".").pop() || "bin"
    const storagePath = `${sessionUser.id}/${Date.now()}_${file.name}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("user-files")
      .upload(storagePath, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file: " + uploadError.message }, { status: 500 })
    }

    if (existingId) {
      // Update existing cloud file record
      const { data: oldFile } = await supabaseAdmin.from("cloud_files").select("storage_path").eq("id", existingId).eq("user_id", sessionUser.id).single()
      if (oldFile?.storage_path) {
        await supabaseAdmin.storage.from("user-files").remove([oldFile.storage_path])
      }
      const { error: updateError } = await supabaseAdmin
        .from("cloud_files")
        .update({ file_name: file.name, file_size: file.size, file_type: ext, tool_used: toolUsed || null, storage_path: storagePath, updated_at: new Date().toISOString() })
        .eq("id", existingId)
        .eq("user_id", sessionUser.id)

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
      return NextResponse.json({ success: true, fileId: existingId })
    } else {
      // Insert new cloud file record
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("cloud_files")
        .insert({ user_id: sessionUser.id, file_name: file.name, file_size: file.size, file_type: ext, tool_used: toolUsed || null, storage_path: storagePath })
        .select("id")
        .single()

      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
      return NextResponse.json({ success: true, fileId: inserted?.id })
    }
  } catch (err) {
    console.error("Cloud upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

// DELETE — delete a cloud file
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  const sessionUser = (session?.user as any)
  if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { fileId } = await req.json()
  if (!fileId) return NextResponse.json({ error: "No fileId provided" }, { status: 400 })

  const { data: file } = await supabaseAdmin
    .from("cloud_files")
    .select("storage_path")
    .eq("id", fileId)
    .eq("user_id", sessionUser.id)
    .single()

  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 })

  // Delete from storage
  await supabaseAdmin.storage.from("user-files").remove([file.storage_path])

  // Delete from database
  const { error } = await supabaseAdmin
    .from("cloud_files")
    .delete()
    .eq("id", fileId)
    .eq("user_id", sessionUser.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
