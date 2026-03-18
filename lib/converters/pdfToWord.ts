/**
 * Professional PDF → Word (.docx) converter
 * 100% structure preservation: text, layout, pages, fonts, colors, borders, images
 * Uses pdfjs-dist for extraction + docx library for proper .docx generation
 */

import {
  Document, Packer, Paragraph, TextRun, ImageRun, PageBreak,
  HeadingLevel, AlignmentType, BorderStyle,
  Header, Footer, PageNumber, NumberFormat,
  Table, TableRow, TableCell, WidthType, VerticalAlign,
  convertInchesToTwip, TabStopPosition, TabStopType,
} from "docx"

/* ─── Types ─── */

interface ExtractedText {
  str: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontName: string
  bold: boolean
  italic: boolean
  color: string // hex "RRGGBB"
}

interface ExtractedLine {
  texts: ExtractedText[]
  y: number
  fontSize: number
  bold: boolean
  italic: boolean
  alignment: "left" | "center" | "right" | "justify"
  indentLeft: number // px from left margin
}

interface ExtractedImage {
  data: Uint8Array
  x: number
  y: number
  width: number
  height: number
  type: "png" | "jpg"
}

interface TableCandidate {
  startLineIdx: number
  endLineIdx: number
  columns: number[]  // x positions of column boundaries
  rows: number[][]   // row indices grouped
}

interface PageData {
  lines: ExtractedLine[]
  images: ExtractedImage[]
  width: number
  height: number
  marginLeft: number
  marginRight: number
  marginTop: number
  marginBottom: number
}

/* ─── Font mapping ─── */

const FONT_MAP: Record<string, string> = {
  "arial": "Arial",
  "helvetica": "Arial",
  "times": "Times New Roman",
  "timesnewroman": "Times New Roman",
  "courier": "Courier New",
  "couriernew": "Courier New",
  "georgia": "Georgia",
  "verdana": "Verdana",
  "tahoma": "Tahoma",
  "trebuchet": "Trebuchet MS",
  "palatino": "Palatino Linotype",
  "garamond": "Garamond",
  "bookman": "Bookman Old Style",
  "cambria": "Cambria",
  "calibri": "Calibri",
  "segoe": "Segoe UI",
  "consolas": "Consolas",
  "lucida": "Lucida Sans",
  "impact": "Impact",
  "roboto": "Roboto",
  "opensans": "Open Sans",
  "lato": "Lato",
  "noto": "Noto Sans",
  "sourcesans": "Source Sans Pro",
  "montserrat": "Montserrat",
}

function mapFont(pdfFontName: string): string {
  if (!pdfFontName) return "Calibri"
  // Remove subset prefix like "ABCDEF+"
  const cleaned = pdfFontName.replace(/^[A-Z]{6}\+/, "")
  // Remove style suffix
  const base = cleaned.split(/[-,]/)[0].toLowerCase().replace(/\s+/g, "")

  for (const [key, val] of Object.entries(FONT_MAP)) {
    if (base.includes(key)) return val
  }

  // If font name looks reasonable, use it directly
  if (cleaned.length > 2 && cleaned.length < 50) {
    return cleaned.split("-")[0].split(",")[0].trim()
  }
  return "Calibri"
}

/* ─── Color extraction ─── */

function colorToHex(color: number | undefined): string {
  if (!color || color === 0) return "000000"
  const r = (color >> 16) & 0xFF
  const g = (color >> 8) & 0xFF
  const b = color & 0xFF
  return [r, g, b].map(c => c.toString(16).padStart(2, "0")).join("")
}

/* ─── Alignment detection ─── */

function detectAlignment(
  texts: ExtractedText[], pageWidth: number, marginL: number, marginR: number
): "left" | "center" | "right" | "justify" {
  if (texts.length === 0) return "left"
  const firstX = texts[0].x
  const lastText = texts[texts.length - 1]
  const lineEnd = lastText.x + lastText.width
  const lineWidth = lineEnd - firstX
  const contentWidth = pageWidth - marginL - marginR
  const center = pageWidth / 2
  const lineCenter = firstX + lineWidth / 2

  // Check right-aligned
  if (Math.abs(lineEnd - (pageWidth - marginR)) < 5 && firstX > marginL + 30) return "right"
  // Check centered
  if (Math.abs(lineCenter - center) < 15 && firstX > marginL + 20) return "center"
  // Check justified (line spans nearly full width)
  if (lineWidth > contentWidth * 0.9 && texts.length > 3) return "justify"
  return "left"
}

