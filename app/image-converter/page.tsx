"use client"

import { useState, useRef, ChangeEvent, DragEvent } from "react"
import {
  FileImage,
  Upload,
  Trash2,
  Download,
  Loader2,
  AlertCircle,
  Plus,
  Sparkles,
  X,
} from "lucide-react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ImageFormat = "png" | "jpeg" | "webp" | "bmp" | "ico"

interface FormatOption {
  id: ImageFormat
  label: string
  mime: string
  ext: string
  supportsQuality: boolean
}

const FORMAT_OPTIONS: FormatOption[] = [
  { id: "png", label: "PNG Image", mime: "image/png", ext: "png", supportsQuality: false },
  { id: "jpeg", label: "JPG / JPEG Image", mime: "image/jpeg", ext: "jpg", supportsQuality: true },
  { id: "webp", label: "WEBP Image", mime: "image/webp", ext: "webp", supportsQuality: true },
  { id: "ico", label: "ICO Icon (Favicon)", mime: "image/x-icon", ext: "ico", supportsQuality: false },
  { id: "bmp", label: "BMP Bitmap", mime: "image/bmp", ext: "bmp", supportsQuality: false },
]

const ICO_SIZES = [
  { value: 16, label: "16 x 16 px (Mini Favicon ~1KB)" },
  { value: 32, label: "32 x 32 px (Standard Favicon ~4KB)" },
  { value: 48, label: "48 x 48 px (Desktop App ~9KB)" },
  { value: 64, label: "64 x 64 px (HD Icon ~16KB)" },
  { value: 128, label: "128 x 128 px (Large Icon ~65KB)" },
  { value: 256, label: "256 x 256 px (Max HD ~260KB)" },
]

interface ImageItem {
  id: string
  file: File
  originalName: string
  originalSize: number
  originalUrl: string
  width: number
  height: number
  targetFormat: ImageFormat
  quality: number // 1-100
  icoSize: number
  convertedUrl?: string
  convertedSize?: number
  convertedName?: string
  isConverting: boolean
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

// Ultra-compact 32-bit DIB ICO Encoder for pure, standard icon files
function createRawIcoBlob(ctx: CanvasRenderingContext2D, width: number, height: number): Blob {
  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels = imageData.data

  const xorSize = width * height * 4
  const andRowBytes = Math.ceil(width / 32) * 4
  const andSize = andRowBytes * height
  const dibHeaderSize = 40
  const imageSize = dibHeaderSize + xorSize + andSize
  const fileSize = 22 + imageSize

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)
  const uint8 = new Uint8Array(buffer)

  // 1. ICO Header
  view.setUint16(0, 0, true) // Reserved
  view.setUint16(2, 1, true) // Type = ICO
  view.setUint16(4, 1, true) // 1 image

  // 2. Directory Entry
  view.setUint8(6, width >= 256 ? 0 : width)
  view.setUint8(7, height >= 256 ? 0 : height)
  view.setUint8(8, 0) // Colors
  view.setUint8(9, 0) // Reserved
  view.setUint16(10, 1, true) // Planes
  view.setUint16(12, 32, true) // BPP
  view.setUint32(14, imageSize, true) // Size of image data
  view.setUint32(18, 22, true) // Offset (22)

  // 3. BITMAPINFOHEADER (40 bytes)
  let offset = 22
  view.setUint32(offset, 40, true)
  view.setInt32(offset + 4, width, true)
  view.setInt32(offset + 8, height * 2, true) // Height * 2 for DIB ICO
  view.setUint16(offset + 12, 1, true)
  view.setUint16(offset + 14, 32, true)
  view.setUint32(offset + 16, 0, true)
  view.setUint32(offset + 20, xorSize + andSize, true)
  view.setInt32(offset + 24, 0, true)
  view.setInt32(offset + 28, 0, true)
  view.setUint32(offset + 32, 0, true)
  view.setUint32(offset + 36, 0, true)

  offset += 40

  // 4. XOR Image Data (BGRA order, stored bottom-to-top)
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4
      uint8[offset] = pixels[srcIdx + 2]     // Blue
      uint8[offset + 1] = pixels[srcIdx + 1] // Green
      uint8[offset + 2] = pixels[srcIdx]     // Red
      uint8[offset + 3] = pixels[srcIdx + 3] // Alpha
      offset += 4
    }
  }

  // 5. AND Mask (0 for full 32-bit alpha transparency)
  for (let i = 0; i < andSize; i++) {
    uint8[offset + i] = 0
  }

  return new Blob([buffer], { type: "image/x-icon" })
}

