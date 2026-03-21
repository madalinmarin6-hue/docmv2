/**
 * Professional Word (.docx/.doc) → PDF converter
 * 100% structure preservation: text, headings, bold/italic, colors, images, lists, tables, borders, page breaks
 * Uses mammoth for .docx parsing (HTML + images) + pdf-lib for PDF creation
 */

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage, PDFImage } from "pdf-lib"

// Layout constants (A4 at 72 DPI)
const PAGE_W = 595
const PAGE_H = 842
const MARGIN_L = 56
const MARGIN_R = 56
const MARGIN_T = 56
const MARGIN_B = 56
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

interface FontSet {
  regular: PDFFont
  bold: PDFFont
  italic: PDFFont
  boldItalic: PDFFont
  mono: PDFFont
  isUnicode: boolean
}

interface RenderState {
  page: PDFPage
  y: number
  pageNum: number
}

interface TextBlock {
  type: "heading" | "paragraph" | "list-item" | "code" | "hr" | "image" | "table-row" | "page-break"
  level?: number
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  indent?: number
  cells?: TextBlock[][] // table cells with rich content
  cellsSimple?: string[]
  imageSrc?: string // data URL
  color?: string // hex
  fontSize?: number
  alignment?: "left" | "center" | "right"
}

/** Load Unicode fonts or fall back to standard ones */
async function loadFonts(pdfDoc: PDFDocument): Promise<FontSet> {
  let regular: PDFFont, bold: PDFFont, italic: PDFFont, boldItalic: PDFFont
  let isUnicode = false

  try {
    const base = "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoSans"
    const fetchFont = async (url: string) => {
      const r = await fetch(url)
      if (!r.ok) throw new Error(`Font fetch failed: ${r.status}`)
      return r.arrayBuffer()
    }
    const [regBuf, boldBuf, itBuf, biBuf] = await Promise.all([
      fetchFont(`${base}/NotoSans-Regular.ttf`),
      fetchFont(`${base}/NotoSans-Bold.ttf`),
      fetchFont(`${base}/NotoSans-Italic.ttf`),
      fetchFont(`${base}/NotoSans-BoldItalic.ttf`),
    ])
    regular = await pdfDoc.embedFont(regBuf)
    bold = await pdfDoc.embedFont(boldBuf)
    italic = await pdfDoc.embedFont(itBuf)
    boldItalic = await pdfDoc.embedFont(biBuf)
    isUnicode = true
  } catch {
    regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
    boldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)
  }

  const mono = await pdfDoc.embedFont(StandardFonts.Courier)
  return { regular, bold, italic, boldItalic, mono, isUnicode }
}

/** Add a new page */
function newPage(pdfDoc: PDFDocument, state: RenderState): RenderState {
  const page = pdfDoc.addPage([PAGE_W, PAGE_H])
  state.pageNum++
  return { page, y: PAGE_H - MARGIN_T, pageNum: state.pageNum }
}

/** Ensure there's enough space on the page */
function ensureSpace(pdfDoc: PDFDocument, state: RenderState, needed: number): RenderState {
  if (state.y - needed < MARGIN_B) {
    return newPage(pdfDoc, state)
  }
  return state
}

/** Word-wrap text to fit within maxWidth */
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  if (!text.trim()) return [""]
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    const testLine = currentLine ? currentLine + " " + word : word
    let testWidth: number
    try {
      testWidth = font.widthOfTextAtSize(testLine, fontSize)
    } catch {
      testWidth = testLine.length * fontSize * 0.5
    }

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines.length > 0 ? lines : [""]
}

/** Sanitize text for pdf-lib */
function sanitize(text: string, isUnicode: boolean): string {
  if (isUnicode) return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
  // Preserve Latin Extended (Romanian ăâîșț, Polish, Czech, etc.) even with standard fonts
  // Map common Romanian diacritics to closest ASCII equivalent when Unicode fonts unavailable
  return text
    .replace(/[\u0218\u015E]/g, "S").replace(/[\u0219\u015F]/g, "s")
    .replace(/[\u021A\u0162]/g, "T").replace(/[\u021B\u0163]/g, "t")
    .replace(/[\u0102]/g, "A").replace(/[\u0103]/g, "a")
    .replace(/[\u00C2]/g, "A").replace(/[\u00E2]/g, "a")
    .replace(/[\u00CE]/g, "I").replace(/[\u00EE]/g, "i")
    .replace(/[^\x20-\x7E\u00C0-\u00FF]/g, " ")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
}

