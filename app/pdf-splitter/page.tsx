"use client"

import { useState, useRef, ChangeEvent, DragEvent } from "react"
import {
  FileText,
  Upload,
  Download,
  Loader2,
  AlertCircle,
  Check,
  Scissors,
  Layers,
  FileCode,
  RotateCcw,
  Eye,
  CheckSquare,
  Square,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ToolHeader } from "@/components/tool-header"

interface SplitFileResult {
  filename: string
  url: string
  pageRange: string
  size: number
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  const pagesSet = new Set<number>()
  const parts = rangeStr.split(",").map((p) => p.trim())

  for (const part of parts) {
    if (!part) continue
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim())
      const start = parseInt(startStr, 10)
      const end = parseInt(endStr, 10)
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end))
        const max = Math.min(totalPages, Math.max(start, end))
        for (let i = min; i <= max; i++) {
          pagesSet.add(i)
        }
      }
    } else {
      const pageNum = parseInt(part, 10)
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pagesSet.add(pageNum)
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b)
}

function formatPagesToRangeStr(selectedPages: number[]): string {
  if (selectedPages.length === 0) return ""
  const sorted = [...selectedPages].sort((a, b) => a - b)
  const ranges: string[] = []
  let start = sorted[0]
  let prev = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i]
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`)
      start = sorted[i]
      prev = sorted[i]
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`)
  return ranges.join(", ")
}

