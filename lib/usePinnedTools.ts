"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "docflow-pinned-tools"

export function usePinnedTools() {
  const [pinned, setPinned] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setPinned(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  const save = useCallback((next: string[]) => {
    setPinned(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }, [])

  const toggle = useCallback((href: string) => {
    setPinned(prev => {
      const next = prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const isPinned = useCallback((href: string) => pinned.includes(href), [pinned])

  return { pinned, toggle, isPinned }
}
