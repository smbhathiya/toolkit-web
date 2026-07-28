"use client"

import { useState, useRef, ChangeEvent, DragEvent } from "react"
import {
  Upload,
  Trash2,
  Download,
  Loader2,
  AlertCircle,
  Check,
  Plus,
  Minimize2,
  X,
  Zap,
  Eye,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

type CompressionPreset = "smart" | "max" | "custom"

interface ImageItem {
  id: string
  file: File
  originalName: string
  originalSize: number
  originalUrl: string
  width: number
  height: number
  preset: CompressionPreset
  quality: number // 10-100
  maxWidth?: number // optional max dimension scaling
  compressedUrl?: string
  compressedSize?: number
  compressedName?: string
  isCompressing: boolean
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

export default function ImageCompressor() {
  const [items, setItems] = useState<ImageItem[]>([])
  const [globalPreset, setGlobalPreset] = useState<CompressionPreset>("smart")
  const [globalQuality, setGlobalQuality] = useState<number>(80)
  const [maxDimension, setMaxDimension] = useState<number>(0) // 0 = original
  const [targetFormat, setTargetFormat] = useState<"auto" | "webp" | "jpeg" | "png">("auto")
  const [isDragging, setIsDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Preview modal state
  const [previewItem, setPreviewItem] = useState<ImageItem | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const compressSingleImage = (
    item: ImageItem,
    preset: CompressionPreset,
    quality: number,
    maxDim: number,
    format: "auto" | "webp" | "jpeg" | "png" = targetFormat
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isCompressing: true, error: undefined } : i))
    )

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        let targetWidth = img.width
        let targetHeight = img.height

        // Apply scale down if max dimension set and image exceeds it
        if (maxDim > 0 && (img.width > maxDim || img.height > maxDim)) {
          const scale = maxDim / Math.max(img.width, img.height)
          targetWidth = Math.round(img.width * scale)
          targetHeight = Math.round(img.height * scale)
        }

        const canvas = document.createElement("canvas")
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext("2d")

        if (!ctx) throw new Error("Canvas context unavailable")

        // Smooth scaling quality
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"

        const isPng = item.file.type === "image/png" || item.originalName.toLowerCase().endsWith(".png")

        // Select optimal output MIME type
        let mimeType = item.file.type
        if (format === "webp" || (format === "auto" && (isPng || preset === "smart" || preset === "max"))) {
          mimeType = "image/webp"
        } else if (format === "jpeg") {
          mimeType = "image/jpeg"
        } else if (format === "png") {
          mimeType = "image/png"
        }

        if (mimeType === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF"
          ctx.fillRect(0, 0, targetWidth, targetHeight)
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        const effQuality = preset === "smart" ? 0.75 : preset === "max" ? 0.55 : quality / 100

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setItems((prev) =>
                prev.map((i) =>
                  i.id === item.id ? { ...i, isCompressing: false, error: "Compression failed" } : i
                )
              )
              return
            }

            let finalBlob = blob
            let finalMime = mimeType

            // Safety check: if format is auto and compressed size exceeds original, fallback to WebP or original
            if (blob.size >= item.originalSize && format === "auto" && maxDim === 0 && !isPng) {
              finalBlob = item.file
              finalMime = item.file.type
            }

            const url = URL.createObjectURL(finalBlob)
            const ext = finalMime === "image/webp" ? "webp" : finalMime === "image/jpeg" ? "jpg" : "png"
            const baseName = item.originalName.substring(0, item.originalName.lastIndexOf(".")) || item.originalName
            const compressedName = `${baseName}_min.${ext}`

            setItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      preset,
                      quality,
                      compressedUrl: url,
                      compressedSize: finalBlob.size,
                      compressedName,
                      isCompressing: false,
                    }
                  : i
              )
            )
          },
          mimeType,
          effQuality
        )
      } catch (err) {
        console.error("Compression error:", err)
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, isCompressing: false, error: "Failed to compress image" } : i
          )
        )
      }
    }

    img.onerror = () => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isCompressing: false, error: "Could not load image" } : i
        )
      )
    }

    img.src = item.originalUrl
  }

  const processFiles = (files: File[]) => {
    const validFiles = files.filter((f) => f.type.startsWith("image/"))

    if (validFiles.length === 0) {
      setErrorMessage("Please select valid image files (PNG, JPG, WEBP, etc.).")
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
        preset: globalPreset,
        quality: globalQuality,
        isCompressing: true,
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
        compressSingleImage(item, globalPreset, globalQuality, maxDimension)
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

  const handleGlobalPresetChange = (preset: CompressionPreset) => {
    setGlobalPreset(preset)
    let q = globalQuality
    if (preset === "smart") q = 80
    if (preset === "max") q = 60
    setGlobalQuality(q)
    items.forEach((item) => compressSingleImage(item, preset, q, maxDimension, targetFormat))
  }

  const handleGlobalQualityChange = (q: number) => {
    setGlobalQuality(q)
    setGlobalPreset("custom")
    items.forEach((item) => compressSingleImage(item, "custom", q, maxDimension, targetFormat))
  }

  const handleMaxDimensionChange = (dim: number) => {
    setMaxDimension(dim)
    items.forEach((item) => compressSingleImage(item, item.preset, item.quality, dim, targetFormat))
  }

  const handleTargetFormatChange = (fmt: "auto" | "webp" | "jpeg" | "png") => {
    setTargetFormat(fmt)
    items.forEach((item) => compressSingleImage(item, item.preset, item.quality, maxDimension, fmt))
  }

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))
  const clearAll = () => setItems([])

  const downloadAll = () => {
    items.forEach((item, index) => {
      if (item.compressedUrl && item.compressedName) {
        setTimeout(() => {
          const a = document.createElement("a")
          a.href = item.compressedUrl!
          a.download = item.compressedName!
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }, index * 200)
      }
    })
  }

  const totalOriginalBytes = items.reduce((acc, curr) => acc + curr.originalSize, 0)
  const totalCompressedBytes = items.reduce(
    (acc, curr) => acc + (curr.compressedSize || curr.originalSize),
    0
  )
  const totalSavedBytes = Math.max(0, totalOriginalBytes - totalCompressedBytes)
  const totalSavedPercent = totalOriginalBytes > 0 ? Math.round((totalSavedBytes / totalOriginalBytes) * 100) : 0

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-24 pb-12 sm:px-6 sm:pt-28 sm:pb-16">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="gap-1 text-xs px-2.5 py-0.5 font-medium">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Smart Compressor
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              Image Size Reducer
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Reduce image file sizes by up to 80% without noticeable visual quality loss.
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

        {/* Dropzone if empty */}
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
                  accept="image/*,.png,.jpg,.jpeg,.webp,.bmp"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
                  <Minimize2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Upload images to reduce file size
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  Drag & drop PNG, JPG, or WEBP images here. Intelligent compression lowers file size while preserving sharp image details.
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
              accept="image/*,.png,.jpg,.jpeg,.webp,.bmp"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Total Savings Summary Banner */}
            <Card className="border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20">
              <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base">
                      Total Space Saved: {formatBytes(totalSavedBytes)} ({totalSavedPercent}%)
                    </h4>
                    <p className="text-xs opacity-80">
                      Original: {formatBytes(totalOriginalBytes)} ➔ Reduced: {formatBytes(totalCompressedBytes)}
                    </p>
                  </div>
                </div>

                <Button onClick={downloadAll} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                  <Download className="w-4 h-4" /> Download All Reduced Images
                </Button>
              </CardContent>
            </Card>

            {/* Global Controls */}
            <div className="p-4 rounded-xl bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Compression Mode:
                  </span>
                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
                    <button
                      onClick={() => handleGlobalPresetChange("smart")}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        globalPreset === "smart"
                          ? "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Smart (Balanced)
                    </button>
                    <button
                      onClick={() => handleGlobalPresetChange("max")}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        globalPreset === "max"
                          ? "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Max Compression
                    </button>
                  </div>
                </div>

                <div className="min-w-[160px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">Quality Level:</span>
                    <span className="text-xs font-bold text-foreground">{globalQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="95"
                    value={globalQuality}
                    onChange={(e) => handleGlobalQualityChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {/* Resolution & Format selectors */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">Output Format:</span>
                  <select
                    value={targetFormat}
                    onChange={(e) => handleTargetFormatChange(e.target.value as "auto" | "webp" | "jpeg" | "png")}
                    className="text-xs font-semibold bg-muted/60 text-foreground border border-border rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none"
                  >
                    <option value="auto">Auto / WebP (Best Compression)</option>
                    <option value="webp">WebP (High Quality & Small)</option>
                    <option value="jpeg">JPEG (Universal Compatibility)</option>
                    <option value="png">PNG (Original Format)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">Max Res:</span>
                  <select
                    value={maxDimension}
                    onChange={(e) => handleMaxDimensionChange(Number(e.target.value))}
                    className="text-xs font-semibold bg-muted/60 text-foreground border border-border rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none"
                  >
                    <option value={0}>Original Resolution</option>
                    <option value={2048}>Max 2K (2048px)</option>
                    <option value={1920}>Max Full HD (1920px)</option>
                    <option value={1280}>Max HD (1280px)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              {items.map((item) => {
                const savedBytes = item.compressedSize ? Math.max(0, item.originalSize - item.compressedSize) : 0
                const percentSaved = item.compressedSize ? Math.round((savedBytes / item.originalSize) * 100) : 0

                return (
                  <Card key={item.id} className="overflow-hidden transition-all hover:border-border">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left thumbnail */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0 relative">
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

                      {/* Right stats & actions */}
                      <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                        {item.isCompressing ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-4">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            <span>Reducing...</span>
                          </div>
                        ) : item.compressedSize ? (
                          <div className="flex flex-col items-end gap-0.5 min-w-[110px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground line-through">
                                {formatBytes(item.originalSize)}
                              </span>
                              <span className="text-xs font-bold text-foreground">
                                {formatBytes(item.compressedSize)}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold"
                            >
                              -{percentSaved}% saved
                            </Badge>
                          </div>
                        ) : null}

                        {item.compressedUrl && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => setPreviewItem(item)}
                              className="h-9 w-9 shrink-0"
                              title="Compare Before & After"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <a href={item.compressedUrl} download={item.compressedName}>
                              <Button size="icon" className="h-9 w-9 shrink-0">
                                <Download className="w-4 h-4" />
                              </Button>
                            </a>
                          </div>
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

      {/* Comparison Modal */}
      {previewItem && previewItem.compressedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative max-w-4xl w-full bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-semibold text-base">Visual Quality Comparison</h3>
                <p className="text-xs text-muted-foreground">{previewItem.originalName}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setPreviewItem(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 p-6 overflow-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Original Image</span>
                  <Badge variant="outline">{formatBytes(previewItem.originalSize)}</Badge>
                </div>
                <div className="aspect-video rounded-xl border border-border bg-background flex items-center justify-center p-2 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewItem.originalUrl} alt="Original" className="max-h-full max-w-full object-contain" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400">Reduced Image</span>
                  <Badge className="bg-emerald-600 text-white">{formatBytes(previewItem.compressedSize!)}</Badge>
                </div>
                <div className="aspect-video rounded-xl border border-emerald-500/40 bg-background flex items-center justify-center p-2 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewItem.compressedUrl} alt="Reduced" className="max-h-full max-w-full object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
