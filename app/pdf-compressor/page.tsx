"use client"

import { useState, useRef, ChangeEvent, DragEvent } from "react"
import {
  FileText,
  Upload,
  Download,
  Loader2,
  AlertCircle,
  Check,
  Minimize2,
  TrendingDown,
  RotateCcw,
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
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ToolHeader } from "@/components/tool-header"

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

interface CompressionResult {
  url: string
  filename: string
  originalSize: number
  compressedSize: number
  savedBytes: number
  savedPercent: number
}

export default function PDFCompressor() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [isLoadingPdf, setIsLoadingPdf] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Options
  const [stripMetadata, setStripMetadata] = useState(true)

  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<CompressionResult | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid PDF file.")
      return
    }

    setFile(selectedFile)
    setIsLoadingPdf(true)
    setErrorMessage(null)
    setResult(null)

    try {
      const arrayBuffer = await selectedFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
      setPageCount(pdfDoc.getPageCount())
    } catch (err) {
      console.error("Failed to parse PDF:", err)
      setErrorMessage("Failed to parse PDF file. It may be password protected or corrupted.")
      setFile(null)
      setPageCount(null)
    } finally {
      setIsLoadingPdf(false)
    }
  }

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0])
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleCompress = async () => {
    if (!file) return

    setIsProcessing(true)
    setErrorMessage(null)
    setResult(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })

      if (stripMetadata) {
        pdfDoc.setTitle("")
        pdfDoc.setAuthor("")
        pdfDoc.setSubject("")
        pdfDoc.setKeywords([])
        pdfDoc.setProducer("")
        pdfDoc.setCreator("")
      }

      // Save with object streams enabled for structural compression
      const pdfBytes = await pdfDoc.save({ useObjectStreams: true })
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)

      const originalSize = file.size
      const compressedSize = pdfBytes.length
      const savedBytes = Math.max(0, originalSize - compressedSize)
      const savedPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0

      const baseName = file.name.replace(/\.pdf$/i, "")
      setResult({
        url,
        filename: `${baseName}_compressed.pdf`,
        originalSize,
        compressedSize,
        savedBytes,
        savedPercent,
      })
    } catch (err) {
      console.error("Compression failed:", err)
      setErrorMessage("An error occurred while compressing the PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetFile = () => {
    setFile(null)
    setPageCount(null)
    setResult(null)
    setErrorMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 pt-24 pb-12 sm:pt-28 sm:pb-16">
        <ToolHeader
          title="PDF Compressor"
          description="Optimize object streams and structure to reduce PDF file size for fast sharing or storage."
          icon={Minimize2}
          iconClass="text-emerald-500"
          iconWrapperClass="bg-emerald-500/10 border-emerald-500/20"
          categoryName="PDF Tools"
        />

        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle className="text-xl flex items-center justify-between">
              <span>Select Document</span>
              {file && (
                <Button variant="ghost" size="sm" onClick={resetFile} className="text-muted-foreground hover:text-foreground">
                  <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              Upload the PDF document you want to optimize and compress.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileInputChange}
                  accept="application/pdf"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Click to upload or drag & drop</h3>
                <p className="text-sm text-muted-foreground">Select a PDF file to compress</p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl border bg-card/50">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-teal-500/10 text-teal-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm leading-none mb-1">{file.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatBytes(file.size)}</span>
                      <span>•</span>
                      {isLoadingPdf ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Reading pages...
                        </span>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {pageCount} {pageCount === 1 ? "page" : "pages"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {file && pageCount && pageCount > 0 && (
              <div className="space-y-6 pt-2 border-t">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Compression Settings</Label>
                  <label className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={stripMetadata}
                      onChange={(e) => setStripMetadata(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <div className="text-sm">
                      <span className="font-medium block">Remove Metadata & Author details</span>
                      <span className="text-xs text-muted-foreground">
                        Strips document title, creator, and producer details for privacy and extra space savings.
                      </span>
                    </div>
                  </label>
                </div>

                <Button
                  onClick={handleCompress}
                  disabled={isProcessing}
                  className="w-full h-11 text-base font-medium bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Optimizing PDF...
                    </>
                  ) : (
                    <>
                      <Minimize2 className="w-5 h-5 mr-2" /> Compress PDF
                    </>
                  )}
                </Button>
              </div>
            )}

            {result && (
              <div className="p-5 rounded-xl border bg-teal-500/10 border-teal-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold">
                    <Check className="w-5 h-5" /> PDF Compressed Successfully!
                  </div>
                  {result.savedPercent > 0 && (
                    <Badge className="bg-teal-600 text-white gap-1 px-2.5 py-1">
                      <TrendingDown className="w-3.5 h-3.5" /> {result.savedPercent}% Smaller
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-background/60 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Original Size</span>
                    <span className="font-semibold">{formatBytes(result.originalSize)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Compressed Size</span>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">{formatBytes(result.compressedSize)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-medium truncate mr-2">{result.filename}</span>
                  <a href={result.url} download={result.filename}>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 shrink-0">
                      <Download className="w-4 h-4" /> Download PDF
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
