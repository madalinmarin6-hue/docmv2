export async function saveToCloud(blob: Blob, fileName: string, toolUsed: string) {
  try {
    const formData = new FormData()
    formData.append("file", new File([blob], fileName, { type: blob.type }))
    formData.append("toolUsed", toolUsed)
    await fetch("/api/cloud", { method: "POST", body: formData })
  } catch {
    // silently fail — cloud save is best-effort
  }
}