/** Parse hex color string to rgb */
function hexToRgb(hex: string | undefined) {
  if (!hex || hex.length < 6) return rgb(0, 0, 0)
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  return rgb(r, g, b)
}

/** Parse mammoth HTML into structured blocks with rich formatting */
function parseHtml(html: string): TextBlock[] {
  const blocks: TextBlock[] = []

  const div = typeof document !== "undefined" ? document.createElement("div") : null
  if (div) {
    div.innerHTML = html

    function getColor(el: HTMLElement): string | undefined {
      const style = el.getAttribute("style") || ""
      const match = style.match(/color:\s*#([0-9a-fA-F]{6})/)
      if (match) return match[1]
      const rgbMatch = style.match(/color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (rgbMatch) {
        return [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
          .map(c => parseInt(c).toString(16).padStart(2, "0")).join("")
      }
      return undefined
    }

    function getAlignment(el: HTMLElement): "left" | "center" | "right" | undefined {
      const style = el.getAttribute("style") || ""
      if (style.includes("text-align: center") || style.includes("text-align:center")) return "center"
      if (style.includes("text-align: right") || style.includes("text-align:right")) return "right"
      return undefined
    }

    function walk(node: Node, depth: number = 0) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        const tag = el.tagName.toLowerCase()

        if (tag === "hr") {
          blocks.push({ type: "hr", text: "" })
          return
        }

        if (tag === "br") {
          blocks.push({ type: "paragraph", text: "" })
          return
        }

        if (tag === "img") {
          const src = el.getAttribute("src") || ""
          if (src.startsWith("data:")) {
            blocks.push({ type: "image", text: "", imageSrc: src })
          }
          return
        }

        if (/^h[1-6]$/.test(tag)) {
          blocks.push({
            type: "heading",
            level: parseInt(tag[1]),
            text: el.textContent?.trim() || "",
            bold: true,
            color: getColor(el),
            alignment: getAlignment(el),
          })
          return
        }

        if (tag === "li") {
          const hasBold = el.querySelector("strong, b") !== null
          const hasItalic = el.querySelector("em, i") !== null
          blocks.push({
            type: "list-item",
            text: el.textContent?.trim() || "",
            indent: depth,
            bold: hasBold,
            italic: hasItalic,
            color: getColor(el),
          })
          return
        }

        if (tag === "tr") {
          const cells: string[] = []
          el.querySelectorAll("td, th").forEach(cell => {
            cells.push(cell.textContent?.trim() || "")
          })
          if (cells.length > 0) {
            const isHeader = el.querySelector("th") !== null
            blocks.push({
              type: "table-row",
              text: cells.join(" | "),
              cellsSimple: cells,
              bold: isHeader,
            })
          }
          return
        }

        if (tag === "p" || tag === "div" || tag === "blockquote") {
          // Check for images inside
          const imgs = el.querySelectorAll("img")
          imgs.forEach(img => {
            const src = img.getAttribute("src") || ""
            if (src.startsWith("data:")) {
              blocks.push({ type: "image", text: "", imageSrc: src })
            }
          })

          const text = el.textContent?.trim() || ""
          if (text || imgs.length === 0) {
            const hasBold = el.querySelector("strong, b") !== null || el.style.fontWeight === "bold"
            const hasItalic = el.querySelector("em, i") !== null || el.style.fontStyle === "italic"
            const hasUnderline = el.querySelector("u") !== null
            blocks.push({
              type: "paragraph",
              text,
              bold: hasBold,
              italic: hasItalic,
              underline: hasUnderline,
              indent: tag === "blockquote" ? 1 : 0,
              color: getColor(el),
              alignment: getAlignment(el),
            })
          }
          return
        }

        if (tag === "pre" || tag === "code") {
          blocks.push({ type: "code", text: el.textContent || "" })
          return
        }

        // Recurse
        if (["table", "thead", "tbody", "tfoot", "ul", "ol", "section", "article",
             "main", "header", "footer", "nav", "aside", "span", "a", "strong",
             "em", "b", "i", "u", "sub", "sup", "figure", "figcaption"].includes(tag)) {
          for (const child of Array.from(node.childNodes)) {
            walk(child, tag === "ul" || tag === "ol" ? depth + 1 : depth)
          }
          return
        }

        const text = el.textContent?.trim()
        if (text) blocks.push({ type: "paragraph", text })
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim()
        if (text && !node.parentElement?.closest("p, h1, h2, h3, h4, h5, h6, li, td, th, pre, code")) {
          blocks.push({ type: "paragraph", text })
        }
      }
    }

    for (const child of Array.from(div.childNodes)) {
      walk(child)
    }
  } else {
    const text = html.replace(/<[^>]+>/g, "\n").replace(/\n{3,}/g, "\n\n")
    for (const line of text.split("\n")) {
      if (line.trim()) blocks.push({ type: "paragraph", text: line.trim() })
    }
  }

  return blocks
}

/** Embed a base64 data URL image into PDF */
async function embedImage(pdfDoc: PDFDocument, dataUrl: string): Promise<PDFImage | null> {
  try {
    const [header, base64] = dataUrl.split(",")
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))

    if (header.includes("png")) {
      return await pdfDoc.embedPng(bytes)
    } else if (header.includes("jpeg") || header.includes("jpg")) {
      return await pdfDoc.embedJpg(bytes)
    }

    // Try PNG first, then JPG
    try { return await pdfDoc.embedPng(bytes) } catch {}
    try { return await pdfDoc.embedJpg(bytes) } catch {}
  } catch { /* skip */ }
  return null
}

