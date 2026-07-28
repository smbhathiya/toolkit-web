"use client"

import { useState, useRef, useEffect, ChangeEvent, DragEvent, useCallback } from "react"
import {
  Upload,
  Download,
  Copy,
  Check,
  Code,
  Smartphone,
  Globe,
  Loader2,
  FileArchive,
  Eye,
  Type,
  Smile,
  ImageIcon,
} from "lucide-react"
import JSZip from "jszip"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ToolHeader } from "@/components/tool-header"

type GeneratorMode = "image" | "text" | "emoji"
type ShapeType = "rounded" | "circle" | "square"

interface FaviconSize {
  name: string
  width: number
  height: number
  filename: string
  dataUrl?: string
  blob?: Blob
}

const FAVICON_SIZES: Omit<FaviconSize, "dataUrl" | "blob">[] = [
  { name: "Favicon 16x16", width: 16, height: 16, filename: "favicon-16x16.png" },
  { name: "Favicon 32x32", width: 32, height: 32, filename: "favicon-32x32.png" },
  { name: "Apple Touch Icon", width: 180, height: 180, filename: "apple-touch-icon.png" },
  { name: "Android Chrome 192", width: 192, height: 192, filename: "android-chrome-192x192.png" },
  { name: "Android Chrome 512", width: 512, height: 512, filename: "android-chrome-512x512.png" },
]

