"use client"

import { useState, useRef, ChangeEvent, DragEvent } from "react"
import {
  FileText,
  Trash2,
  Download,
  Loader2,
  AlertCircle,
  Check,
  Plus,
  RotateCw,
  CheckSquare,
  Square,
  Layers,
  X,
} from "lucide-react"
import { PDFDocument, degrees } from "pdf-lib"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ToolHeader } from "@/components/tool-header"

interface SourceDoc {
  id: string
  name: string
  file: File
  pageCount: number
  color: string
  isImage?: boolean
}

interface PageItem {
  id: string
  docId: string
  docName: string
  docColor: string
  originalPageIndex: number // 0-indexed
  rotation: number // 0, 90, 180, 270
  selected: boolean
  thumbnail?: string
  isImage?: boolean
}

const COLOR_PALETTE = [
  "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
]

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export default function PDFOrganizer() {
  const [sourceDocs, setSourceDocs] = useState<SourceDoc[]>([])
  const [pages, setPages] = useState<PageItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Export result state
  const [mergedUrl, setMergedUrl] = useState<string | null>(null)
  const [mergedFilename, setMergedFilename] = useState<string>("")
  const [mergedSize, setMergedSize] = useState<number>(0)

  // Drag and drop reordering states
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null)
  const [dragOverPageIndex, setDragOverPageIndex] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter(
      (f) =>
        f.type === "application/pdf" ||
        f.name.toLowerCase().endsWith(".pdf") ||
        f.type.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(f.name)
    )

    if (validFiles.length === 0) return

    setIsLoadingFiles(true)
    setErrorMessage(null)
    setMergedUrl(null)

    const newDocs: SourceDoc[] = []
    const newPages: PageItem[] = []
    const pdfDocsToRender: SourceDoc[] = []

    const batchTimestamp = Date.now()

    for (let index = 0; index < validFiles.length; index++) {
      const file = validFiles[index]
      const docId = `doc_${batchTimestamp}_${index}`
      const color = COLOR_PALETTE[(sourceDocs.length + index) % COLOR_PALETTE.length]
      const isImg = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(file.name)

      if (isImg) {
        const previewUrl = URL.createObjectURL(file)
        const sourceDoc: SourceDoc = {
          id: docId,
          name: file.name,
          file,
          pageCount: 1,
          color,
          isImage: true,
        }
        newDocs.push(sourceDoc)

        newPages.push({
          id: `${docId}_img_0`,
          docId,
          docName: file.name,
          docColor: color,
          originalPageIndex: 0,
          rotation: 0,
          selected: true,
          thumbnail: previewUrl,
          isImage: true,
        })
      } else {
        try {
          const arrayBuffer = await file.arrayBuffer()
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
          const pageCount = pdfDoc.getPageCount()

          const sourceDoc: SourceDoc = {
            id: docId,
            name: file.name,
            file,
            pageCount,
            color,
            isImage: false,
          }
          newDocs.push(sourceDoc)
          pdfDocsToRender.push(sourceDoc)

          for (let i = 0; i < pageCount; i++) {
            newPages.push({
              id: `${docId}_p_${i}`,
              docId,
              docName: file.name,
              docColor: color,
              originalPageIndex: i,
              rotation: 0,
              selected: true,
              isImage: false,
            })
          }
        } catch (err) {
          console.error("Error reading PDF:", err)
          setErrorMessage(`Failed to read "${file.name}". It might be encrypted or corrupted.`)
        }
      }
    }

    setSourceDocs((prev) => [...prev, ...newDocs])
    setPages((prev) => [...prev, ...newPages])
    setIsLoadingFiles(false)

    if (pdfDocsToRender.length > 0) {
      renderThumbnailsForFiles(pdfDocsToRender, newPages)
    }
  }

  const renderThumbnailsForFiles = async (newDocs: SourceDoc[], newPages: PageItem[]) => {
    try {
      if (!(window as unknown as { pdfjsLib?: unknown }).pdfjsLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script")
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      const pdfjsLib = (window as unknown as { pdfjsLib: { GlobalWorkerOptions: { workerSrc: string }; getDocument: (data: { data: Uint8Array }) => { promise: Promise<unknown> } } }).pdfjsLib
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"

      for (const doc of newDocs) {
        if (doc.isImage) continue
        const arrayBuffer = await doc.file.arrayBuffer()
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
        const pdfDoc = (await loadingTask.promise) as { getPage: (num: number) => Promise<unknown> }

        for (let i = 0; i < doc.pageCount; i++) {
          const page = (await pdfDoc.getPage(i + 1)) as {
            getViewport: (opts: { scale: number }) => { width: number; height: number }
            render: (params: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> }
          }
          const viewport = page.getViewport({ scale: 0.3 })
          const canvas = document.createElement("canvas")
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext("2d")
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7)

            setPages((prev) =>
              prev.map((p) =>
                p.docId === doc.id && p.originalPageIndex === i ? { ...p, thumbnail: dataUrl } : p
              )
            )
          }
        }
      }
    } catch (err) {
      console.warn("Canvas thumbnail generation error:", err)
    }
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files))
      e.target.value = ""
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files))
    }
  }

  const togglePageSelect = (id: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)))
  }

  const rotatePage = (id: string, delta: number) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newRot = (p.rotation + delta + 360) % 360
          return { ...p, rotation: newRot }
        }
        return p
      })
    )
  }

  const deletePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id))
  }

  const selectAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: true })))
  }

  const deselectAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: false })))
  }

  const clearAll = () => {
    setSourceDocs([])
    setPages([])
    setMergedUrl(null)
    setErrorMessage(null)
  }

  const handleDragStartPage = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedPageIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOverPage = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    if (draggedPageIndex === null || draggedPageIndex === index) return
    setDragOverPageIndex(index)
  }

  const handleDropPage = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    if (draggedPageIndex === null) return

    const updated = [...pages]
    const [movedItem] = updated.splice(draggedPageIndex, 1)
    updated.splice(index, 0, movedItem)
    setPages(updated)
    setDraggedPageIndex(null)
    setDragOverPageIndex(null)
  }

  const convertImageToPngBytes = async (file: File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject("Canvas context error")
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(async (blob) => {
          if (!blob) return reject("Canvas blob error")
          const buf = await blob.arrayBuffer()
          URL.revokeObjectURL(url)
          resolve(new Uint8Array(buf))
        }, "image/png")
      }
      img.onerror = (err) => {
        URL.revokeObjectURL(url)
        reject(err)
      }
      img.src = url
    })
  }

  const handleMergeAndExport = async () => {
    const selectedPages = pages.filter((p) => p.selected)
    if (selectedPages.length === 0) {
      setErrorMessage("Please select at least one page to merge.")
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const mergedPdf = await PDFDocument.create()
      const loadedDocsMap: { [docId: string]: PDFDocument } = {}

      for (const p of selectedPages) {
        const src = sourceDocs.find((d) => d.id === p.docId)
        if (!src) continue

        if (src.isImage) {
          // Embed image as PDF page
          let embeddedImage
          const fileType = src.file.type.toLowerCase()
          if (fileType === "image/jpeg" || fileType === "image/jpg") {
            const bytes = await src.file.arrayBuffer()
            embeddedImage = await mergedPdf.embedJpg(bytes)
          } else if (fileType === "image/png") {
            const bytes = await src.file.arrayBuffer()
            embeddedImage = await mergedPdf.embedPng(bytes)
          } else {
            const pngBytes = await convertImageToPngBytes(src.file)
            embeddedImage = await mergedPdf.embedPng(pngBytes)
          }

          const page = mergedPdf.addPage([embeddedImage.width, embeddedImage.height])
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: embeddedImage.width,
            height: embeddedImage.height,
            rotate: degrees(p.rotation),
          })
        } else {
          // PDF Page
          if (!loadedDocsMap[p.docId]) {
            const buffer = await src.file.arrayBuffer()
            loadedDocsMap[p.docId] = await PDFDocument.load(buffer, { ignoreEncryption: true })
          }
          const srcDoc = loadedDocsMap[p.docId]
          if (srcDoc) {
            const [copiedPage] = await mergedPdf.copyPages(srcDoc, [p.originalPageIndex])
            if (p.rotation !== 0) {
              const current = copiedPage.getRotation().angle
              copiedPage.setRotation(degrees((current + p.rotation) % 360))
            }
            mergedPdf.addPage(copiedPage)
          }
        }
      }

      const pdfBytes = await mergedPdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)

      const filename = `Studio_Compiled_${Date.now()}.pdf`
      setMergedUrl(url)
      setMergedFilename(filename)
      setMergedSize(blob.size)
    } catch (err) {
      console.error("Merge error:", err)
      setErrorMessage("Failed to merge PDF & Image pages. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const selectedCount = pages.filter((p) => p.selected).length

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-24 pb-12 sm:px-6 sm:pt-28 sm:pb-16">
        <ToolHeader
          title="PDF & Image Studio"
          description="Visual canvas: upload multiple PDFs & Images, extract pages, reorder visually, rotate, select custom pages & merge into new PDF documents."
          icon={Layers}
          iconClass="text-indigo-500"
          iconWrapperClass="bg-indigo-500/10 border-indigo-500/20"
          categoryName="PDF Tools"
          badgeText="MULTI-FORMAT CANVAS"
        />

        {pages.length > 0 && (
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoadingFiles}
                className="gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add PDFs / Images
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-4 h-4" /> Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAll}
                className="gap-1.5 cursor-pointer"
              >
                <Square className="w-4 h-4" /> Deselect All
              </Button>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={clearAll}
              className="gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Clear Studio
            </Button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
            <button onClick={() => setErrorMessage(null)} className="opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {pages.length === 0 ? (
          <Card className="border-2 border-dashed border-border transition-colors hover:border-indigo-500/50">
            <CardContent className="p-0">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center py-16 px-6 text-center cursor-pointer transition-colors ${
                  isDragging ? "bg-indigo-500/5" : ""
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf,image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-500 border border-indigo-500/20">
                  {isLoadingFiles ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <Layers className="w-8 h-8" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Upload PDFs or Image files
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mb-4">
                  Drag and drop files here, or click to browse. Supports PDF documents & JPG, PNG, WEBP, GIF, SVG images.
                </p>
                <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer">
                  Select Files
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf,image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Visual Canvas Page Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  draggable
                  onDragStart={(e) => handleDragStartPage(e, index)}
                  onDragOver={(e) => handleDragOverPage(e, index)}
                  onDrop={(e) => handleDropPage(e, index)}
                  className={`group relative rounded-md border bg-card p-2.5 transition-all shadow-xs flex flex-col justify-between ${
                    page.selected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-border opacity-60"
                  } ${dragOverPageIndex === index ? "border-rose-500 bg-rose-500/5 scale-105" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2 text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${page.docColor}`}>
                      {page.isImage ? "IMG" : `P.${page.originalPageIndex + 1}`}
                    </span>

                    <button
                      onClick={() => togglePageSelect(page.id)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {page.selected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative aspect-[3/4] w-full rounded border border-border/60 bg-muted/30 overflow-hidden flex items-center justify-center">
                    {page.thumbnail ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={page.thumbnail}
                        alt={page.docName}
                        style={{ transform: `rotate(${page.rotation}deg)` }}
                        className="w-full h-full object-contain transition-transform"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <FileText className="w-8 h-8 opacity-40" />
                        <span className="text-[10px]">Loading...</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-1 text-xs">
                    <p className="text-[11px] font-medium text-foreground truncate max-w-[100px]" title={page.docName}>
                      {page.docName}
                    </p>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => rotatePage(page.id, 90)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deletePage(page.id)}
                        className="p-1 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                        title="Delete page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Export Action Toolbar */}
            <div className="sticky bottom-4 z-20 rounded-md border border-border bg-card p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground">
                Selected <span className="font-bold text-foreground">{selectedCount}</span> of {pages.length} pages
              </div>

              {mergedUrl ? (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Ready ({formatBytes(mergedSize)})
                  </div>
                  <a
                    href={mergedUrl}
                    download={mergedFilename}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </a>
                </div>
              ) : (
                <Button
                  onClick={handleMergeAndExport}
                  disabled={selectedCount === 0 || isProcessing}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Compiling Document...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      <span>Export Selected Pages ({selectedCount})</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
