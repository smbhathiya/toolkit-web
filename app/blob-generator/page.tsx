"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  Info,
  Grid,
  Eye,
  Settings,
  Paintbrush
} from "lucide-react"
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

interface Point {
  x: number
  y: number
}

// Generate circular randomized point layout
function generateRandomPoints(numPoints: number, randomness: number, baseRadius: number): Point[] {
  const points: Point[] = []
  const centerX = 250
  const centerY = 250

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI
    
    // Offset scales between (1 - randomness/100) and (1 + randomness/100)
    const minScale = 1 - randomness / 100
    const maxScale = 1 + randomness / 100
    const scale = minScale + Math.random() * (maxScale - minScale)
    
    const r = baseRadius * scale
    const x = centerX + r * Math.cos(angle)
    const y = centerY + r * Math.sin(angle)
    
    points.push({ x: Math.round(x), y: Math.round(y) })
  }

  return points
}

// Create organic closed path using quadratic bezier curves
function getBlobPath(points: Point[]): string {
  const len = points.length
  if (len < 3) return ""

  let path = ""
  for (let i = 0; i < len; i++) {
    const p1 = points[i]
    const p2 = points[(i + 1) % len]

    const xc = (p1.x + p2.x) / 2
    const yc = (p1.y + p2.y) / 2

    if (i === 0) {
      path += `M ${xc} ${yc}`
    } else {
      path += ` Q ${p1.x} ${p1.y}, ${xc} ${yc}`
    }
  }

  // Close spline loop
  const pFirst = points[0]
  const pLast = points[len - 1]
  const xcLast = (pLast.x + pFirst.x) / 2
  const ycLast = (pLast.y + pFirst.y) / 2
  path += ` Q ${pFirst.x} ${pFirst.y}, ${xcLast} ${ycLast} Z`

  return path
}

