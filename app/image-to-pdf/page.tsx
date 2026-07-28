"use client"

import { useState, useRef, ChangeEvent, DragEvent } from "react"
import {
  FileImage,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Loader2,
  Check,
  RotateCw,
  Sparkles,
  GripVertical,
} from "lucide-react"
import { PDFDocument, PageSizes, degrees } from "pdf-lib"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ToolHeader } from "@/components/tool-header"

interface ImageItem {
  id: string
  file: File
  previewUrl: string
  rotation: number
  width: number
  height: number
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export default function ImageToPDF() {
  const [items, setItems] = useState<ImageItem[]>([])
  const [pageSize, setPageSize] = useState<"fit" | "a4_portrait" | "a4_landscape">("fit")
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfFilename, setPdfFilename] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const processImageFiles = async (files: File[]) => {
    const validFiles = files.filter((f) => f.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(f.name))
    if (validFiles.length === 0) return

    const newItems: ImageItem[] = []

    const batchTime = Date.now()
    for (let idx = 0; idx < validFiles.length; idx++) {
      const file = validFiles[idx]
      const previewUrl = URL.createObjectURL(file)
      const img = new Image()
      img.src = previewUrl
      await new Promise((resolve) => {
        img.onload = resolve
        img.onerror = resolve
      })

      newItems.push({
        id: `img_${batchTime}_${idx}`,
        file,
        previewUrl,
        rotation: 0,
        width: img.width || 800,
        height: img.height || 600,
      })
    }

    setItems((prev) => [...prev, ...newItems])
    setSuccess(false)
    setPdfUrl(null)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFiles(Array.from(e.target.files))
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
      processImageFiles(Array.from(e.dataTransfer.files))
    }
  }

  const rotateItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    )
    setSuccess(false)
    setPdfUrl(null)
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    setSuccess(false)
    setPdfUrl(null)
  }

  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return
    const newItems = [...items]
    const [moved] = newItems.splice(index, 1)
    newItems.splice(targetIndex, 0, moved)
    setItems(newItems)
    setSuccess(false)
    setPdfUrl(null)
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
    setSuccess(false)
    setPdfUrl(null)
  }

  const convertToPngBytes = async (file: File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject("Canvas context unavailable")
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(async (blob) => {
          if (!blob) return reject("Canvas conversion failed")
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

  const generatePDF = async () => {
    if (items.length === 0) return
    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const pdfDoc = await PDFDocument.create()

      for (const item of items) {
        let embeddedImage
        const fileType = item.file.type.toLowerCase()

        if (fileType === "image/jpeg" || fileType === "image/jpg") {
          const bytes = await item.file.arrayBuffer()
          embeddedImage = await pdfDoc.embedJpg(bytes)
        } else if (fileType === "image/png") {
          const bytes = await item.file.arrayBuffer()
          embeddedImage = await pdfDoc.embedPng(bytes)
        } else {
          // Convert WEBP/GIF/BMP/SVG to PNG canvas
          const pngBytes = await convertToPngBytes(item.file)
          embeddedImage = await pdfDoc.embedPng(pngBytes)
        }

        let pageWidth = embeddedImage.width
        let pageHeight = embeddedImage.height

        if (pageSize === "a4_portrait") {
          pageWidth = PageSizes.A4[0]
          pageHeight = PageSizes.A4[1]
        } else if (pageSize === "a4_landscape") {
          pageWidth = PageSizes.A4[1]
          pageHeight = PageSizes.A4[0]
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight])

        // Scale image to fit page smoothly
        const scale = Math.min(pageWidth / embeddedImage.width, pageHeight / embeddedImage.height)
        const scaledWidth = embeddedImage.width * scale
        const scaledHeight = embeddedImage.height * scale
        const x = (pageWidth - scaledWidth) / 2
        const y = (pageHeight - scaledHeight) / 2

        page.drawImage(embeddedImage, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
          rotate: degrees(item.rotation),
        })
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)

      setPdfUrl(url)
      setPdfFilename(`images_compiled_${Date.now()}.pdf`)
      setSuccess(true)
    } catch (err) {
      console.error("Image to PDF failed:", err)
      setErrorMessage("Failed to generate PDF from images. Please check if any image file is invalid.")
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadPDF = () => {
    if (!pdfUrl) return
    const link = document.createElement("a")
    link.href = pdfUrl
    link.download = pdfFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 pt-24 pb-20 sm:pt-28 sm:pb-20">
        <ToolHeader
          title="Image to PDF Converter"
          description="Convert JPG, PNG, WEBP, GIF, and BMP images into a compiled PDF document in your browser."
          icon={FileImage}
          iconClass="text-blue-500"
          iconWrapperClass="bg-blue-500/10 border-blue-500/20"
          categoryName="PDF Tools"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Dropzone & List */}
          <div className="lg:col-span-8 space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 sm:p-10 text-center cursor-pointer transition-colors bg-card ${
                isDragging ? "border-blue-500 bg-blue-500/5" : "border-border hover:border-blue-500/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3 border border-blue-500/20">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-foreground">Drag & Drop images here</p>
              <p className="text-xs text-muted-foreground mt-1">
                or <span className="text-blue-500 font-semibold underline">browse files</span> (JPG, PNG, WEBP, GIF, BMP)
              </p>
            </div>

            {items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Selected Images ({items.length})
                  </span>
                  <button
                    onClick={() => setItems([])}
                    className="text-xs font-medium text-rose-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStartItem(e, idx)}
                      onDragOver={(e) => handleDragOverItem(e, idx)}
                      onDrop={(e) => handleDropItem(e, idx)}
                      className={`flex items-center gap-3 p-3 rounded-lg border bg-card shadow-xs transition-all ${
                        dragOverIndex === idx ? "border-blue-500 bg-blue-500/5" : "border-border"
                      }`}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
                      
                      {/* Image Thumbnail */}
                      <div className="relative w-14 h-14 rounded border border-border overflow-hidden bg-muted/40 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          style={{ transform: `rotate(${item.rotation}deg)` }}
                          className="w-full h-full object-cover transition-transform"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{item.file.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatBytes(item.file.size)} &bull; {item.width}x{item.height}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => rotateItem(item.id)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveItem(idx, "up")}
                          disabled={idx === 0}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveItem(idx, "down")}
                          disabled={idx === items.length - 1}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                          title="Remove image"
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

          {/* Options & Action Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="rounded-lg border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>PDF Settings</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure output page dimensions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Page Layout & Margins</Label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as "fit" | "a4_portrait" | "a4_landscape")}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="fit">Fit to Original Image Size</option>
                    <option value="a4_portrait">A4 Portrait (210 x 297 mm)</option>
                    <option value="a4_landscape">A4 Landscape (297 x 210 mm)</option>
                  </select>
                </div>

                <div className="p-3 rounded bg-muted border border-border space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Images:</span>
                    <span className="font-bold text-foreground">{items.length}</span>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs">
                    {errorMessage}
                  </div>
                )}

                {success && pdfUrl ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>PDF Created Successfully!</span>
                    </div>
                    <Button
                      onClick={downloadPDF}
                      className="w-full h-10 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={generatePDF}
                    disabled={items.length === 0 || isProcessing}
                    className="w-full h-10 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Compiling PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileImage className="w-4 h-4" />
                        <span>Convert to PDF</span>
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