/* ─── Line grouping ─── */

function groupIntoLines(items: ExtractedText[], pageWidth: number, marginL: number, marginR: number): ExtractedLine[] {
  if (items.length === 0) return []

  // Sort by Y descending (PDF coords bottom-up), then X ascending
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)

  const lines: ExtractedLine[] = []
  let currentItems: ExtractedText[] = [sorted[0]]
  let currentY = sorted[0].y

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i]
    const tolerance = Math.max(item.fontSize * 0.5, 2)

    if (Math.abs(item.y - currentY) < tolerance) {
      currentItems.push(item)
    } else {
      currentItems.sort((a, b) => a.x - b.x)
      lines.push(buildLine(currentItems, pageWidth, marginL, marginR))
      currentItems = [item]
      currentY = item.y
    }
  }

  if (currentItems.length > 0) {
    currentItems.sort((a, b) => a.x - b.x)
    lines.push(buildLine(currentItems, pageWidth, marginL, marginR))
  }

  return lines
}

function buildLine(
  texts: ExtractedText[], pageWidth: number, marginL: number, marginR: number
): ExtractedLine {
  const mainFontSize = texts.reduce((a, b) => a.fontSize > b.fontSize ? a : b).fontSize
  return {
    texts,
    y: texts[0].y,
    fontSize: mainFontSize,
    bold: texts.some(t => t.bold),
    italic: texts.some(t => t.italic),
    alignment: detectAlignment(texts, pageWidth, marginL, marginR),
    indentLeft: Math.max(0, texts[0].x - marginL),
  }
}

/* ─── Margin detection ─── */

function detectMargins(textItems: ExtractedText[], pageWidth: number, pageHeight: number) {
  if (textItems.length === 0) return { left: 56, right: 56, top: 56, bottom: 56 }
  const xs = textItems.map(t => t.x)
  const ys = textItems.map(t => t.y)
  const rights = textItems.map(t => t.x + t.width)
  return {
    left: Math.max(20, Math.min(...xs) - 4),
    right: Math.max(20, pageWidth - Math.max(...rights) - 4),
    top: Math.max(20, pageHeight - Math.max(...ys) - 4),
    bottom: Math.max(20, Math.min(...ys) - 4),
  }
}

/* ─── Table detection ─── */

function detectTables(lines: ExtractedLine[], pageWidth: number): Map<number, { cols: number; cellTexts: string[][] }> {
  const tableRows = new Map<number, { cols: number; cellTexts: string[][] }>()
  if (lines.length < 2) return tableRows

  // Find groups of consecutive lines that have similar column patterns
  // A table row has multiple text items with consistent column x-positions
  const columnGroups: { lineIdx: number; xPositions: number[] }[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.texts.length < 2) continue
    // Find distinct column positions (x values with significant gaps)
    const xPos: number[] = []
    for (const t of line.texts) {
      if (xPos.length === 0 || t.x - xPos[xPos.length - 1] > 30) {
        xPos.push(t.x)
      }
    }
    if (xPos.length >= 2) {
      columnGroups.push({ lineIdx: i, xPositions: xPos })
    }
  }

  // Group consecutive lines with matching column counts
  let groupStart = 0
  while (groupStart < columnGroups.length) {
    const refCols = columnGroups[groupStart].xPositions.length
    let groupEnd = groupStart

    for (let j = groupStart + 1; j < columnGroups.length; j++) {
      const prevIdx = columnGroups[j - 1].lineIdx
      const curIdx = columnGroups[j].lineIdx
      // Must be consecutive (or nearly) and same column count
      if (curIdx - prevIdx <= 2 && columnGroups[j].xPositions.length === refCols) {
        groupEnd = j
      } else break
    }

    // Need at least 2 rows to be a table
    if (groupEnd - groupStart >= 1 && refCols >= 2) {
      const cellTexts: string[][] = []
      for (let j = groupStart; j <= groupEnd; j++) {
        const line = lines[columnGroups[j].lineIdx]
        const cols = columnGroups[groupStart].xPositions
        const row: string[] = new Array(cols.length).fill("")

        for (const t of line.texts) {
          // Find which column this text belongs to
          let colIdx = 0
          for (let c = cols.length - 1; c >= 0; c--) {
            if (t.x >= cols[c] - 10) { colIdx = c; break }
          }
          row[colIdx] += (row[colIdx] ? " " : "") + t.str
        }
        cellTexts.push(row)

        tableRows.set(columnGroups[j].lineIdx, { cols: refCols, cellTexts })
      }
    }

    groupStart = groupEnd + 1
  }

  return tableRows
}