export default function SVGBlobGenerator() {
  const [numPoints, setNumPoints] = useState(6)
  const [randomness, setRandomness] = useState(40)
  const [baseRadius, setBaseRadius] = useState(150)
  const [points, setPoints] = useState<Point[]>(() => generateRandomPoints(6, 40, 150))

  // Styling States
  const [fillMode, setFillMode] = useState<"solid" | "gradient" | "outline">("gradient")
  const [color1, setColor1] = useState("#8B5CF6") // Purple-500
  const [color2, setColor2] = useState("#EC4899") // Pink-500
  const [gradientAngle, setGradientAngle] = useState(135)
  const [strokeWidth, setStrokeWidth] = useState(3)
  
  // Viewer Options
  const [showGrid, setShowGrid] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedPath, setCopiedPath] = useState(false)

  // Trigger random points update
  const handleRegenerate = useCallback(() => {
    setPoints(generateRandomPoints(numPoints, randomness, baseRadius))
  }, [numPoints, randomness, baseRadius])

  // Keypress event for Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault()
        handleRegenerate()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleRegenerate])

  const pathData = getBlobPath(points)

  // Construct standard SVG string for copy/download
  const getFullSvgString = (): string => {
    let fillAttr = `fill="${color1}"`
    let defsBlock = ""

    if (fillMode === "gradient") {
      const angleRad = (gradientAngle * Math.PI) / 180
      const x1 = Math.round(50 - Math.cos(angleRad) * 50)
      const y1 = Math.round(50 - Math.sin(angleRad) * 50)
      const x2 = Math.round(50 + Math.cos(angleRad) * 50)
      const y2 = Math.round(50 + Math.sin(angleRad) * 50)

      defsBlock = `
  <defs>
    <linearGradient id="blobGrad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
      <stop offset="0%" stop-color="${color1}" />
      <stop offset="100%" stop-color="${color2}" />
    </linearGradient>
  </defs>`
      fillAttr = 'fill="url(#blobGrad)"'
    } else if (fillMode === "outline") {
      fillAttr = `fill="none" stroke="${color1}" stroke-width="${strokeWidth}" stroke-linecap="round"`
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">${defsBlock}
  <path d="${pathData}" ${fillAttr} />
</svg>`
  }

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(getFullSvgString())
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 1500)
  }

  const handleCopyPath = async () => {
    await navigator.clipboard.writeText(pathData)
    setCopiedPath(true)
    setTimeout(() => setCopiedPath(false), 1500)
  }

  const handleDownloadSvg = () => {
    const svgStr = getFullSvgString()
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "organic_blob.svg"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Transparent raster conversion using temporary HTML Image elements
  const handleDownloadPng = () => {
    const svgStr = getFullSvgString()
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = 1000 // High-res output
      canvas.height = 1000
      const ctx = canvas.getContext("2d")
      
      if (ctx) {
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, 1000, 1000)
        
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) return
          const pngUrl = URL.createObjectURL(pngBlob)
          const link = document.createElement("a")
          link.href = pngUrl
          link.download = "organic_blob.png"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(pngUrl)
        }, "image/png")
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-24 pb-10 sm:px-6 sm:pt-28 sm:pb-14">
        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              SVG Blob Generator
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Generate organic, smooth vectors and shapes. Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] border border-border/80 font-mono shadow-xs font-bold">Spacebar</kbd> to morph.
            </p>
          </div>
        </div>

        {/* Dashboard Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Styling & Structure Controls (7 columns) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Structure Settings */}
            <Card className="shadow-sm">
              <CardHeader className="py-4 flex flex-row items-center gap-2 space-y-0 border-b border-border/60">
                <Settings className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                <div>
                  <CardTitle className="text-sm font-semibold">Shape Structure</CardTitle>
                  <CardDescription className="text-xs">Adjust coordinates and points counts</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                
                {/* Points count (Complexity) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <label>Vertices / Complexity</label>
                    <span className="bg-muted px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                      {numPoints} Edges
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={12}
                    value={numPoints}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setNumPoints(val)
                      setPoints(generateRandomPoints(val, randomness, baseRadius))
                    }}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                {/* Randomness */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <label>Contrast / Randomness</label>
                    <span className="bg-muted px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                      {randomness}% Offset
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    value={randomness}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setRandomness(val)
                      setPoints(generateRandomPoints(numPoints, val, baseRadius))
                    }}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                {/* Base Size */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <label>Scale / Size</label>
                    <span className="bg-muted px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                      {baseRadius}px Radius
                    </span>
                  </div>
                  <input
                    type="range"
                    min={80}
                    max={200}
                    value={baseRadius}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setBaseRadius(val)
                      setPoints(generateRandomPoints(numPoints, randomness, val))
                    }}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Styling Settings */}
            <Card className="shadow-sm">
              <CardHeader className="py-4 flex flex-row items-center gap-2 space-y-0 border-b border-border/60">
                <Paintbrush className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                <div>
                  <CardTitle className="text-sm font-semibold">Visual Styling</CardTitle>
                  <CardDescription className="text-xs">Configure coloring and layouts</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                
                {/* Fill Mode selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground block">Fill Type</Label>
                  <div className="grid grid-cols-3 gap-2 bg-muted p-1 rounded-lg">
                    {(["solid", "gradient", "outline"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setFillMode(mode)}
                        className={`py-1.5 text-xs font-semibold rounded-md capitalize transition-all cursor-pointer ${
                          fillMode === mode
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors Selectors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Primary Color</Label>
                    <div className="flex items-center gap-2 border rounded-lg p-2 bg-muted/20">
                      <input
                        type="color"
                        value={color1}
                        onChange={(e) => setColor1(e.target.value)}
                        className="w-8 h-8 rounded border-none cursor-pointer bg-transparent shrink-0"
                      />
                      <input
                        type="text"
                        maxLength={7}
                        value={color1}
                        onChange={(e) => setColor1(e.target.value)}
                        className="w-full bg-transparent font-mono text-xs font-bold focus:outline-none uppercase"
                      />
                    </div>
                  </div>

                  {fillMode === "gradient" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">Gradient Stop Color</Label>
                      <div className="flex items-center gap-2 border rounded-lg p-2 bg-muted/20">
                        <input
                          type="color"
                          value={color2}
                          onChange={(e) => setColor2(e.target.value)}
                          className="w-8 h-8 rounded border-none cursor-pointer bg-transparent shrink-0"
                        />
                        <input
                          type="text"
                          maxLength={7}
                          value={color2}
                          onChange={(e) => setColor2(e.target.value)}
                          className="w-full bg-transparent font-mono text-xs font-bold focus:outline-none uppercase"
                        />
                      </div>
                    </div>
                  )}

                  {fillMode === "outline" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">Outline Width</Label>
                      <div className="flex items-center gap-3 h-12">
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={strokeWidth}
                          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <span className="text-xs font-bold text-foreground font-mono shrink-0 pr-1">{strokeWidth}px</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gradient angle slider */}
                {fillMode === "gradient" && (
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                      <label>Gradient Angle</label>
                      <span className="bg-muted px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                        {gradientAngle}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={gradientAngle}
                      onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                onClick={handleCopyCode}
                className="h-10 text-xs font-semibold gap-1.5 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white"
              >
                {copiedCode ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? "Copied" : "Copy SVG Code"}
              </Button>
              <Button
                onClick={handleCopyPath}
                variant="outline"
                className="h-10 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                {copiedPath ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copiedPath ? "Copied" : "Copy Path Data"}
              </Button>
              <Button
                onClick={handleDownloadSvg}
                variant="outline"
                className="h-10 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download SVG
              </Button>
              <Button
                onClick={handleDownloadPng}
                variant="outline"
                className="h-10 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download PNG
              </Button>
            </div>
          </div>

          {/* RIGHT: Live Preview Board (5 columns) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Eye className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                  <CardTitle className="text-sm font-semibold">Live Preview</CardTitle>
                </div>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    showGrid
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  title="Toggle Transparency Checkerboard"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center justify-center space-y-6">
                
                {/* SVG Render Container */}
                <div
                  style={{
                    backgroundImage: showGrid
                      ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 8 8'%3E%3Crect width='4' height='4' fill='%238882'/%3E%3Crect x='4' y='4' width='4' height='4' fill='%238882'/%3E%3C/svg%3E\")"
                      : "none",
                    backgroundSize: "16px 16px"
                  }}
                  className="w-full aspect-square max-w-sm rounded-xl border border-border/80 flex items-center justify-center overflow-hidden bg-muted/15 relative"
                >
                  {/* Embedded SVG block */}
                  <svg
                    id="blob-svg"
                    viewBox="0 0 500 500"
                    className="w-full h-full p-4 drop-shadow-md select-none transition-all duration-300"
                  >
                    {fillMode === "gradient" && (
                      <defs>
                        <linearGradient
                          id="previewBlobGrad"
                          x1={`${Math.round(50 - Math.cos((gradientAngle * Math.PI) / 180) * 50)}%`}
                          y1={`${Math.round(50 - Math.sin((gradientAngle * Math.PI) / 180) * 50)}%`}
                          x2={`${Math.round(50 + Math.cos((gradientAngle * Math.PI) / 180) * 50)}%`}
                          y2={`${Math.round(50 + Math.sin((gradientAngle * Math.PI) / 180) * 50)}%`}
                        >
                          <stop offset="0%" stopColor={color1} />
                          <stop offset="100%" stopColor={color2} />
                        </linearGradient>
                      </defs>
                    )}
                    <path
                      d={pathData}
                      fill={fillMode === "gradient" ? "url(#previewBlobGrad)" : fillMode === "outline" ? "none" : color1}
                      stroke={fillMode === "outline" ? color1 : "none"}
                      strokeWidth={fillMode === "outline" ? strokeWidth : 0}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <Button
                  onClick={handleRegenerate}
                  className="w-full h-11 text-xs font-bold gap-1.5 cursor-pointer text-white bg-purple-600 hover:bg-purple-700"
                >
                  <RefreshCw className="w-4 h-4" /> Morph Blob Shape
                </Button>
                
                <div className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground/60" />
                  <span>Use custom vertices and offsets to design unique shapes. Click Morph or press Spacebar to randomly recreate.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
