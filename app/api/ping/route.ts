import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../lib/auth"
import { supabaseAdmin } from "../../../lib/supabase"

// Simple in-memory geo cache to avoid hammering ip-api.com
const geoCache = new Map<string, { country: string; city: string; ts: number }>()
const GEO_TTL = 3600000 // 1 hour

async function getGeo(ip: string): Promise<{ country: string; city: string }> {
  if (!ip || ip === "127.0.0.1" || ip === "::1") return { country: "Local", city: "localhost" }
  const cached = geoCache.get(ip)
  if (cached && Date.now() - cached.ts < GEO_TTL) return { country: cached.country, city: cached.city }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const d = await res.json()
      const geo = { country: d.country || "Unknown", city: d.city || "Unknown" }
      geoCache.set(ip, { ...geo, ts: Date.now() })
      return geo
    }
  } catch { /* ignore */ }
  return { country: "Unknown", city: "Unknown" }
}

export async function POST(req: Request) {
  try {
    const { visitorId, page } = await req.json()
    if (!visitorId) return NextResponse.json({ ok: false }, { status: 400 })

    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string; name?: string } | undefined)?.id || null

    // Extract IP from headers (try multiple sources for different hosting providers)
    const hdrs = await headers()
    const ip = hdrs.get("cf-connecting-ip")
      || hdrs.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
      || hdrs.get("x-forwarded-for")?.split(",")[0]?.trim()
      || hdrs.get("x-real-ip")
      || hdrs.get("true-client-ip")
      || "Unknown"

    // Check if this visitor already has geo data
    const { data: existing } = await supabaseAdmin
      .from("active_visitors")
      .select("country, city")
      .eq("visitor_id", visitorId)
      .single()

    let country = existing?.country || null
    let city: string | null = existing?.city || null

    // Do geo lookup if we don't have valid data yet
    if (!country || country === "Unknown" || !city || city === "Unknown") {
      const geo = await getGeo(ip)
      country = geo.country
      city = geo.city
    }

    // Upsert into active_visitors
    const upsertData: Record<string, unknown> = {
      visitor_id: visitorId,
      user_id: userId,
      last_ping: new Date().toISOString(),
      ip,
      page: page || "/",
    }
    if (country) upsertData.country = country
    if (city) upsertData.city = city
    if (!existing) upsertData.first_seen = new Date().toISOString()

    await supabaseAdmin.from("active_visitors").upsert(upsertData, { onConflict: "visitor_id" })

    // Also update last_active on users table if logged in
    if (userId) {
      try {
        await supabaseAdmin
          .from("users")
          .update({ last_active: new Date().toISOString() })
          .eq("id", userId)
      } catch { /* ignore */ }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