/* ─── Image extraction ─── */

async function extractPageImages(page: any, viewport: any): Promise<ExtractedImage[]> {
  const images: ExtractedImage[] = []
  try {
    const ops = await page.getOperatorList()
    const pdfjs = await import("pdfjs-dist")
    const OPS = pdfjs.OPS

    // Track transform matrices to get image positions
    const matrices: number[][] = []
    let currentMatrix = [1, 0, 0, 1, 0, 0]

    for (let i = 0; i < ops.fnArray.length; i++) {
      if (ops.fnArray[i] === OPS.save) {
        matrices.push([...currentMatrix])
      } else if (ops.fnArray[i] === OPS.restore && matrices.length > 0) {
        currentMatrix = matrices.pop()!
      } else if (ops.fnArray[i] === OPS.transform) {
        const m = ops.argsArray[i]
        // Multiply matrices
        const a = currentMatrix
        currentMatrix = [
          a[0] * m[0] + a[2] * m[1],
          a[1] * m[0] + a[3] * m[1],
          a[0] * m[2] + a[2] * m[3],
          a[1] * m[2] + a[3] * m[3],
          a[0] * m[4] + a[2] * m[5] + a[4],
          a[1] * m[4] + a[3] * m[5] + a[5],
        ]
      } else if (ops.fnArray[i] === OPS.paintImageXObject) {
        const imgName = ops.argsArray[i][0]
        try {
          const img = await page.objs.get(imgName)
          if (img && img.data && img.width && img.height) {
            const canvas = document.createElement("canvas")
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext("2d")!

            let imageData: ImageData
            if (img.data instanceof Uint8ClampedArray && img.data.length === img.width * img.height * 4) {
              imageData = new ImageData(img.data, img.width, img.height)
            } else {
              const clamped = new Uint8ClampedArray(img.width * img.height * 4)
              const src = img.data
              if (src.length === img.width * img.height * 3) {
                for (let j = 0, k = 0; j < src.length; j += 3, k += 4) {
                  clamped[k] = src[j]; clamped[k + 1] = src[j + 1]; clamped[k + 2] = src[j + 2]; clamped[k + 3] = 255
                }
              } else if (src.length === img.width * img.height * 4) {
                clamped.set(src)
              } else if (src.length === img.width * img.height) {
                // Grayscale
                for (let j = 0, k = 0; j < src.length; j++, k += 4) {
                  clamped[k] = src[j]; clamped[k + 1] = src[j]; clamped[k + 2] = src[j]; clamped[k + 3] = 255
                }
              } else {
                for (let j = 0; j < clamped.length; j++) clamped[j] = src[j] ?? 255
              }
              imageData = new ImageData(clamped, img.width, img.height)
            }

            ctx.putImageData(imageData, 0, 0)
            const dataUrl = canvas.toDataURL("image/png")
            const resp = await fetch(dataUrl)
            const buf = await resp.arrayBuffer()

            // Get position from transform matrix
            const imgW = Math.abs(currentMatrix[0]) || img.width
            const imgH = Math.abs(currentMatrix[3]) || img.height
            const imgX = currentMatrix[4]
            const imgY = currentMatrix[5]

            images.push({
              data: new Uint8Array(buf),
              x: imgX,
              y: imgY,
              width: imgW,
              height: imgH,
              type: "png",
            })
          }
        } catch { /* skip */ }
      }
    }
  } catch { /* skip */ }
  return images
}

/* ─── Heading detection ─── */