export default function ImageConverter() {
  const [items, setItems] = useState<ImageItem[]>([])
  const [globalFormat, setGlobalFormat] = useState<ImageFormat>("png")
  const [globalQuality, setGlobalQuality] = useState<number>(90)
  const [globalIcoSize, setGlobalIcoSize] = useState<number>(32)
  const [isDragging, setIsDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const convertImage = (item: ImageItem, format: ImageFormat, quality: number, icoSize: number) => {
    const opt = FORMAT_OPTIONS.find((f) => f.id === format) || FORMAT_OPTIONS[0]

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, targetFormat: format, quality, icoSize, isConverting: true, error: undefined } : i))
    )

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        let canvasWidth = img.width
        let canvasHeight = img.height

        if (opt.id === "ico") {
          canvasWidth = icoSize
          canvasHeight = icoSize
        }

        const canvas = document.createElement("canvas")
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        const ctx = canvas.getContext("2d", { willReadFrequently: true })

        if (!ctx) throw new Error("Canvas context unavailable")

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"

        if (opt.id === "jpeg" || opt.id === "bmp") {
          ctx.fillStyle = "#FFFFFF"
          ctx.fillRect(0, 0, canvasWidth, canvasHeight)
        }

        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

        const baseName = item.originalName.substring(0, item.originalName.lastIndexOf(".")) || item.originalName
        const convertedName = `${baseName}.${opt.ext}`

        // High precision native ICO encoding
        if (opt.id === "ico") {
          const finalBlob = createRawIcoBlob(ctx, canvasWidth, canvasHeight)
          const url = URL.createObjectURL(finalBlob)
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    targetFormat: format,
                    quality,
                    icoSize,
                    convertedUrl: url,
                    convertedSize: finalBlob.size,
                    convertedName,
                    isConverting: false,
                  }
                : i
            )
          )
          return
        }

        const qualityVal = opt.supportsQuality ? quality / 100 : 0.92

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setItems((prev) =>
                prev.map((i) =>
                  i.id === item.id ? { ...i, isConverting: false, error: "Conversion failed" } : i
                )
              )
              return
            }

            const url = URL.createObjectURL(blob)

            setItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      targetFormat: format,
                      quality,
                      icoSize,
                      convertedUrl: url,
                      convertedSize: blob.size,
                      convertedName,
                      isConverting: false,
                    }
                  : i
              )
            )
          },
          opt.mime,
          qualityVal
        )
      } catch (err) {
        console.error("Conversion error:", err)
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, isConverting: false, error: "Failed to process image" } : i
          )
        )
      }
    }

    img.onerror = () => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isConverting: false, error: "Could not load image file" } : i
        )
      )
    }

    img.src = item.originalUrl
  }

  const processFiles = (files: File[]) => {
    const validFiles = files.filter((f) => f.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp|gif|svg|ico|avif)$/i.test(f.name))

    if (validFiles.length === 0) {
      setErrorMessage("Please select valid image files.")
      return
    }

    setErrorMessage(null)

    const newItems: ImageItem[] = validFiles.map((file) => {
      const id = Math.random().toString(36).substring(2, 9) + Date.now()
      const url = URL.createObjectURL(file)
      return {
        id,
        file,
        originalName: file.name,
        originalSize: file.size,
        originalUrl: url,
        width: 0,
        height: 0,
        targetFormat: globalFormat,
        quality: globalQuality,
        icoSize: globalIcoSize,
        isConverting: true,
      }
    })

    setItems((prev) => [...prev, ...newItems])

    newItems.forEach((item) => {
      const img = new Image()
      img.onload = () => {
        item.width = img.width
        item.height = img.height
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, width: img.width, height: img.height } : i))
        )
        convertImage(item, globalFormat, globalQuality, globalIcoSize)
      }
      img.src = item.originalUrl
    })
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

  const handleGlobalFormatChange = (newFormat: ImageFormat) => {
    setGlobalFormat(newFormat)
    items.forEach((item) => convertImage(item, newFormat, item.quality, globalIcoSize))
  }

  const handleGlobalQualityChange = (newQuality: number) => {
    setGlobalQuality(newQuality)
    items.forEach((item) => {
      const opt = FORMAT_OPTIONS.find((f) => f.id === item.targetFormat)
      if (opt?.supportsQuality) {
        convertImage(item, item.targetFormat, newQuality, item.icoSize)
      }
    })
  }

  const handleGlobalIcoSizeChange = (newSize: number) => {
    setGlobalIcoSize(newSize)
    items.forEach((item) => {
      if (item.targetFormat === "ico") {
        convertImage(item, "ico", item.quality, newSize)
      }
    })
  }

  const handleItemFormatChange = (item: ImageItem, newFormat: ImageFormat) => {
    convertImage(item, newFormat, item.quality, globalIcoSize)
  }

  const handleItemIcoSizeChange = (item: ImageItem, newSize: number) => {
    convertImage(item, "ico", item.quality, newSize)
  }

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))
  const clearAll = () => setItems([])

  const downloadAll = () => {
    items.forEach((item, index) => {
      if (item.convertedUrl && item.convertedName) {
        setTimeout(() => {
          const a = document.createElement("a")
          a.href = item.convertedUrl!
          a.download = item.convertedName!
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }, index * 200)
      }
    })
  }

  const currentOptSupportsQuality = FORMAT_OPTIONS.find((f) => f.id === globalFormat)?.supportsQuality

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-24 pb-12 sm:px-6 sm:pt-28 sm:pb-16">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="gap-1 text-xs px-2.5 py-0.5 font-medium">
                <Sparkles className="w-3 h-3 text-primary" /> Multi-Format & Favicon Studio
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              Any Image Converter
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Convert PNG, JPG, WEBP, BMP, GIF & SVG to PNG, JPG, WEBP, BMP, or compact ICO icons.
            </p>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Images
              </Button>
              <Button variant="destructive" size="sm" onClick={clearAll} className="gap-1.5">
                <Trash2 className="w-4 h-4" /> Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
            <button onClick={() => setErrorMessage(null)} className="opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dropzone */}
        {items.length === 0 ? (
          <Card className="border-2 border-dashed border-border transition-colors hover:border-primary/50">
            <CardContent className="p-0">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center py-16 px-6 text-center cursor-pointer transition-colors ${
                  isDragging ? "bg-primary/5" : ""
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.png,.jpg,.jpeg,.webp,.bmp,.gif,.svg,.ico,.avif"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <FileImage className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Upload images to convert
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  Drag & drop images here, or click to browse. Convert to PNG, JPG, WEBP, BMP, or website favicon ICO icons.
                </p>
                <Button className="gap-2 shadow-sm">
                  <Upload className="w-4 h-4" /> Select Images
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.png,.jpg,.jpeg,.webp,.bmp,.gif,.svg,.ico,.avif"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Global Controls Bar */}
            <div className="p-4 rounded-xl bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">
                    Convert All To:
                  </span>
                  <Select value={globalFormat} onValueChange={(val) => handleGlobalFormatChange(val as ImageFormat)}>
                    <SelectTrigger className="w-[170px]">
                      <SelectValue placeholder="Select Format" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {globalFormat === "ico" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground shrink-0">
                      Icon Size:
                    </span>
                    <Select value={String(globalIcoSize)} onValueChange={(val) => handleGlobalIcoSizeChange(Number(val))}>
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Select Size" />
                      </SelectTrigger>
                      <SelectContent>
                        {ICO_SIZES.map((s) => (
                          <SelectItem key={s.value} value={String(s.value)}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {currentOptSupportsQuality && (
                  <div className="min-w-[160px]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">Quality:</span>
                      <span className="text-xs font-bold text-foreground">{globalQuality}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={globalQuality}
                      onChange={(e) => handleGlobalQualityChange(Number(e.target.value))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button onClick={downloadAll} className="gap-2 shadow-sm">
                  <Download className="w-4 h-4" /> Download All ({items.length})
                </Button>
              </div>
            </div>

            {/* Image Items */}
            <div className="space-y-3">
              {items.map((item) => {
                const sizeDiff = item.convertedSize ? item.convertedSize - item.originalSize : 0
                const percentChange = item.convertedSize
                  ? Math.round((sizeDiff / item.originalSize) * 100)
                  : 0

                return (
                  <Card key={item.id} className="overflow-hidden transition-all hover:border-border">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left Thumbnail & Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          style={{
                            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 8 8'%3E%3Crect width='4' height='4' fill='%238882'/%3E%3Crect x='4' y='4' width='4' height='4' fill='%238882'/%3E%3C/svg%3E\")",
                            backgroundSize: "16px 16px"
                          }}
                          className="w-14 h-14 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0 relative"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.originalUrl}
                            alt={item.originalName}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-foreground truncate max-w-[220px] sm:max-w-[280px]">
                            {item.originalName}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{formatBytes(item.originalSize)}</span>
                            {item.width > 0 && <span>• {item.width}x{item.height}px</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right Controls */}
                      <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                        <Select
                          value={item.targetFormat}
                          onValueChange={(val) => handleItemFormatChange(item, val as ImageFormat)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Format" />
                          </SelectTrigger>
                          <SelectContent>
                            {FORMAT_OPTIONS.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {item.targetFormat === "ico" && (
                          <Select
                            value={String(item.icoSize)}
                            onValueChange={(val) => handleItemIcoSizeChange(item, Number(val))}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Size" />
                            </SelectTrigger>
                            <SelectContent>
                              {ICO_SIZES.map((s) => (
                                <SelectItem key={s.value} value={String(s.value)}>
                                  {s.value}x{s.value}px
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {item.isConverting ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            <span>Converting...</span>
                          </div>
                        ) : item.convertedSize ? (
                          <div className="flex flex-col items-end gap-0.5 min-w-[90px]">
                            <span className="text-xs font-bold text-foreground">
                              {formatBytes(item.convertedSize)}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${
                                percentChange <= 0
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {percentChange <= 0 ? `${percentChange}%` : `+${percentChange}%`}
                            </Badge>
                          </div>
                        ) : null}

                        {item.convertedUrl && item.convertedName && (
                          <a href={item.convertedUrl} download={item.convertedName}>
                            <Button size="icon" variant="secondary" className="h-9 w-9 shrink-0">
                              <Download className="w-4 h-4" />
                            </Button>
                          </a>
                        )}

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
