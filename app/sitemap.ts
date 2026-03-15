import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://docm.app"

  const staticPages = [
    "",
    "/about",
    "/blog",
    "/contact",
    "/help",
    "/auth/login",
    "/auth/register",
    "/tools/pdf-editor",
    "/tools/pdf-creator",
    "/tools/word-editor",
    "/tools/excel-editor",
    "/tools/powerpoint-editor",
    "/tools/txt-editor",
    "/tools/csv-editor",
    "/tools/split-pdf",
    "/tools/compress",
    "/tools/remove-bg",
    "/convert/pdf-to-word",
    "/convert/pdf-to-excel",
    "/convert/pdf-to-pptx",
    "/convert/pdf-to-jpg",
    "/convert/pdf-to-png",
    "/convert/word-to-pdf",
    "/convert/excel-to-pdf",
    "/convert/pptx-to-pdf",
    "/convert/jpg-to-pdf",
    "/convert/png-to-pdf",
    "/terms",
    "/privacy",
  ]

  return staticPages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : path.startsWith("/tools") ? 0.9 : path.startsWith("/convert") ? 0.8 : 0.7,
  }))
}
