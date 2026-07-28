"use client"

import { useCallback, useRef, useState } from "react"
import { PDFDocument, PDFName, PDFString } from "pdf-lib"
import {
  Link2,
  Upload,
  Download,
  Loader2,
  AlertCircle,
  Check,
  X,
  Crosshair,
  Eye,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  Maximize2,
  ExternalLink,
  Search,
  Sparkles,
  Unplug,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

const PDFJS_SCRIPT = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"

interface LinkHotspot {
  id: string
  pageIndex: number // 0-indexed
  url: string
  x: number // percent
  y: number
  width: number
  height: number
}

interface PdfjsPage {
  getViewport: (opts: { scale: number }) => { width: number; height: number }
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => {
    promise: Promise<void>
  }
}
interface PdfjsDocument {
  numPages: number
  getPage: (num: number) => Promise<PdfjsPage>
}
interface PdfjsLib {
  GlobalWorkerOptions: { workerSrc: string }
  getDocument: (opts: { data: Uint8Array }) => { promise: Promise<PdfjsDocument> }
}

async function loadPdfJs(): Promise<PdfjsLib> {
  if (!(window as unknown as { pdfjsLib?: PdfjsLib }).pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script")
      script.src = PDFJS_SCRIPT
      script.onload = () => resolve()
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  const pdfjsLib = (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER
  return pdfjsLib
}

function makeId() {
  return "lk_" + Math.random().toString(36).slice(2, 10)
}

function normalizeUrl(raw: string): string | null {
  let url = raw.trim()
  if (!url) return null
  if (!/^(https?:\/\/|mailto:)/i.test(url)) {
    url = url.includes("@") ? `mailto:${url}` : `https://${url}`
  }
  if (url.startsWith("mailto:")) return url
  try {
    new URL(url)
    return url
  } catch {
    return null
  }
}

export default function PdfLinkEditor() {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null)
  const pdfDocRef = useRef<PdfjsDocument | null>(null)

  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({})

  const [mode, setMode] = useState<"draw" | "preview">("draw")
  const [links, setLinks] = useState<LinkHotspot[]>([])
  const [search, setSearch] = useState("")

  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [isRendering, setIsRendering] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: "success" | "info"; message: string } | null>(null)

  const [dialog, setDialog] = useState<{
    open: boolean
    editId: string | null
    pendingRect: { x: number; y: number; width: number; height: number } | null
    value: string
    error: string
  }>({ open: false, editId: null, pendingRect: null, value: "", error: "" })

  const [confirmingClear, setConfirmingClear] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  const drawStateRef = useRef<{ startX: number; startY: number } | null>(null)
  const dragStateRef = useRef<{
    id: string
    offsetX: number
    offsetY: number
    overlayW: number
    overlayH: number
  } | null>(null)
  const resizeStateRef = useRef<{ id: string; overlayW: number; overlayH: number } | null>(null)
  const clearConfirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [draftBox, setDraftBox] = useState<{
    left: number
    top: number
    width: number
    height: number
  } | null>(null)

  const showNotice = useCallback((message: string, type: "success" | "info" = "success") => {
    if (noticeTimeout.current) clearTimeout(noticeTimeout.current)
    setNotice({ type, message })
    noticeTimeout.current = setTimeout(() => setNotice(null), 3000)
  }, [])

  // Render the active page onto the canvas at the current zoom level
  const renderPage = useCallback(async (pageNum: number, scale: number) => {
    const pdfDoc = pdfDocRef.current
    const canvas = canvasRef.current
    if (!pdfDoc || !canvas) return
    setIsRendering(true)
    try {
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale })
      const context = canvas.getContext("2d")
      if (!context) return
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: context, viewport }).promise
    } catch (err) {
      console.error("Page render error:", err)
      setErrorMessage("Failed to render this page.")
    } finally {
      setIsRendering(false)
    }
  }, [])

  const goToPage = useCallback(
    (pageNum: number) => {
      if (pageNum < 1 || pageNum > numPages) return
      setCurrentPage(pageNum)
      renderPage(pageNum, zoom)
    },
    [numPages, zoom, renderPage]
  )

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Unsupported file type. Please upload a PDF file.")
      return
    }
    setIsLoadingFile(true)
    setErrorMessage(null)
    try {
      const buffer = new Uint8Array(await file.arrayBuffer())
      setPdfBytes(buffer)

      const pdfjsLib = await loadPdfJs()
      const doc = await pdfjsLib.getDocument({ data: buffer.slice() }).promise
      pdfDocRef.current = doc
      setNumPages(doc.numPages)
      setCurrentPage(1)
      setLinks([])
      setThumbnails({})

      const container = overlayRef.current?.parentElement
      const fitWidth = (container?.clientWidth ?? 700) - 32
      const firstPage = await doc.getPage(1)
      const baseViewport = firstPage.getViewport({ scale: 1 })
      const initialZoom = Math.min(fitWidth / baseViewport.width, 1.4)
      setZoom(initialZoom)
      renderPage(1, initialZoom)

      showNotice(`Document loaded — ${doc.numPages} page${doc.numPages === 1 ? "" : "s"}.`)

      // Background-render small thumbnails for the page rail
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const viewport = page.getViewport({ scale: 0.3 })
        const thumbCanvas = document.createElement("canvas")
        const ctx = thumbCanvas.getContext("2d")
        if (!ctx) continue
        thumbCanvas.width = viewport.width
        thumbCanvas.height = viewport.height
        await page.render({ canvasContext: ctx, viewport }).promise
        const dataUrl = thumbCanvas.toDataURL("image/png")
        setThumbnails((prev) => ({ ...prev, [i]: dataUrl }))
      }
    } catch (err) {
      console.error(err)
      setErrorMessage("Could not read this PDF. It may be corrupted or encrypted.")
    } finally {
      setIsLoadingFile(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ""
  }

  const [isDragOver, setIsDragOver] = useState(false)
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const resetAll = () => {
    setPdfBytes(null)
    pdfDocRef.current = null
    setNumPages(0)
    setCurrentPage(1)
    setLinks([])
    setThumbnails({})
    setErrorMessage(null)
  }

  const applyZoom = (newZoom: number) => {
    const clamped = Math.max(0.3, Math.min(2.5, +newZoom.toFixed(2)))
    setZoom(clamped)
    renderPage(currentPage, clamped)
  }
  const zoomIn = () => applyZoom(zoom + 0.15)
  const zoomOut = () => applyZoom(zoom - 0.15)

  // ---- Drawing new hotspots ----
  const handleOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== "draw" || e.target !== e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    const startX = e.clientX - rect.left
    const startY = e.clientY - rect.top
    drawStateRef.current = { startX, startY }
    setDraftBox({ left: startX, top: startY, width: 0, height: 0 })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleOverlayPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawStateRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const { startX, startY } = drawStateRef.current
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
    setDraftBox({
      left: Math.min(startX, x),
      top: Math.min(startY, y),
      width: Math.abs(x - startX),
      height: Math.abs(y - startY),
    })
  }

  const handleOverlayPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawStateRef.current) return
    drawStateRef.current = null
    const rect = e.currentTarget.getBoundingClientRect()
    setDraftBox((box) => {
      if (box && box.width >= 10 && box.height >= 10) {
        openDialogForNewBox({
          x: (box.left / rect.width) * 100,
          y: (box.top / rect.height) * 100,
          width: (box.width / rect.width) * 100,
          height: (box.height / rect.height) * 100,
        })
      }
      return null
    })
  }

  // ---- Dragging / resizing existing hotspots ----
  const handleBoxPointerDown = (link: LinkHotspot, e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== "draw") return
    e.stopPropagation()
    const overlay = overlayRef.current
    if (!overlay) return
    const overlayRect = overlay.getBoundingClientRect()
    const boxRect = e.currentTarget.getBoundingClientRect()
    dragStateRef.current = {
      id: link.id,
      offsetX: e.clientX - boxRect.left,
      offsetY: e.clientY - boxRect.top,
      overlayW: overlayRect.width,
      overlayH: overlayRect.height,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleBoxPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current
    if (!drag) return
    const overlay = overlayRef.current
    if (!overlay) return
    const overlayRect = overlay.getBoundingClientRect()
    const x = e.clientX - overlayRect.left - drag.offsetX
    const y = e.clientY - overlayRect.top - drag.offsetY
    setLinks((prev) =>
      prev.map((l) => {
        if (l.id !== drag.id) return l
        const newX = Math.max(0, Math.min(100 - l.width, (x / drag.overlayW) * 100))
        const newY = Math.max(0, Math.min(100 - l.height, (y / drag.overlayH) * 100))
        return { ...l, x: newX, y: newY }
      })
    )
  }

  const handleBoxPointerUp = () => {
    dragStateRef.current = null
  }

  const handleResizePointerDown = (link: LinkHotspot, e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== "draw") return
    e.stopPropagation()
    const overlay = overlayRef.current
    if (!overlay) return
    const overlayRect = overlay.getBoundingClientRect()
    resizeStateRef.current = { id: link.id, overlayW: overlayRect.width, overlayH: overlayRect.height }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const resize = resizeStateRef.current
    if (!resize) return
    const overlay = overlayRef.current
    if (!overlay) return
    const overlayRect = overlay.getBoundingClientRect()
    const xPercent = ((e.clientX - overlayRect.left) / resize.overlayW) * 100
    const yPercent = ((e.clientY - overlayRect.top) / resize.overlayH) * 100
    setLinks((prev) =>
      prev.map((l) => {
        if (l.id !== resize.id) return l
        const width = Math.min(100 - l.x, Math.max(3, xPercent - l.x))
        const height = Math.min(100 - l.y, Math.max(3, yPercent - l.y))
        return { ...l, width, height }
      })
    )
  }

  const handleResizePointerUp = () => {
    resizeStateRef.current = null
  }

  // ---- URL dialog ----
  const openDialogForNewBox = (rect: { x: number; y: number; width: number; height: number }) => {
    setDialog({ open: true, editId: null, pendingRect: rect, value: "", error: "" })
    setTimeout(() => urlInputRef.current?.focus(), 100)
  }

  const openDialogForEdit = (link: LinkHotspot) => {
    setDialog({ open: true, editId: link.id, pendingRect: null, value: link.url, error: "" })
    setTimeout(() => urlInputRef.current?.focus(), 100)
  }

  const closeDialog = () => setDialog({ open: false, editId: null, pendingRect: null, value: "", error: "" })

  const saveDialog = () => {
    const normalized = normalizeUrl(dialog.value)
    if (!normalized) {
      setDialog((d) => ({ ...d, error: "Enter a valid URL (http://, https://, or mailto:)" }))
      return
    }
    if (dialog.editId) {
      setLinks((prev) => prev.map((l) => (l.id === dialog.editId ? { ...l, url: normalized } : l)))
      showNotice("Link updated.")
    } else if (dialog.pendingRect) {
      const newLink: LinkHotspot = {
        id: makeId(),
        pageIndex: currentPage - 1,
        url: normalized,
        ...dialog.pendingRect,
      }
      setLinks((prev) => [...prev, newLink])
      showNotice("Hotspot created.")
    }
    closeDialog()
  }

  const deleteLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id))
    showNotice("Hotspot removed.", "info")
  }

  const focusLink = (link: LinkHotspot) => {
    if (link.pageIndex + 1 !== currentPage) goToPage(link.pageIndex + 1)
  }

  const clearAllLinks = () => {
    if (links.length === 0) return
    if (!confirmingClear) {
      setConfirmingClear(true)
      clearConfirmTimeout.current = setTimeout(() => setConfirmingClear(false), 3000)
      return
    }
    if (clearConfirmTimeout.current) clearTimeout(clearConfirmTimeout.current)
    setConfirmingClear(false)
    setLinks([])
    showNotice("All hotspots cleared.", "info")
  }

  // ---- Export ----
  const [isExporting, setIsExporting] = useState(false)
  const exportPdf = async () => {
    if (!pdfBytes) return
    setIsExporting(true)
    setErrorMessage(null)
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes.slice())
      const pages = pdfDoc.getPages()

      for (const link of links) {
        const page = pages[link.pageIndex]
        if (!page) continue
        const { width, height } = page.getSize()

        const x1 = (link.x / 100) * width
        const y2 = height - (link.y / 100) * height
        const x2 = ((link.x + link.width) / 100) * width
        const y1 = height - ((link.y + link.height) / 100) * height

        const annotation = pdfDoc.context.obj({
          Type: "Annot",
          Subtype: "Link",
          Rect: [x1, y1, x2, y2],
          Border: [0, 0, 0],
          A: { Type: "Action", S: "URI", URI: PDFString.of(link.url) },
        })
        const annotRef = pdfDoc.context.register(annotation)

        let annots = page.node.get(PDFName.of("Annots"))
        if (!annots) {
          annots = pdfDoc.context.obj([])
          page.node.set(PDFName.of("Annots"), annots)
        }
        // @ts-expect-error pdf-lib's low-level array ref supports push at runtime
        annots.push(annotRef)
      }

      const outBytes = await pdfDoc.save()
      const blob = new Blob([outBytes as unknown as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "linked-document.pdf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showNotice(`Exported with ${links.length} link${links.length === 1 ? "" : "s"}.`)
    } catch (err) {
      console.error(err)
      setErrorMessage("Failed to export the PDF. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const filteredLinks = links.filter((l) => l.url.toLowerCase().includes(search.toLowerCase()))
  const pageLinks = links.filter((l) => l.pageIndex === currentPage - 1)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-24 pb-12 sm:px-6 sm:pt-28 sm:pb-16">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="gap-1 text-xs px-2.5 py-0.5 font-medium">
                <Sparkles className="w-3 h-3 text-primary" /> Interactive Hotspots
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              PDF Link Editor
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Draw clickable areas over any PDF page and attach a URL. Export a copy with real,
              native link annotations that work in any PDF viewer.
            </p>
          </div>

          {numPages > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={resetAll} className="gap-1.5">
                <X className="w-4 h-4" /> New File
              </Button>
              <Button
                size="sm"
                onClick={exportPdf}
                disabled={isExporting}
                className="gap-1.5 shadow-sm"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export PDF
              </Button>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
            <button onClick={() => setErrorMessage(null)} className="opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {numPages === 0 ? (
          <Card className="border-2 border-dashed border-border transition-colors hover:border-primary/50">
            <CardContent className="p-0">
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragOver(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  setIsDragOver(false)
                }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center py-16 px-6 text-center cursor-pointer transition-colors ${
                  isDragOver ? "bg-primary/5" : ""
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  {isLoadingFile ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <Link2 className="w-8 h-8" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Upload a PDF to start adding links
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  Drag & drop a PDF file here, or click to browse. Draw a box on any page, attach
                  a URL, then export a fully interactive copy.
                </p>
                <Button disabled={isLoadingFile} className="gap-2 shadow-sm">
                  <Upload className="w-4 h-4" /> Choose PDF File
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[152px_1fr_300px] gap-4">
            {/* Page thumbnail rail */}
            <div className="order-2 lg:order-1 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[70vh] pb-1 lg:pb-0">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`shrink-0 rounded-lg border p-1.5 transition-all ${
                    pageNum === currentPage
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  {thumbnails[pageNum] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbnails[pageNum]}
                      alt={`Page ${pageNum}`}
                      className="w-16 lg:w-full rounded shadow-sm"
                    />
                  ) : (
                    <div className="w-16 lg:w-full aspect-[3/4] rounded bg-muted animate-pulse" />
                  )}
                  <span
                    className={`block text-center text-[10px] font-semibold mt-1 ${
                      pageNum === currentPage ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {pageNum}
                    {links.some((l) => l.pageIndex === pageNum - 1) && (
                      <Link2 className="w-2.5 h-2.5 inline-block ml-1 -mt-0.5 text-primary" />
                    )}
                  </span>
                </button>
              ))}
            </div>

            {/* Editor workspace */}
            <div className="order-1 lg:order-2 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-card border border-border">
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted/50 rounded-lg">
                  <button
                    onClick={() => setMode("draw")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                      mode === "draw"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" /> Add Links
                  </button>
                  <button
                    onClick={() => setMode("preview")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                      mode === "preview"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon-sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap px-1">
                    Page {currentPage} / {numPages}
                  </span>
                  <Button variant="ghost" size="icon-sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= numPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <Button variant="ghost" size="icon-sm" onClick={zoomOut}>
                    <ZoomOut className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-9 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button variant="ghost" size="icon-sm" onClick={zoomIn}>
                    <ZoomIn className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 rounded-xl border border-border bg-muted/20 p-4 overflow-auto flex items-start justify-center min-h-[60vh]">
                <div className="relative shadow-lg rounded-lg shrink-0">
                  {isRendering && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-lg">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                  <canvas ref={canvasRef} className="rounded-lg border border-border block max-w-none" />
                  <div
                    ref={overlayRef}
                    className={`absolute inset-0 select-none ${mode === "draw" ? "cursor-crosshair" : ""}`}
                    onPointerDown={handleOverlayPointerDown}
                    onPointerMove={handleOverlayPointerMove}
                    onPointerUp={handleOverlayPointerUp}
                  >
                    {draftBox && (
                      <div
                        className="absolute border-2 border-primary bg-primary/10 rounded pointer-events-none"
                        style={{
                          left: draftBox.left,
                          top: draftBox.top,
                          width: draftBox.width,
                          height: draftBox.height,
                        }}
                      />
                    )}

                    {pageLinks.map((link) =>
                      mode === "draw" ? (
                        <div
                          key={link.id}
                          className="group absolute rounded border-2 border-dashed border-primary bg-primary/10 hover:bg-primary/20 hover:border-primary/80 transition-colors cursor-grab"
                          style={{
                            left: `${link.x}%`,
                            top: `${link.y}%`,
                            width: `${link.width}%`,
                            height: `${link.height}%`,
                          }}
                          onPointerDown={(e) => handleBoxPointerDown(link, e)}
                          onPointerMove={handleBoxPointerMove}
                          onPointerUp={handleBoxPointerUp}
                        >
                          <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-1 max-w-[160px] overflow-hidden">
                            <Link2 className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{link.url.replace(/^https?:\/\//, "")}</span>
                          </div>
                          <button
                            onClick={() => deleteLink(link.id)}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="absolute top-1 right-1 p-0.5 rounded bg-background/80 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div
                            onPointerDown={(e) => handleResizePointerDown(link, e)}
                            onPointerMove={handleResizePointerMove}
                            onPointerUp={handleResizePointerUp}
                            className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary rounded-tl cursor-se-resize"
                          />
                        </div>
                      ) : (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          title={link.url}
                          className="absolute block rounded bg-primary/0 hover:bg-primary/15 border border-transparent hover:border-primary/40 transition-colors"
                          style={{
                            left: `${link.x}%`,
                            top: `${link.y}%`,
                            width: `${link.width}%`,
                            height: `${link.height}%`,
                          }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {mode === "draw"
                  ? "Drag on the page to draw a new hotspot. Drag an existing one to move it, or use its corner handle to resize."
                  : "Preview mode — click a highlighted area to test its link."}
              </p>
            </div>

            {/* Links inspector */}
            <div className="order-3 flex flex-col gap-3">
              <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Link Hotspots</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-semibold text-primary">{links.length}</span> in this document
                  </p>
                </div>
                <button
                  onClick={clearAllLinks}
                  disabled={links.length === 0}
                  className={`text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-30 ${
                    confirmingClear ? "text-amber-600 dark:text-amber-400" : "text-destructive hover:opacity-80"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" /> {confirmingClear ? "Confirm?" : "Clear All"}
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search links..."
                  className="pl-8"
                />
              </div>

              <div className="flex-1 space-y-2 lg:max-h-[52vh] overflow-y-auto pr-0.5">
                {filteredLinks.length === 0 ? (
                  <div className="text-center py-12 px-4 text-muted-foreground">
                    <Unplug className="w-9 h-9 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">
                      {links.length === 0 ? "No hotspots added yet. Draw a box on the page to start." : "No matching links found."}
                    </p>
                  </div>
                ) : (
                  filteredLinks.map((link) => (
                    <div
                      key={link.id}
                      className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                        link.pageIndex === currentPage - 1
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          Page {link.pageIndex + 1}
                        </span>
                        <div className="flex gap-0.5 shrink-0">
                          <button onClick={() => focusLink(link)} title="Go to page" className="p-1 text-muted-foreground hover:text-primary hover:bg-muted rounded">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openDialogForEdit(link)} title="Edit URL" className="p-1 text-muted-foreground hover:text-amber-500 hover:bg-muted rounded">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteLink(link.id)} title="Delete" className="p-1 text-muted-foreground hover:text-destructive hover:bg-muted rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-foreground font-medium truncate" title={link.url}>
                          {link.url}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* URL Dialog */}
      {dialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full bg-card rounded-2xl border border-border shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" /> Configure Link Hotspot
              </h3>
              <button onClick={closeDialog} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Destination URL
                </label>
                <Input
                  ref={urlInputRef}
                  value={dialog.value}
                  onChange={(e) => setDialog((d) => ({ ...d, value: e.target.value, error: "" }))}
                  onKeyDown={(e) => e.key === "Enter" && saveDialog()}
                  placeholder="https://example.com/page"
                  className={`h-10 ${dialog.error ? "border-destructive" : ""}`}
                />
                {dialog.error && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {dialog.error}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={saveDialog}>Save Hotspot</Button>
            </div>
          </div>
        </div>
      )}

      {/* Transient notice */}
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-xl border bg-card border-border shadow-xl max-w-sm">
          <div className={notice.type === "success" ? "text-emerald-500" : "text-primary"}>
            <Check className="w-5 h-5" />
          </div>
          <div className="text-sm font-medium text-foreground flex-1">{notice.message}</div>
        </div>
      )}

      <Footer />
    </div>
  )
}