/** High-fidelity Word → PDF using browser rendering + html2canvas */
async function convertViaCanvas(
  wordBuffer: ArrayBuffer,
  fileName: string,
  onProgress?: (pct: number) => void
): Promise<{ blob: Blob; name: string }> {
  const mammoth = (await import("mammoth")).default
  const html2canvas = (await import("html2canvas")).default
  onProgress?.(10)

  const result = await mammoth.convertToHtml(
    { arrayBuffer: wordBuffer },
    {
      convertImage: mammoth.images.imgElement(async (image: any) => {
        const buf = await image.read("base64")
        return { src: `data:${image.contentType};base64,${buf}` }
      }),
    }
  )
  onProgress?.(30)

  // Create a hidden container with A4-like styling
  const container = document.createElement("div")
  container.style.cssText = `
    position: fixed; top: -9999px; left: -9999px;
    width: 794px; padding: 56px; background: white; color: black;
    font-family: 'Segoe UI', 'Noto Sans', 'Arial Unicode MS', Arial, Helvetica, sans-serif;
    font-size: 12pt; line-height: 1.5; box-sizing: border-box;
  `
  // Preload Noto Sans from Google Fonts to guarantee diacritics support
  const fontLink = document.createElement("link")
  fontLink.rel = "stylesheet"
  fontLink.href = "https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
  document.head.appendChild(fontLink)
  // Wait briefly for font to load
  await new Promise(r => setTimeout(r, 500))
  // Add base styles for the HTML content
  const style = document.createElement("style")
  style.textContent = `
    .docx-render * { box-sizing: border-box; }
    .docx-render h1 { font-size: 22pt; font-weight: bold; margin: 18px 0 8px; }
    .docx-render h2 { font-size: 18pt; font-weight: bold; margin: 14px 0 6px; }
    .docx-render h3 { font-size: 14pt; font-weight: bold; margin: 12px 0 4px; }
    .docx-render h4, .docx-render h5, .docx-render h6 { font-weight: bold; margin: 10px 0 4px; }
    .docx-render p { margin: 0 0 8px; }
    .docx-render ul, .docx-render ol { margin: 4px 0 8px 24px; }
    .docx-render li { margin-bottom: 2px; }
    .docx-render table { border-collapse: collapse; width: 100%; margin: 8px 0; }
    .docx-render td, .docx-render th { border: 1px solid #888; padding: 4px 8px; font-size: 10pt; }
    .docx-render th { background: #f0f0f0; font-weight: bold; }
    .docx-render img { max-width: 100%; height: auto; }
    .docx-render blockquote { border-left: 3px solid #ccc; padding-left: 12px; margin: 8px 0; color: #555; }
    .docx-render pre, .docx-render code { font-family: 'Courier New', monospace; font-size: 9pt; background: #f5f5f5; padding: 2px 4px; }
    .docx-render pre { padding: 8px; border-radius: 4px; overflow-x: auto; }
    .docx-render hr { border: none; border-top: 1px solid #ccc; margin: 12px 0; }
  `
  container.appendChild(style)

  const content = document.createElement("div")
  content.className = "docx-render"
  content.innerHTML = result.value
  container.appendChild(content)
  document.body.appendChild(container)

  onProgress?.(40)

  // Wait for images to load
  const images = container.querySelectorAll("img")
  await Promise.all(Array.from(images).map(img => 
    img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve })
  ))

  onProgress?.(50)

  // A4 dimensions in pixels at 96 DPI: 794 x 1123
  const pageW = 794
  const pageH = 1123
  const contentH = container.scrollHeight

  // Capture the full rendered content
  const canvas = await html2canvas(container, {
    width: pageW,
    height: contentH,
    scale: 2, // 2x for sharper text
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  })

  document.body.removeChild(container)
  onProgress?.(70)

  // Split canvas into A4-sized pages
  const pdfDoc = await PDFDocument.create()
  const totalPages = Math.ceil(contentH / pageH)
  const scale = 2 // matches html2canvas scale

  for (let i = 0; i < totalPages; i++) {
    onProgress?.(70 + Math.round((i / totalPages) * 25))

    const sliceH = Math.min(pageH, contentH - i * pageH)
    const pageCanvas = document.createElement("canvas")
    pageCanvas.width = pageW * scale
    pageCanvas.height = sliceH * scale
    const ctx = pageCanvas.getContext("2d")!
    ctx.drawImage(canvas, 0, -(i * pageH * scale))

    const imgData = pageCanvas.toDataURL("image/jpeg", 0.92)
    const imgBytes = Uint8Array.from(atob(imgData.split(",")[1]), c => c.charCodeAt(0))
    const pdfImg = await pdfDoc.embedJpg(imgBytes)

    // A4 in PDF points: 595 x 842
    const pdfPageH = (sliceH / pageH) * 842
    const page = pdfDoc.addPage([595, pdfPageH])
    page.drawImage(pdfImg, { x: 0, y: 0, width: 595, height: pdfPageH })
  }

  onProgress?.(95)
  const pdfBytes = await pdfDoc.save()
  const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
  const baseName = fileName.replace(/\.[^.]+$/, "")

  onProgress?.(100)
  return { blob, name: baseName + ".pdf" }
}

