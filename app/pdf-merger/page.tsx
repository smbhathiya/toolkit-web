"use client"

import { useState, useRef, ChangeEvent, DragEvent } from "react"
import {
  FileText,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Loader2,
  FileStack,
  AlertCircle,
  Check,
  Plus,
  GripVertical,
  Layers,
  Sparkles,
  FileImage,
} from "lucide-react"
import { PDFDocument } from "pdf-lib"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ToolHeader } from "@/components/tool-header"

interface PDFItem {
  id: string
  file: File
  pageCount: number | null
  loading: boolean
  isImage?: boolean
  previewUrl?: string
  error?: string
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export default function PDFMerger() {
  const [items, setItems] = useState<PDFItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [mergeSuccess, setMergeSuccess] = useState(false)
  const [mergedUrl, setMergedUrl] = useState<string | null>(null)
  const [mergedFilename, setMergedFilename] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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

    const batchTime = Date.now()
    const newItems: PDFItem[] = validFiles.map((file, idx) => {
      const isImg = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(file.name)
      return {
        id: `file_${batchTime}_${idx}`,
        file,
        pageCount: isImg ? 1 : null,
        loading: !isImg,
        isImage: isImg,
        previewUrl: isImg ? URL.createObjectURL(file) : undefined,
      }
    })

    setItems((prev) => [...prev, ...newItems])
    setMergeSuccess(false)
    setMergedUrl(null)
    setErrorMessage(null)

    for (const item of newItems) {
      if (item.isImage) continue
      try {
        const arrayBuffer = await item.file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
        const count = pdfDoc.getPageCount()
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, pageCount: count, loading: false } : i))
        )
      } catch (err) {
        console.error("Error reading PDF:", err)
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, loading: false, error: "Failed to parse PDF" }
              : i
          )
        )
      }
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files))
      if (fileInputRef.current) fileInputRef.current.value = ""
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

  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return
    const newItems = [...items]
    const [moved] = newItems.splice(index, 1)
    newItems.splice(targetIndex, 0, moved)
    setItems(newItems)
    setMergeSuccess(false)
    setMergedUrl(null)
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    setMergeSuccess(false)
    setMergedUrl(null)
  }

  const clearAll = () => {
    setItems([])
    setMergeSuccess(false)
    setMergedUrl(null)
    setErrorMessage(null)
  }

  const handleDragStartItem = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOverItem = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    setDragOverIndex(index)
  }

  const handleDropItem = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

    const newItems = [...items]
    const [draggedItem] = newItems.splice(draggedIndex, 1)
    newItems.splice(index, 0, draggedItem)

    setItems(newItems)
    setDraggedIndex(null)
    setDragOverIndex(null)
    setMergeSuccess(false)
    setMergedUrl(null)
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

  const mergePDFs = async () => {
    if (items.length < 2) return
    setIsMerging(true)
    setErrorMessage(null)

    try {
      const mergedPdf = await PDFDocument.create()

      for (const item of items) {
        if (item.error) continue

        if (item.isImage) {
          let embeddedImage
          const fileType = item.file.type.toLowerCase()
          if (fileType === "image/jpeg" || fileType === "image/jpg") {
            const bytes = await item.file.arrayBuffer()
            embeddedImage = await mergedPdf.embedJpg(bytes)
          } else if (fileType === "image/png") {
            const bytes = await item.file.arrayBuffer()
            embeddedImage = await mergedPdf.embedPng(bytes)
          } else {
            const pngBytes = await convertImageToPngBytes(item.file)
            embeddedImage = await mergedPdf.embedPng(pngBytes)
          }

          const page = mergedPdf.addPage([embeddedImage.width, embeddedImage.height])
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: embeddedImage.width,
            height: embeddedImage.height,
          })
        } else {
          const arrayBuffer = await item.file.arrayBuffer()
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
          copiedPages.forEach((page) => mergedPdf.addPage(page))
        }
      }

      const mergedPdfBytes = await mergedPdf.save()
      const blob = new Blob([mergedPdfBytes as unknown as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)

      setMergedUrl(url)
      setMergedFilename(`merged_document_${Date.now()}.pdf`)
      setMergeSuccess(true)
    } catch (err) {
      console.error("Failed to merge files:", err)
      setErrorMessage("Failed to merge files. Please check if any files are corrupted.")
    } finally {
      setIsMerging(false)
    }
  }

  const downloadFile = () => {
    if (!mergedUrl) return
    const link = document.createElement("a")
    link.href = mergedUrl
    link.download = mergedFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalPagesCount = items.reduce((acc, curr) => acc + (curr.pageCount || 0), 0)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-24 pb-12 sm:px-6 sm:pt-28 sm:pb-16">
        <ToolHeader
          title="PDF & Image Merger"
          description="Combine multiple PDF files and images (JPG, PNG, WEBP, GIF, SVG) into one seamless PDF document."
          icon={FileStack}
          iconClass="text-rose-500"
          iconWrapperClass="bg-rose-500/10 border-rose-500/20"
          categoryName="PDF Tools"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* File Upload & List Zone */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-2 border-dashed border-border transition-colors hover:border-rose-500/50">
              <CardContent className="p-0">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center py-12 px-6 text-center cursor-pointer transition-colors ${
                    isDragging ? "bg-rose-500/5" : ""
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf,image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-lg bg-rose-500/10 flex items-center justify-center mb-3 text-rose-500 border border-rose-500/20">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1">
                    Drag & Drop PDF or Image files here
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mb-3">
                    or click to browse files from your computer (PDFs, JPG, PNG, WEBP, GIF)
                  </p>
                  <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
                    <Plus className="w-4 h-4" /> Add PDFs & Images
                  </Button>
                </div>
              </CardContent>
            </Card>

            {items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Files to Merge ({items.length})
                  </span>
                  <button
                    onClick={clearAll}
                    className="text-xs font-semibold text-rose-500 hover:underline"
                  >
                    Clear List
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStartItem(e, index)}
                      onDragOver={(e) => handleDragOverItem(e, index)}
                      onDrop={(e) => handleDropItem(e, index)}
                      className={`flex items-center justify-between p-3.5 rounded-md border bg-card transition-all shadow-xs ${
                        dragOverIndex === index
                          ? "border-rose-500 bg-rose-500/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
                        
                        <div
                          className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border ${
                            item.isImage
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          }`}
                        >
                          {item.isImage ? (
                            <FileImage className="w-5 h-5" />
                          ) : (
                            <FileText className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {item.file.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            <span>{formatBytes(item.file.size)}</span>
                            <span>&bull;</span>
                            {item.loading ? (
                              <span className="flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin text-rose-500" /> Reading...
                              </span>
                            ) : item.error ? (
                              <span className="text-rose-500">{item.error}</span>
                            ) : (
                              <span className="font-semibold text-foreground">
                                {item.isImage ? "Image Page" : `${item.pageCount} ${item.pageCount === 1 ? "page" : "pages"}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveItem(index, "up")}
                          disabled={index === 0}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveItem(index, "down")}
                          disabled={index === items.length - 1}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Merge Options & Action Panel */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="rounded-md border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  <span>Merge Summary</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Review document details before compiling.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-xs">
                <div className="space-y-2 p-3 rounded bg-muted/40 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Files:</span>
                    <span className="font-bold text-foreground">{items.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Output Pages:</span>
                    <span className="font-bold text-foreground">{totalPagesCount}</span>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {mergeSuccess && mergedUrl ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Files Merged Successfully!</span>
                    </div>
                    <Button
                      onClick={downloadFile}
                      className="w-full h-10 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Merged PDF</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={mergePDFs}
                    disabled={items.length < 2 || isMerging}
                    className="w-full h-10 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isMerging ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Merging Files...</span>
                      </>
                    ) : (
                      <>
                        <FileStack className="w-4 h-4" />
                        <span>Merge PDF & Image Files</span>
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