export default function PDFSplitter() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [isLoadingPdf, setIsLoadingPdf] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  const [splitMode, setSplitMode] = useState<"range" | "all">("range")
  const [rangeInput, setRangeInput] = useState<string>("")
  const [selectedPages, setSelectedPages] = useState<number[]>([])
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [results, setResults] = useState<SplitFileResult[]>([])

  // Thumbnails state (data URLs)
  const [thumbnails, setThumbnails] = useState<{ [pageNum: number]: string }>({})
  const [loadingThumbnails, setLoadingThumbnails] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync range input with selectedPages array
  const handleRangeInputChange = (val: string) => {
    setRangeInput(val)
    if (pageCount) {
      setSelectedPages(parsePageRanges(val, pageCount))
    }
  }

  const togglePageSelection = (pageNum: number) => {
    let updated: number[]
    if (selectedPages.includes(pageNum)) {
      updated = selectedPages.filter((p) => p !== pageNum)
    } else {
      updated = [...selectedPages, pageNum].sort((a, b) => a - b)
    }
    setSelectedPages(updated)
    setRangeInput(formatPagesToRangeStr(updated))
  }

  const selectAllPages = () => {
    if (!pageCount) return
    const all = Array.from({ length: pageCount }, (_, i) => i + 1)
    setSelectedPages(all)
    setRangeInput(formatPagesToRangeStr(all))
  }

  const deselectAllPages = () => {
    setSelectedPages([])
    setRangeInput("")
  }

  const renderPdfThumbnails = async (pdfFile: File, count: number) => {
    setLoadingThumbnails(true)
    setThumbnails({})

    try {
      // Dynamically load PDF.js from CDN if not present
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

      const arrayBuffer = await pdfFile.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
      const pdfDoc = (await loadingTask.promise) as { getPage: (num: number) => Promise<unknown> }

      const newThumbnails: { [pageNum: number]: string } = {}

      for (let i = 1; i <= Math.min(count, 50); i++) {
        const page = (await pdfDoc.getPage(i)) as {
          getViewport: (opts: { scale: number }) => { width: number; height: number }
          render: (params: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> }
        }
        const viewport = page.getViewport({ scale: 0.3 })
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")

        if (context) {
          canvas.height = viewport.height
          canvas.width = viewport.width

          await page.render({
            canvasContext: context,
            viewport,
          }).promise

          newThumbnails[i] = canvas.toDataURL("image/png")
        }
      }

      setThumbnails(newThumbnails)
    } catch (err) {
      console.warn("Could not render PDF canvas thumbnails:", err)
    } finally {
      setLoadingThumbnails(false)
    }
  }

  const handleFileChange = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid PDF file.")
      return
    }

    setFile(selectedFile)
    setIsLoadingPdf(true)
    setErrorMessage(null)
    setResults([])

    try {
      const arrayBuffer = await selectedFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
      const count = pdfDoc.getPageCount()
      setPageCount(count)

      const initialSelected = count > 1 ? Array.from({ length: Math.min(count, Math.ceil(count / 2)) }, (_, i) => i + 1) : [1]
      setSelectedPages(initialSelected)
      setRangeInput(formatPagesToRangeStr(initialSelected))

      // Trigger background canvas thumbnails generation
      renderPdfThumbnails(selectedFile, count)
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

  const handleSplit = async () => {
    if (!file || !pageCount) return

    setIsProcessing(true)
    setErrorMessage(null)
    setResults([])

    try {
      const arrayBuffer = await file.arrayBuffer()
      const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
      const baseName = file.name.replace(/\.pdf$/i, "")
      const newResults: SplitFileResult[] = []

      if (splitMode === "range") {
        const pageNumbers = parsePageRanges(rangeInput, pageCount)
        if (pageNumbers.length === 0) {
          setErrorMessage("Please select at least one page to extract.")
          setIsProcessing(false)
          return
        }

        const newPdf = await PDFDocument.create()
        const zeroBasedIndices = pageNumbers.map((p) => p - 1)
        const copiedPages = await newPdf.copyPages(srcPdf, zeroBasedIndices)
        copiedPages.forEach((page) => newPdf.addPage(page))

        const pdfBytes = await newPdf.save()
        const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)

        newResults.push({
          filename: `${baseName}_extracted.pdf`,
          url,
          pageRange: `Pages ${pageNumbers.join(", ")}`,
          size: pdfBytes.length,
        })
      } else {
        // Split all into individual 1-page PDFs
        for (let i = 0; i < pageCount; i++) {
          const newPdf = await PDFDocument.create()
          const [copiedPage] = await newPdf.copyPages(srcPdf, [i])
          newPdf.addPage(copiedPage)

          const pdfBytes = await newPdf.save()
          const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" })
          const url = URL.createObjectURL(blob)

          newResults.push({
            filename: `${baseName}_page_${i + 1}.pdf`,
            url,
            pageRange: `Page ${i + 1}`,
            size: pdfBytes.length,
          })
        }
      }

      setResults(newResults)
    } catch (err) {
      console.error("Split failed:", err)
      setErrorMessage("An error occurred while splitting the PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetFile = () => {
    setFile(null)
    setPageCount(null)
    setResults([])
    setThumbnails({})
    setErrorMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 pt-24 pb-12 sm:px-6 sm:pt-28 sm:pb-16">
        <ToolHeader
          title="PDF Splitter"
          description="Separate pages from any PDF document or extract custom page ranges client-side."
          icon={Scissors}
          iconClass="text-amber-500"
          iconWrapperClass="bg-amber-500/10 border-amber-500/20"
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
              Upload the PDF file you wish to split or extract pages from.
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
                <p className="text-sm text-muted-foreground">Select a single PDF file</p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl border bg-card/50">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
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
                  <Label className="text-base font-semibold">Split Options</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      onClick={() => setSplitMode("range")}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        splitMode === "range"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-medium mb-1">
                        <Layers className="w-4 h-4 text-primary" /> Extract Selected Pages
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Select pages visually below or specify custom ranges to extract into a single file.
                      </p>
                    </div>

                    <div
                      onClick={() => setSplitMode("all")}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        splitMode === "all"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-medium mb-1">
                        <FileCode className="w-4 h-4 text-primary" /> Split into Single Pages
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Separate every page of this PDF into its own individual document.
                      </p>
                    </div>
                  </div>
                </div>

                {splitMode === "range" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="range-input">Pages to extract</Label>
                      <Input
                        id="range-input"
                        placeholder="e.g. 1-3, 5, 8-10"
                        value={rangeInput}
                        onChange={(e) => handleRangeInputChange(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter page numbers/ranges above or click thumbnails below to toggle selection.
                      </p>
                    </div>

                    {/* Page Previews & Selection Grid */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">Page Previews</span>
                          {loadingThumbnails && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Generating previews...
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={selectAllPages} className="h-7 text-xs gap-1">
                            <CheckSquare className="w-3.5 h-3.5" /> Select All
                          </Button>
                          <Button variant="outline" size="sm" onClick={deselectAllPages} className="h-7 text-xs gap-1">
                            <Square className="w-3.5 h-3.5" /> Clear
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-80 overflow-y-auto p-2 rounded-xl border bg-muted/20">
                        {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => {
                          const isSelected = selectedPages.includes(pageNum)
                          const thumb = thumbnails[pageNum]

                          return (
                            <div
                              key={pageNum}
                              onClick={() => togglePageSelection(pageNum)}
                              className={`relative group rounded-lg border-2 p-2 cursor-pointer transition-all flex flex-col items-center justify-between ${
                                isSelected
                                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                                  : "border-border bg-card hover:border-muted-foreground/40"
                              }`}
                            >
                              {/* Selection checkbox badge */}
                              <div className="absolute top-2 right-2 z-10">
                                {isSelected ? (
                                  <div className="w-5 h-5 rounded bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded border bg-background/80 group-hover:border-primary" />
                                )}
                              </div>

                              {/* Thumbnail or Skeleton */}
                              <div className="w-full h-32 rounded bg-background flex items-center justify-center overflow-hidden mb-2 border shadow-xs">
                                {thumb ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img src={thumb} alt={`Page ${pageNum}`} className="w-full h-full object-contain" />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-muted-foreground/50 p-2 text-center">
                                    <FileText className="w-8 h-8 mb-1 opacity-50" />
                                    <span className="text-[10px]">Page {pageNum}</span>
                                  </div>
                                )}
                              </div>

                              <span className="text-xs font-medium text-muted-foreground">
                                Page {pageNum}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSplit}
                  disabled={isProcessing}
                  className="w-full h-11 text-base font-medium"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing PDF...
                    </>
                  ) : (
                    <>
                      <Scissors className="w-5 h-5 mr-2" /> Split PDF
                    </>
                  )}
                </Button>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Check className="w-5 h-5" /> Ready for download ({results.length} {results.length === 1 ? "file" : "files"})
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {results.map((res, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="text-sm font-medium truncate">{res.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {res.pageRange} • {formatBytes(res.size)}
                        </p>
                      </div>
                      <a href={res.url} download={res.filename}>
                        <Button size="sm" variant="outline" className="shrink-0 gap-1.5">
                          <Download className="w-4 h-4" /> Download
                        </Button>
                      </a>
                    </div>
                  ))}
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
