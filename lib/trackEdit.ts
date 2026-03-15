export async function trackEdit(params: {
  fileName: string
  fileSize: number
  fileType: string
  toolUsed: string
}) {
  try {
    const res = await fetch("/api/user/track-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
    return await res.json()
  } catch {
    return null
  }
}