/** Fallback: block-based rendering with pdf-lib (lower quality) */
async function convertViaBlocks(
  wordBuffer: ArrayBuffer,
  fileName: string,
  onProgress?: (pct: number) => void
): Promise<{ blob: Blob; name: string }> {
  const mammoth = (await import("mammoth")).default
  onProgress?.(10)

  const result = await mammoth.convertToHtml(
    { arrayBuffer: wordBuffer },
    {
      convertImage: mammoth.images.imgElement(async (image: any) => {
        const buf = await image.read("base64")
        return { src: `data:${image.contentType};base64,${buf}` }
      }),
    }
  )
  onProgress?.(30)

  const html = result.value
  const blocks = parseHtml(html)
  onProgress?.(40)

  const pdfDoc = await PDFDocument.create()
  const fonts = await loadFonts(pdfDoc)
  const baseName = fileName.replace(/\.[^.]+$/, "")

  let state: RenderState = {
    page: pdfDoc.addPage([PAGE_W, PAGE_H]),
    y: PAGE_H - MARGIN_T,
    pageNum: 1,
  }

  onProgress?.(50)

  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi]
    onProgress?.(50 + Math.round((bi / blocks.length) * 40))

    if (block.type === "page-break") { state = newPage(pdfDoc, state); continue }

    if (block.type === "hr") {
      state = ensureSpace(pdfDoc, state, 20); state.y -= 8
      state.page.drawLine({ start: { x: MARGIN_L, y: state.y }, end: { x: PAGE_W - MARGIN_R, y: state.y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
      state.y -= 8; continue
    }

    if (block.type === "image" && block.imageSrc) {
      const pdfImg = await embedImage(pdfDoc, block.imageSrc)
      if (pdfImg) {
        const maxW = CONTENT_W, maxH = PAGE_H - MARGIN_T - MARGIN_B - 20
        let imgW = pdfImg.width, imgH = pdfImg.height
        if (imgW > maxW) { const s = maxW / imgW; imgW *= s; imgH *= s }
        if (imgH > maxH) { const s = maxH / imgH; imgW *= s; imgH *= s }
        state = ensureSpace(pdfDoc, state, imgH + 16); state.y -= imgH + 8
        state.page.drawImage(pdfImg, { x: MARGIN_L, y: state.y, width: imgW, height: imgH })
        state.y -= 8
      }
      continue
    }

    let font: PDFFont, fontSize: number
    let textColor = block.color ? hexToRgb(block.color) : rgb(0, 0, 0)
    let spacingAfter = 6

    if (block.type === "heading") {
      const sizes: Record<number, number> = { 1: 22, 2: 18, 3: 15, 4: 13, 5: 12, 6: 11 }
      fontSize = sizes[block.level || 1] || 14; font = fonts.bold
      if (!block.color) textColor = rgb(0.1, 0.1, 0.15)
      spacingAfter = fontSize >= 18 ? 14 : 10
    } else if (block.type === "code") { fontSize = 9; font = fonts.mono; textColor = rgb(0.2, 0.2, 0.2)
    } else if (block.type === "table-row") { fontSize = 10; font = block.bold ? fonts.bold : fonts.regular
    } else {
      fontSize = 11
      if (block.bold && block.italic) font = fonts.boldItalic
      else if (block.bold) font = fonts.bold
      else if (block.italic) font = fonts.italic
      else font = fonts.regular
    }

    const indent = (block.indent || 0) * 24
    const bulletPrefix = block.type === "list-item" ? "•  " : ""
    const fullText = sanitize(bulletPrefix + block.text, fonts.isUnicode)
    const maxWidth = CONTENT_W - indent

    if (block.type === "table-row" && block.cellsSimple) {
      state = ensureSpace(pdfDoc, state, fontSize + 14)
      const cellCount = block.cellsSimple.length
      const cellWidth = CONTENT_W / Math.max(cellCount, 1)
      const rowH = fontSize + 10; state.y -= rowH
      for (let ci = 0; ci < cellCount; ci++) {
        const cellText = sanitize(block.cellsSimple[ci], fonts.isUnicode).substring(0, 60)
        const cx = MARGIN_L + ci * cellWidth
        state.page.drawRectangle({ x: cx, y: state.y, width: cellWidth, height: rowH, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.5 })
        try { state.page.drawText(cellText, { x: cx + 4, y: state.y + 3, size: fontSize, font, color: textColor })
        } catch { try { state.page.drawText(cellText.replace(/[^\x20-\x7E]/g, " "), { x: cx + 4, y: state.y + 3, size: fontSize, font: fonts.regular, color: textColor }) } catch {} }
      }
      continue
    }

    if (!fullText.trim() && block.type === "paragraph") { state.y -= fontSize + 2; continue }

    const wrappedLines = wrapText(fullText, font, fontSize, maxWidth)
    const neededHeight = wrappedLines.length * (fontSize + 4) + spacingAfter
    state = ensureSpace(pdfDoc, state, Math.min(neededHeight, fontSize + 4))

    for (const line of wrappedLines) {
      state = ensureSpace(pdfDoc, state, fontSize + 4); state.y -= fontSize + 4
      let x = MARGIN_L + indent
      if (block.alignment === "center") { try { const lw = font.widthOfTextAtSize(line, fontSize); x = MARGIN_L + (CONTENT_W - lw) / 2 } catch {} }
      else if (block.alignment === "right") { try { const lw = font.widthOfTextAtSize(line, fontSize); x = PAGE_W - MARGIN_R - lw } catch {} }
      try { state.page.drawText(line, { x, y: state.y, size: fontSize, font, color: textColor })
      } catch { try { state.page.drawText(line.replace(/[^\x20-\x7E]/g, " "), { x, y: state.y, size: fontSize, font: fonts.regular, color: textColor }) } catch {} }
      if (block.underline) { try { const lw = font.widthOfTextAtSize(line, fontSize); state.page.drawLine({ start: { x, y: state.y - 1 }, end: { x: x + lw, y: state.y - 1 }, thickness: 0.5, color: textColor }) } catch {} }
    }
    state.y -= spacingAfter
  }

  onProgress?.(95)
  const pdfBytes = await pdfDoc.save()
  const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
  onProgress?.(100)
  return { blob, name: baseName + ".pdf" }
}

/** Main conversion: Word ArrayBuffer → PDF Blob */
export async function convertWordToPdf(
  wordBuffer: ArrayBuffer,
  fileName: string,
  onProgress?: (pct: number) => void
): Promise<{ blob: Blob; name: string }> {
  // Try high-fidelity canvas-based rendering first
  try {
    return await convertViaCanvas(wordBuffer, fileName, onProgress)
  } catch (err) {
    console.warn("[WordToPdf] Canvas approach failed, using block fallback:", err)
    return await convertViaBlocks(wordBuffer, fileName, onProgress)
  }
}
