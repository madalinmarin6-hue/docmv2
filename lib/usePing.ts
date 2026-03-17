"use client"

import { useEffect } from "react"

export function usePing() {
  useEffect(() => {
    const getVisitorId = () => {
      let vid = localStorage.getItem("docm_vid")
      if (!vid) {
        vid = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
        localStorage.setItem("docm_vid", vid)
      }
      return vid
    }
    const ping = () => {
      fetch("/api/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: getVisitorId() }),
      }).catch(() => {})
    }
    ping()
    const iv = setInterval(ping, 30000)
    return () => clearInterval(iv)
  }, [])
}