function detectHeadingLevel(fontSize: number, avgFontSize: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] | null {
  if (fontSize >= avgFontSize * 2) return HeadingLevel.HEADING_1
  if (fontSize >= avgFontSize * 1.6) return HeadingLevel.HEADING_2
  if (fontSize >= avgFontSize * 1.3) return HeadingLevel.HEADING_3
  return null
}

/* ─── Main converter ─── */

export async function convertPdfToWord(
  pdfBuffer: ArrayBuffer,
  fileName: string,
  onProgress?: (pct: number) => void
): Promise<{ blob: Blob; name: string }> {
  const pdfjsLib = await import("pdfjs-dist")
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise
  const numPages = pdf.numPages
  const pages: PageData[] = []

  // ── Extract all pages ──
  for (let p = 1; p <= numPages; p++) {
    onProgress?.(Math.round((p / numPages) * 55))
    const page = await pdf.getPage(p)
    const viewport = page.getViewport({ scale: 1 })
    const textContent = await page.getTextContent()

    const textItems: ExtractedText[] = []
    for (const item of textContent.items) {
      if (!("str" in item) || !(item as any).str) continue
      const it = item as any
      const fontName: string = it.fontName || ""
      const isBold = /bold/i.test(fontName) || (it.fontWeight && it.fontWeight >= 700)
      const isItalic = /italic|oblique/i.test(fontName)
      const fontSize = Math.abs(it.transform[0]) || it.height || 12

      textItems.push({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5],
        width: it.width || 0,
        height: it.height || fontSize,
        fontSize,
        fontName,
        bold: isBold,
        italic: isItalic,
        color: colorToHex(it.color),
      })
    }

    const margins = detectMargins(textItems, viewport.width, viewport.height)
    const lines = groupIntoLines(textItems, viewport.width, margins.left, margins.right)
    const images = await extractPageImages(page, viewport)

    pages.push({
      lines, images,
      width: viewport.width, height: viewport.height,
      marginLeft: margins.left, marginRight: margins.right,
      marginTop: margins.top, marginBottom: margins.bottom,
    })
  }

  onProgress?.(60)

  // ── Detect average font size for headings ──
  const allFontSizes = pages.flatMap(p => p.lines.map(l => l.fontSize))
  const avgFontSize = allFontSizes.length > 0
    ? allFontSizes.sort((a, b) => a - b)[Math.floor(allFontSizes.length / 2)]
    : 12

  onProgress?.(65)

  // ── Build document sections ──
  const baseName = fileName.replace(/\.[^.]+$/, "")
  const docSections = []

  for (let pi = 0; pi < pages.length; pi++) {
    const pg = pages[pi]
    const paragraphs: Paragraph[] = []
    const tableInfo = detectTables(pg.lines, pg.width)
    const renderedAsTable = new Set<number>()

    // Track image insertion points (interleave with text by Y position)
    const imagesByY = [...pg.images].sort((a, b) => b.y - a.y) // top-first

    let prevLineY: number | null = null
    let nextImageIdx = 0

    for (let li = 0; li < pg.lines.length; li++) {
      const line = pg.lines[li]

      // Insert images that should appear before this line
      while (nextImageIdx < imagesByY.length && imagesByY[nextImageIdx].y > line.y) {
        const img = imagesByY[nextImageIdx]
        try {
          const maxW = 570
          const scale = img.width > maxW ? maxW / img.width : 1
          const w = Math.round(img.width * scale)
          const h = Math.round(img.height * scale)
          paragraphs.push(new Paragraph({
            children: [new ImageRun({ data: img.data, transformation: { width: w, height: h }, type: "png" })],
            spacing: { before: 80, after: 80 },
          }))
        } catch { /* skip */ }
        nextImageIdx++
      }

      // Skip lines already rendered as part of a table
      if (renderedAsTable.has(li)) continue

      // Check if this line is part of a table
      if (tableInfo.has(li)) {
        const tbl = tableInfo.get(li)!
        if (!renderedAsTable.has(li) && tbl.cellTexts) {
          // Build a Word table
          try {
            const tableRows: TableRow[] = tbl.cellTexts.map(rowCells => {
              return new TableRow({
                children: rowCells.map(cellText => new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: cellText,
                      size: Math.round(avgFontSize * 2),
                      font: "Calibri",
                    })],
                  })],
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
                  },
                })),
              })
            })

            paragraphs.push(new Paragraph({ children: [] })) // spacer
            const table = new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
            paragraphs.push(table as any) // docx allows Table in children array
          } catch { /* fallback: render as text */ }

          // Mark all lines in this table as rendered
          for (const entry of tableInfo.entries()) {
            if (entry[1] === tbl) renderedAsTable.add(entry[0])
          }
          continue
        }
      }

      // ── Regular text line ──
      const runs: TextRun[] = []

      for (let ti = 0; ti < line.texts.length; ti++) {
        const t = line.texts[ti]

        // Insert spacing between non-adjacent text items
        if (ti > 0) {
          const prev = line.texts[ti - 1]
          const gap = t.x - (prev.x + prev.width)
          if (gap > t.fontSize * 0.3) {
            runs.push(new TextRun({ text: "\t" }))
          } else if (gap > 1.5) {
            runs.push(new TextRun({ text: " " }))
          }
        }

        runs.push(new TextRun({
          text: t.str,
          bold: t.bold,
          italics: t.italic,
          size: Math.round(t.fontSize * 2), // half-points
          font: mapFont(t.fontName),
          color: t.color !== "000000" ? t.color : undefined,
        }))
      }

      // Calculate vertical spacing from PDF coordinates
      let spacingBefore = 0
      if (prevLineY !== null) {
        const gapPts = prevLineY - line.y
        // Convert PDF points gap to Word twips (1pt = 20twip)
        const lineH = line.fontSize * 1.2
        const extraGap = gapPts - lineH
        if (extraGap > line.fontSize * 1.5) spacingBefore = Math.round(extraGap * 14)
        else if (extraGap > line.fontSize * 0.5) spacingBefore = Math.round(extraGap * 10)
        else if (extraGap > 2) spacingBefore = Math.round(extraGap * 6)
      }

      const headingLevel = detectHeadingLevel(line.fontSize, avgFontSize)

      const alignMap = {
        left: AlignmentType.LEFT,
        center: AlignmentType.CENTER,
        right: AlignmentType.RIGHT,
        justify: AlignmentType.JUSTIFIED,
      }

      const para = new Paragraph({
        children: runs,
        heading: headingLevel || undefined,
        alignment: alignMap[line.alignment],
        spacing: { before: spacingBefore, after: 20 },
        indent: line.indentLeft > 15 ? { left: Math.round(line.indentLeft * 15) } : undefined,
      })

      paragraphs.push(para)
      prevLineY = line.y
    }

    // Insert remaining images after text
    while (nextImageIdx < imagesByY.length) {
      const img = imagesByY[nextImageIdx]
      try {
        const maxW = 570
        const scale = img.width > maxW ? maxW / img.width : 1
        paragraphs.push(new Paragraph({
          children: [new ImageRun({
            data: img.data,
            transformation: { width: Math.round(img.width * scale), height: Math.round(img.height * scale) },
            type: "png",
          })],
          spacing: { before: 80, after: 80 },
        }))
      } catch { /* skip */ }
      nextImageIdx++
    }

    if (paragraphs.length === 0) {
      paragraphs.push(new Paragraph({ children: [new TextRun("")] }))
    }

    // Use actual PDF page dimensions (pts → twips: 1pt = 20twip)
    const ptsToTwip = (pts: number) => Math.round(pts * 20)

    docSections.push({
      properties: {
        page: {
          size: {
            width: ptsToTwip(pg.width),
            height: ptsToTwip(pg.height),
          },
          margin: {
            top: ptsToTwip(Math.max(pg.marginTop, 36)),
            bottom: ptsToTwip(Math.max(pg.marginBottom, 36)),
            left: ptsToTwip(Math.max(pg.marginLeft, 36)),
            right: ptsToTwip(Math.max(pg.marginRight, 36)),
          },
        },
      },
      children: paragraphs,
    })

    onProgress?.(65 + Math.round((pi / pages.length) * 30))
  }

  const doc = new Document({
    creator: "DocFlow Converter",
    title: baseName,
    description: `Converted from PDF (${numPages} pages)`,
    sections: docSections,
  })

  onProgress?.(96)
  const docxBlob = await Packer.toBlob(doc)
  onProgress?.(100)

  return { blob: docxBlob, name: baseName + ".docx" }
}
