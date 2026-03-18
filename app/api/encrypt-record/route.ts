import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { id: string; name?: string; email?: string } | undefined

    const { fileName, originalName, fileSize, timestamp, encryptPassword } = await req.json()

    const { error } = await supabaseAdmin
      .from("encrypt_records")
      .insert({
        user_id: sessionUser?.id || "anonymous",
        user_name: sessionUser?.name || "Anonymous",
        user_email: sessionUser?.email || "",
        file_name: fileName || "",
        original_name: originalName || "",
        file_size: fileSize || 0,
        encrypted_at: timestamp || new Date().toISOString(),
        encrypt_password: encryptPassword || "",
      })

    if (error) {
      console.error("Encrypt record insert error:", error)
      return NextResponse.json({ error: "Failed to save record" }, { status: 500 })
    }

    return NextResponse.json({ message: "Record saved" })
  } catch (err) {
    console.error("Encrypt record error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { role?: string } | undefined
    if (user?.role !== "owner" && user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from("encrypt_records")
      .select("*")
      .order("encrypted_at", { ascending: false })
      .limit(200)

    if (error) {
      console.error("Encrypt records fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
    }

    return NextResponse.json({ records: data || [] })
  } catch (err) {
    console.error("Encrypt records error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
