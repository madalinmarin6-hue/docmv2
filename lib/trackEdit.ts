export async function trackEdit(params: {
  fileName: string
  fileSize: number
  fileType: string
  toolUsed: string
}): Promise<{ allowed: boolean; editsLeft?: number; bonusEdits?: number; error?: string }> {
  try {
    const res = await fetch("/api/user/track-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
    const data = await res.json()
    if (res.status === 429) {
      return { allowed: false, editsLeft: 0, bonusEdits: data.bonusEdits ?? 0, error: data.error || "Daily edit limit reached (0/10). Go to Dashboard to watch ads for bonus edits, or upgrade to Premium." }
    }
    return { allowed: true, editsLeft: data.editsLeft, bonusEdits: data.bonusEdits }
  } catch {
    return { allowed: true } // allow on network error
  }
}
