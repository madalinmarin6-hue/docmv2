"use client"

import { useState, useEffect, useCallback } from "react"

export interface SectionOrder {
  label: string
  items: string[] // hrefs in order
}

export function useToolOrder() {
  const [order, setOrder] = useState<SectionOrder[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/tool-order")
      .then(r => r.json())
      .then(d => {
        if (d.section_order && Array.isArray(d.section_order) && d.section_order.length > 0) {
          setOrder(d.section_order)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const saveOrder = useCallback(async (newOrder: SectionOrder[]) => {
    setOrder(newOrder)
    try {
      await fetch("/api/admin/tool-order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section_order: newOrder }),
      })
    } catch (err) {
      console.error("Failed to save tool order:", err)
    }
  }, [])

  return { order, loading, saveOrder }
}

/** Apply saved order to the default sidebar sections */
export function applySectionOrder(
  defaultSections: { label: string; items: { href: string; label: string; icon: string }[] }[],
  savedOrder: SectionOrder[] | null
): { label: string; items: { href: string; label: string; icon: string }[] }[] {
  if (!savedOrder || savedOrder.length === 0) return defaultSections

  // Build a lookup of all items by href
  const itemMap = new Map<string, { href: string; label: string; icon: string }>()
  for (const section of defaultSections) {
    for (const item of section.items) {
      itemMap.set(item.href, item)
    }
  }

  // Build a set of section labels from defaults
  const defaultSectionMap = new Map<string, typeof defaultSections[0]>()
  for (const section of defaultSections) {
    defaultSectionMap.set(section.label, section)
  }

  const result: typeof defaultSections = []
  const usedSections = new Set<string>()

  // Apply saved order
  for (const so of savedOrder) {
    const defaultSection = defaultSectionMap.get(so.label)
    if (!defaultSection) continue
    usedSections.add(so.label)

    if (so.items && so.items.length > 0) {
      // Reorder items according to saved order
      const orderedItems: typeof defaultSection.items = []
      const usedHrefs = new Set<string>()
      for (const href of so.items) {
        const item = itemMap.get(href)
        if (item) { orderedItems.push(item); usedHrefs.add(href) }
      }
      // Append any new items not in saved order
      for (const item of defaultSection.items) {
        if (!usedHrefs.has(item.href)) orderedItems.push(item)
      }
      result.push({ ...defaultSection, items: orderedItems })
    } else {
      result.push(defaultSection)
    }
  }

  // Append any sections not in saved order
  for (const section of defaultSections) {
    if (!usedSections.has(section.label)) result.push(section)
  }

  return result
}