export default function FaviconGenerator() {
  const [mode, setMode] = useState<GeneratorMode>("image")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)

  // Text Mode Options
  const [textVal, setTextVal] = useState("OT")
  const [fontSize, setFontSize] = useState(65)
  const [fontColor, setFontColor] = useState("#FFFFFF")
  const [bgColor, setBgColor] = useState("#E11D48")
  const [shape, setShape] = useState<ShapeType>("rounded")

  // Emoji Mode Options
  const [emojiVal, setEmojiVal] = useState("⚡")

  // Web Manifest Metadata
  const [appName, setAppName] = useState("My Web App")
  const [shortName, setShortName] = useState("WebApp")
  const [themeColor, setThemeColor] = useState("#E11D48")

  // Generated Favicons State
  const [generatedSizes, setGeneratedSizes] = useState<FaviconSize[]>([])
  const [icoBlob, setIcoBlob] = useState<Blob | null>(null)
  const [isZipping, setIsZipping] = useState(false)
  const [copiedHtml, setCopiedHtml] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const drawMasterCanvas = useCallback((): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext("2d")
      if (!ctx) return resolve(canvas)

      ctx.clearRect(0, 0, 512, 512)

      if (mode === "image" && uploadedImageUrl) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 512, 512)
          resolve(canvas)
        }
        img.onerror = () => resolve(canvas)
        img.src = uploadedImageUrl
      } else {
        // Draw background shape for Text or Emoji
        const r = shape === "circle" ? 256 : shape === "rounded" ? 96 : 0

        ctx.fillStyle = bgColor
        ctx.beginPath()
        if (shape === "circle") {
          ctx.arc(256, 256, 256, 0, Math.PI * 2)
        } else if (shape === "rounded") {
          ctx.roundRect(0, 0, 512, 512, r)
        } else {
          ctx.rect(0, 0, 512, 512)
        }
        ctx.fill()

        // Draw Text or Emoji
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        if (mode === "text") {
          ctx.fillStyle = fontColor
          const calculatedFontSize = Math.round((fontSize / 100) * 320)
          ctx.font = `bold ${calculatedFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
          ctx.fillText(textVal.substring(0, 3), 256, 266)
        } else if (mode === "emoji") {
          ctx.font = `320px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
          ctx.fillText(emojiVal || "⚡", 256, 276)
        }

        resolve(canvas)
      }
    })
  }, [bgColor, emojiVal, fontColor, fontSize, mode, shape, textVal, uploadedImageUrl])

  useEffect(() => {
    let isCancelled = false

    async function generate() {
      try {
        const master = await drawMasterCanvas()
        if (isCancelled) return

        const results: FaviconSize[] = []

        for (const sizeSpec of FAVICON_SIZES) {
          const c = document.createElement("canvas")
          c.width = sizeSpec.width
          c.height = sizeSpec.height
          const ctx = c.getContext("2d")
          if (ctx) {
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = "high"
            ctx.drawImage(master, 0, 0, sizeSpec.width, sizeSpec.height)

            const blob = await new Promise<Blob>((res) =>
              c.toBlob((b) => res(b || new Blob()), "image/png")
            )
            const dataUrl = c.toDataURL("image/png")

            results.push({
              ...sizeSpec,
              dataUrl,
              blob,
            })
          }
        }

        if (isCancelled) return

        // Generate multi-resolution PNG for favicon.ico
        const icoCanvas = document.createElement("canvas")
        icoCanvas.width = 32
        icoCanvas.height = 32
        const icoCtx = icoCanvas.getContext("2d")
        if (icoCtx) {
          icoCtx.drawImage(master, 0, 0, 32, 32)
          icoCanvas.toBlob((b) => {
            if (b && !isCancelled) setIcoBlob(b)
          }, "image/png")
        }

        setGeneratedSizes(results)
      } catch (err) {
        console.error("Favicon generation failed:", err)
      }
    }

    generate()

    return () => {
      isCancelled = true
    }
  }, [drawMasterCanvas])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadedFile(file)
      setUploadedImageUrl(URL.createObjectURL(file))
      setMode("image")
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setUploadedFile(file)
      setUploadedImageUrl(URL.createObjectURL(file))
      setMode("image")
    }
  }

  const generateWebManifestString = () => {
    const manifest = {
      name: appName || "My Web App",
      short_name: shortName || "WebApp",
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      theme_color: themeColor,
      background_color: "#ffffff",
      display: "standalone",
    }
    return JSON.stringify(manifest, null, 2)
  }

  const generateHtmlHeadSnippet = () => {
    return `<link className="favicon" rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="${themeColor}">`
  }

  const downloadZipPackage = async () => {
    setIsZipping(true)
    try {
      const zip = new JSZip()

      for (const item of generatedSizes) {
        if (item.blob) {
          zip.file(item.filename, item.blob)
        }
      }

      if (icoBlob) {
        zip.file("favicon.ico", icoBlob)
      }

      zip.file("site.webmanifest", generateWebManifestString())
      zip.file("README.html", `<pre>${generateHtmlHeadSnippet()}</pre>`)

      const content = await zip.generateAsync({ type: "blob" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(content)
      link.download = "favicon_package.zip"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("ZIP creation error:", err)
    } finally {
      setIsZipping(false)
    }
  }

  const copyHtmlSnippet = async () => {
    await navigator.clipboard.writeText(generateHtmlHeadSnippet())
    setCopiedHtml(true)
    setTimeout(() => setCopiedHtml(false), 2000)
  }

  const primary32DataUrl = generatedSizes.find((s) => s.width === 32)?.dataUrl
  const apple180DataUrl = generatedSizes.find((s) => s.width === 180)?.dataUrl

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-24 pb-16 sm:px-6 sm:pt-28 sm:pb-20">
        <ToolHeader
          title="Favicon & App Icon Studio"
          description="Convert images or build custom text/emoji favicons with all standard sizes, favicon.ico, site.webmanifest, and ready-to-use HTML tags."
          icon={Globe}
          iconClass="text-rose-500"
          iconWrapperClass="bg-rose-500/10 border-rose-500/20"
          categoryName="Generators"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Options & Input Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-md border border-border">
              <button
                onClick={() => setMode("image")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-bold transition-all cursor-pointer ${
                  mode === "image" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ImageIcon className="w-4 h-4 text-rose-500" />
                <span>Image Converter</span>
              </button>
              <button
                onClick={() => setMode("text")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-bold transition-all cursor-pointer ${
                  mode === "text" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Type className="w-4 h-4 text-rose-500" />
                <span>Text / Initials</span>
              </button>
              <button
                onClick={() => setMode("emoji")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-bold transition-all cursor-pointer ${
                  mode === "emoji" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Smile className="w-4 h-4 text-rose-500" />
                <span>Emoji Builder</span>
              </button>
            </div>

            {/* Mode Content */}
            {mode === "image" && (
              <Card className="rounded-md border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">Upload Source Image</CardTitle>
                  <CardDescription className="text-xs">
                    Upload PNG, JPG, WebP, or SVG logo. High-resolution 512x512px images work best.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors bg-card ${
                      isDragging ? "border-rose-500 bg-rose-500/5" : "border-border hover:border-rose-500/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.png,.jpg,.jpeg,.webp,.svg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-md bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {uploadedFile ? uploadedFile.name : "Drag & Drop logo image here"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or <span className="text-rose-500 font-semibold underline">browse file</span> (PNG, JPG, SVG, WebP)
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {mode === "text" && (
              <Card className="rounded-md border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">Text & Style Options</CardTitle>
                  <CardDescription className="text-xs">Customize font initials, background shape, and color theme.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Text / Initials (Max 3 chars)</Label>
                      <Input
                        type="text"
                        maxLength={3}
                        value={textVal}
                        onChange={(e) => setTextVal(e.target.value)}
                        className="h-9 font-bold text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Shape</Label>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          onClick={() => setShape("rounded")}
                          className={`flex-1 py-1.5 px-2 rounded border text-xs font-semibold cursor-pointer ${
                            shape === "rounded" ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400" : "border-border"
                          }`}
                        >
                          Rounded
                        </button>
                        <button
                          onClick={() => setShape("circle")}
                          className={`flex-1 py-1.5 px-2 rounded border text-xs font-semibold cursor-pointer ${
                            shape === "circle" ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400" : "border-border"
                          }`}
                        >
                          Circle
                        </button>
                        <button
                          onClick={() => setShape("square")}
                          className={`flex-1 py-1.5 px-2 rounded border text-xs font-semibold cursor-pointer ${
                            shape === "square" ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400" : "border-border"
                          }`}
                        >
                          Square
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Background Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => {
                            setBgColor(e.target.value)
                            setThemeColor(e.target.value)
                          }}
                          className="w-9 h-9 rounded cursor-pointer border border-border p-0.5"
                        />
                        <Input
                          type="text"
                          value={bgColor}
                          onChange={(e) => {
                            setBgColor(e.target.value)
                            setThemeColor(e.target.value)
                          }}
                          className="h-9 font-mono text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Text Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          className="w-9 h-9 rounded cursor-pointer border border-border p-0.5"
                        />
                        <Input
                          type="text"
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          className="h-9 font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <Label className="text-xs font-semibold">Font Size</Label>
                      <span className="font-mono font-bold">{fontSize}%</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={90}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {mode === "emoji" && (
              <Card className="rounded-md border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">Emoji Favicon Options</CardTitle>
                  <CardDescription className="text-xs">Select or type any emoji to render as a vector favicon icon.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Choose Emoji</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="text"
                        value={emojiVal}
                        onChange={(e) => setEmojiVal(e.target.value)}
                        className="h-10 text-xl font-bold w-24 text-center"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {["⚡", "🚀", "🛡️", "🎨", "🔥", "💎", "💻", "⭐", "🍀", "🎯"].map((em) => (
                          <button
                            key={em}
                            onClick={() => setEmojiVal(em)}
                            className="w-9 h-9 rounded border border-border hover:bg-muted text-base flex items-center justify-center cursor-pointer"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Shape</Label>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          onClick={() => setShape("rounded")}
                          className={`flex-1 py-1.5 px-2 rounded border text-xs font-semibold cursor-pointer ${
                            shape === "rounded" ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400" : "border-border"
                          }`}
                        >
                          Rounded
                        </button>
                        <button
                          onClick={() => setShape("circle")}
                          className={`flex-1 py-1.5 px-2 rounded border text-xs font-semibold cursor-pointer ${
                            shape === "circle" ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400" : "border-border"
                          }`}
                        >
                          Circle
                        </button>
                        <button
                          onClick={() => setShape("square")}
                          className={`flex-1 py-1.5 px-2 rounded border text-xs font-semibold cursor-pointer ${
                            shape === "square" ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400" : "border-border"
                          }`}
                        >
                          Square
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Background Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => {
                            setBgColor(e.target.value)
                            setThemeColor(e.target.value)
                          }}
                          className="w-9 h-9 rounded cursor-pointer border border-border p-0.5"
                        />
                        <Input
                          type="text"
                          value={bgColor}
                          onChange={(e) => {
                            setBgColor(e.target.value)
                            setThemeColor(e.target.value)
                          }}
                          className="h-9 font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Web Manifest Settings */}
            <Card className="rounded-md border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-rose-500" />
                  <span>site.webmanifest Settings</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure Progressive Web App (PWA) manifest properties included in the download package.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">App Name</Label>
                  <Input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Short Name</Label>
                  <Input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Generated Files Output Cards */}
            <Card className="rounded-md border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Generated Icon Files</CardTitle>
                  <CardDescription className="text-xs">Download individual PNG & ICO assets.</CardDescription>
                </div>
                <Button
                  onClick={downloadZipPackage}
                  disabled={isZipping || generatedSizes.length === 0}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 text-xs cursor-pointer"
                >
                  {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileArchive className="w-4 h-4" />}
                  <span>Download ZIP Package</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {generatedSizes.map((item) => (
                    <div
                      key={item.filename}
                      className="flex items-center justify-between p-3 rounded-md border border-border bg-card shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded border border-border bg-muted/30 flex items-center justify-center p-1 overflow-hidden shrink-0">
                          {item.dataUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={item.dataUrl} alt={item.filename} className="max-w-full max-h-full object-contain" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{item.name}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">{item.filename}</p>
                        </div>
                      </div>

                      {item.dataUrl && (
                        <a
                          href={item.dataUrl}
                          download={item.filename}
                          className="p-1.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs"
                          title={`Download ${item.filename}`}
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Realtime Previews & HTML Code Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Browser Tab Preview */}
            <Card className="rounded-md border-border overflow-hidden">
              <CardHeader className="pb-3 bg-muted/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Eye className="w-4 h-4 text-rose-500" />
                  <span>Browser Tab Mockup</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* Dark Tab Mockup */}
                <div className="rounded-t-lg bg-zinc-900 border border-zinc-800 p-2 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-md bg-zinc-800 text-zinc-100 text-xs max-w-[220px] truncate border-t border-x border-zinc-700">
                    {primary32DataUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={primary32DataUrl} alt="Favicon preview" className="w-4 h-4 shrink-0 rounded-xs" />
                    )}
                    <span className="truncate font-medium">{appName || "My Web App"}</span>
                  </div>
                </div>

                {/* Light Tab Mockup */}
                <div className="rounded-t-lg bg-slate-100 border border-slate-200 p-2 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-md bg-white text-slate-800 text-xs max-w-[220px] truncate border-t border-x border-slate-300 shadow-xs">
                    {primary32DataUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={primary32DataUrl} alt="Favicon preview" className="w-4 h-4 shrink-0 rounded-xs" />
                    )}
                    <span className="truncate font-medium">{appName || "My Web App"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* iOS & Mobile Screen Mockup */}
            <Card className="rounded-md border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-rose-500" />
                  <span>iOS Home Screen App Icon</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex items-center justify-center">
                <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 text-center space-y-2 shadow-xl">
                  <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden mx-auto shadow-md flex items-center justify-center">
                    {apple180DataUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={apple180DataUrl} alt="Apple Touch Icon" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-zinc-300 max-w-[100px] truncate mx-auto">
                    {shortName || "WebApp"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* HTML Snippet Box */}
            <Card className="rounded-md border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Code className="w-4 h-4 text-rose-500" />
                    <span>HTML &lt;head&gt; Code Snippet</span>
                  </CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyHtmlSnippet}
                  className="gap-1.5 text-xs cursor-pointer"
                >
                  {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHtml ? "Copied!" : "Copy Code"}</span>
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="p-3 rounded bg-zinc-950 text-zinc-200 text-[11px] font-mono overflow-x-auto leading-relaxed border border-zinc-800">
                  {generateHtmlHeadSnippet()}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
