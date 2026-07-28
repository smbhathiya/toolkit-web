"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Palette,
  Copy,
  Check,
  Lock,
  Unlock,
  RefreshCw,
  Share2,
  Maximize2,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

interface HSL {
  h: number
  s: number
  l: number
}

interface ColorItem {
  hex: string
  locked: boolean
}

// Convert Hex to HSL
function hexToHsl(hex: string): HSL {
  hex = hex.replace(/^#/, "")
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("")
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

// Convert HSL to Hex
function hslToHex({ h, s, l }: HSL): string {
  s /= 100
  l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0

  if (0 <= h && h < 60) {
    r = c
    g = x
    b = 0
  } else if (60 <= h && h < 120) {
    r = x
    g = c
    b = 0
  } else if (120 <= h && h < 180) {
    r = 0
    g = c
    b = x
  } else if (180 <= h && h < 240) {
    r = 0
    g = x
    b = c
  } else if (240 <= h && h < 300) {
    r = x
    g = 0
    b = c
  } else if (300 <= h && h < 360) {
    r = c
    g = 0
    b = x
  }

  const rHex = Math.round((r + m) * 255)
    .toString(16)
    .padStart(2, "0")
  const gHex = Math.round((g + m) * 255)
    .toString(16)
    .padStart(2, "0")
  const bHex = Math.round((b + m) * 255)
    .toString(16)
    .padStart(2, "0")

  return `#${rHex}${gHex}${bHex}`.toUpperCase()
}

// Relative Luminance for WCAG Contrast
function getLuminance(hex: string): number {
  hex = hex.replace(/^#/, "")
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("")
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

// Contrast ratio
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1)
  const lum2 = getLuminance(hex2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

function adjustLightness(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  hsl.l = Math.max(5, Math.min(95, hsl.l + amount))
  return hslToHex(hsl)
}

type PaletteMode =
  | "random"
  | "monochromatic"
  | "analogous"
  | "complementary"
  | "triadic"
  | "tetradic"

export default function ColorPaletteGenerator() {
  const [colors, setColors] = useState<ColorItem[]>([
    { hex: "#3B82F6", locked: false }, // Primary Brand
    { hex: "#60A5FA", locked: false }, // Secondary Brand
    { hex: "#F59E0B", locked: false }, // Accent Brand
    { hex: "#F0F6FF", locked: false }, // Light Neutral BG
    { hex: "#1E3A8A", locked: false }, // Dark Neutral Text
  ])
  
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [mode, setMode] = useState<PaletteMode>("random")
  const [copiedExport, setCopiedExport] = useState(false)
  const [exportFormat, setExportFormat] = useState<"hex" | "css" | "tailwind" | "json">("hex")
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light")

  // Generate random base color HSL
  const randomHsl = (): HSL => ({
    h: Math.floor(Math.random() * 360),
    s: 50 + Math.floor(Math.random() * 40), // 50% - 90%
    l: 40 + Math.floor(Math.random() * 25), // 40% - 65%
  })

  // Generate Palette trigger
  const handleGenerate = useCallback(() => {
    // Find base color from first locked item, or generate random
    const firstLocked = colors.find((c) => c.locked)
    const baseHsl = firstLocked ? hexToHsl(firstLocked.hex) : randomHsl()

    // Plan target HSL for each slot (0: Primary, 1: Secondary, 2: Accent, 3: Light Neutral, 4: Dark Neutral)
    const targets: HSL[] = []

    switch (mode) {
      case "monochromatic": {
        targets.push(
          { h: baseHsl.h, s: baseHsl.s, l: baseHsl.l },                                      // Slot 0: Primary
          { h: baseHsl.h, s: Math.max(10, baseHsl.s - 15), l: Math.max(20, baseHsl.l - 15) }, // Slot 1: Secondary (Darker)
          { h: baseHsl.h, s: Math.min(100, baseHsl.s + 15), l: Math.min(85, baseHsl.l + 15) }, // Slot 2: Accent (Lighter)
          { h: baseHsl.h, s: 10, l: 96 },                                                    // Slot 3: Light Neutral
          { h: baseHsl.h, s: 15, l: 12 }                                                     // Slot 4: Dark Neutral
        )
        break
      }
      case "analogous": {
        targets.push(
          { h: baseHsl.h, s: baseHsl.s, l: baseHsl.l },                                      // Slot 0: Primary
          { h: (baseHsl.h + 30) % 360, s: baseHsl.s, l: baseHsl.l },                         // Slot 1: Secondary (+30 deg)
          { h: (baseHsl.h - 30 + 360) % 360, s: Math.min(100, baseHsl.s + 10), l: baseHsl.l }, // Slot 2: Accent (-30 deg)
          { h: baseHsl.h, s: 10, l: 96 },                                                    // Slot 3: Light Neutral
          { h: baseHsl.h, s: 15, l: 12 }                                                     // Slot 4: Dark Neutral
        )
        break
      }
      case "complementary": {
        const compH = (baseHsl.h + 180) % 360
        targets.push(
          { h: baseHsl.h, s: baseHsl.s, l: baseHsl.l },                                      // Slot 0: Primary
          { h: baseHsl.h, s: Math.max(10, baseHsl.s - 20), l: Math.max(20, baseHsl.l - 12) }, // Slot 1: Secondary (Darker variant)
          { h: compH, s: baseHsl.s, l: baseHsl.l },                                          // Slot 2: Accent (Complementary)
          { h: baseHsl.h, s: 10, l: 96 },                                                    // Slot 3: Light Neutral
          { h: baseHsl.h, s: 15, l: 12 }                                                     // Slot 4: Dark Neutral
        )
        break
      }
      case "triadic": {
        const h1 = (baseHsl.h + 120) % 360
        const h2 = (baseHsl.h + 240) % 360
        targets.push(
          { h: baseHsl.h, s: baseHsl.s, l: baseHsl.l },                                      // Slot 0: Primary
          { h: h1, s: baseHsl.s, l: baseHsl.l },                                             // Slot 1: Secondary
          { h: h2, s: Math.min(100, baseHsl.s + 10), l: baseHsl.l },                         // Slot 2: Accent
          { h: baseHsl.h, s: 10, l: 96 },                                                    // Slot 3: Light Neutral
          { h: baseHsl.h, s: 15, l: 12 }                                                     // Slot 4: Dark Neutral
        )
        break
      }
      case "tetradic": {
        const h1 = (baseHsl.h + 90) % 360
        const h2 = (baseHsl.h + 180) % 360
        const h3 = (baseHsl.h + 270) % 360
        targets.push(
          { h: baseHsl.h, s: baseHsl.s, l: baseHsl.l },                                      // Slot 0: Primary
          { h: h1, s: baseHsl.s, l: baseHsl.l },                                             // Slot 1: Secondary
          { h: h2, s: baseHsl.s, l: baseHsl.l },                                             // Slot 2: Accent
          { h: baseHsl.h, s: 10, l: 96 },                                                    // Slot 3: Light Neutral
          { h: h3, s: baseHsl.s, l: 12 }                                                     // Slot 4: Dark Neutral (using 4th hue)
        )
        break
      }
      case "random":
      default: {
        const randBase = randomHsl()
        const sideH = (randBase.h + 40) % 360
        const compH = (randBase.h + 180) % 360
        targets.push(
          { h: randBase.h, s: randBase.s, l: randBase.l },                                   // Slot 0: Primary Brand
          { h: sideH, s: Math.max(20, randBase.s - 15), l: Math.max(30, randBase.l - 10) },   // Slot 1: Secondary
          { h: compH, s: Math.min(100, randBase.s + 15), l: randBase.l },                    // Slot 2: Accent
          { h: randBase.h, s: 8, l: 96 },                                                    // Slot 3: Light Neutral
          { h: randBase.h, s: 15, l: 12 }                                                    // Slot 4: Dark Neutral
        )
        break
      }
    }

    setColors((prev) =>
      prev.map((color, idx) => {
        if (color.locked) return color
        const t = targets[idx] || randomHsl()
        return { hex: hslToHex(t), locked: false }
      })
    )
  }, [colors, mode])

  // Key event listener for Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault()
        handleGenerate()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleGenerate])

  const toggleLock = (index: number) => {
    setColors((prev) =>
      prev.map((c, idx) => (idx === index ? { ...c, locked: !c.locked } : c))
    )
  }

  const handleColorChange = (index: number, newHex: string) => {
    if (!/^#[0-9A-F]{6}$/i.test(newHex)) return
    setColors((prev) =>
      prev.map((c, idx) => (idx === index ? { ...c, hex: newHex.toUpperCase() } : c))
    )
  }

  const handleCopyColor = async (hex: string, index: number) => {
    await navigator.clipboard.writeText(hex)
    setCopiedIdx(index)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  // Color modifiers
  const modifyColor = (index: number, action: "lighten" | "darken" | "saturate" | "desaturate") => {
    setColors((prev) =>
      prev.map((color, idx) => {
        if (idx !== index) return color
        const hsl = hexToHsl(color.hex)
        switch (action) {
          case "lighten":
            hsl.l = Math.min(95, hsl.l + 5)
            break
          case "darken":
            hsl.l = Math.max(5, hsl.l - 5)
            break
          case "saturate":
            hsl.s = Math.min(100, hsl.s + 8)
            break
          case "desaturate":
            hsl.s = Math.max(0, hsl.s - 8)
            break
        }
        return { ...color, hex: hslToHex(hsl) }
      })
    )
  }

  // Export formatting
  const getExportString = (): string => {
    const hexCodes = colors.map((c) => c.hex)
    switch (exportFormat) {
      case "css":
        return `:root {
  --color-primary-lightest: ${hexCodes[4]};
  --color-primary-light: ${hexCodes[3]};
  --color-primary: ${hexCodes[0]};
  --color-primary-dark: ${hexCodes[1]};
  --color-primary-darkest: ${hexCodes[2]};
}`
      case "tailwind":
        return `colors: {
  brand: {
    50: '${hexCodes[4]}',
    100: '${hexCodes[3]}',
    500: '${hexCodes[0]}',
    600: '${hexCodes[1]}',
    900: '${hexCodes[2]}',
  }
}`
      case "json":
        return JSON.stringify(hexCodes, null, 2)
      case "hex":
      default:
        return hexCodes.join(", ")
    }
  }

  const handleCopyExport = async () => {
    await navigator.clipboard.writeText(getExportString())
    setCopiedExport(true)
    setTimeout(() => setCopiedExport(false), 1500)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-24 pb-10 sm:px-6 sm:pt-28 sm:pb-14">
        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <Palette className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Color Palette Generator
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Generate matching palettes using visual harmony algorithms. Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] border border-border/80 font-mono shadow-xs font-bold">Spacebar</kbd> to refresh.
            </p>
          </div>
        </div>

        {/* Action Controls Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 bg-muted/40 rounded-xl border border-border/60">
          {/* Harmony mode toggles */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-muted-foreground font-semibold whitespace-nowrap">Harmony:</span>
            <div className="flex rounded-md bg-muted p-0.5 gap-0.5 text-[11px] font-medium border border-border">
              {(["random", "monochromatic", "analogous", "complementary", "triadic", "tetradic"] as PaletteMode[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setMode(opt)}
                  className={`px-2.5 py-0.5 rounded capitalize cursor-pointer transition-all ${
                    mode === opt
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt === "random" ? "Vibrant" : opt}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            className="h-9 px-4 gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Generate Palette
          </Button>
        </div>

        {/* Horizontal Swatches */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
          {colors.map((color, index) => {
            const isBright = getLuminance(color.hex) > 0.45
            const contrast = getContrastRatio(color.hex, "#FFFFFF")
            const isWhiteReadable = contrast >= 4.5
            
            return (
              <Card
                key={index}
                className="overflow-hidden border border-border/80 flex flex-col h-80 relative group"
                style={{ backgroundColor: color.hex }}
              >
                {/* Visual Color block */}
                <div className="flex-1 flex flex-col justify-between p-4">
                  {/* Top Swatch Info Row */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => toggleLock(index)}
                      className={`p-2 rounded-lg cursor-pointer transition-all ${
                        isBright
                          ? "hover:bg-black/10 text-black/60 hover:text-black"
                          : "hover:bg-white/10 text-white/70 hover:text-white"
                      }`}
                      title={color.locked ? "Unlock color" : "Lock color"}
                    >
                      {color.locked ? (
                        <Lock className="w-4 h-4 shrink-0" />
                      ) : (
                        <Unlock className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleCopyColor(color.hex, index)}
                      className={`p-2 rounded-lg cursor-pointer transition-all ${
                        isBright
                          ? "hover:bg-black/10 text-black/60 hover:text-black"
                          : "hover:bg-white/10 text-white/70 hover:text-white"
                      }`}
                      title="Copy hex code"
                    >
                      {copiedIdx === index ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Middle Color Hex Output */}
                  <div className="text-center">
                    {/* Trigger hidden color input on label click */}
                    <label className="cursor-pointer">
                      <input
                        type="color"
                        value={color.hex}
                        onChange={(e) => handleColorChange(index, e.target.value)}
                        className="sr-only"
                      />
                      <span
                        className={`text-lg md:text-xl font-mono font-bold tracking-wider hover:underline transition-all block ${
                          isBright ? "text-black" : "text-white"
                        }`}
                      >
                        {color.hex}
                      </span>
                    </label>
                  </div>

                  {/* Bottom Modifier Controls */}
                  <div
                    className={`flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all rounded-lg p-1 bg-black/10 dark:bg-white/10 backdrop-blur-xs`}
                  >
                    {/* Lighten */}
                    <button
                      onClick={() => modifyColor(index, "lighten")}
                      className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold cursor-pointer hover:bg-black/20 ${
                        isBright ? "text-black/80" : "text-white/90"
                      }`}
                      title="Lighten"
                    >
                      +L
                    </button>
                    {/* Darken */}
                    <button
                      onClick={() => modifyColor(index, "darken")}
                      className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold cursor-pointer hover:bg-black/20 ${
                        isBright ? "text-black/80" : "text-white/90"
                      }`}
                      title="Darken"
                    >
                      -L
                    </button>
                    {/* Saturate */}
                    <button
                      onClick={() => modifyColor(index, "saturate")}
                      className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold cursor-pointer hover:bg-black/20 ${
                        isBright ? "text-black/80" : "text-white/90"
                      }`}
                      title="Saturate"
                    >
                      +S
                    </button>
                    {/* Desaturate */}
                    <button
                      onClick={() => modifyColor(index, "desaturate")}
                      className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold cursor-pointer hover:bg-black/20 ${
                        isBright ? "text-black/80" : "text-white/90"
                      }`}
                      title="Desaturate"
                    >
                      -S
                    </button>
                  </div>
                </div>

                {/* WCAG details info line */}
                <div
                  className={`py-1.5 text-center text-[10px] font-bold tracking-wider select-none border-t border-black/10 bg-black/5 dark:bg-white/5 ${
                    isBright ? "text-black/70" : "text-white/80"
                  }`}
                >
                  White contrast: {contrast.toFixed(1)}:1 ({isWhiteReadable ? "Pass" : "Fail"})
                </div>
              </Card>
            )
          })}
        </div>

        {/* Split Layout: Export options & live component mockup preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT: Export tools */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Export Palette Configurations
                </CardTitle>
                <CardDescription className="text-xs">Integrate codes directly into your layouts</CardDescription>
              </div>
              <div className="flex rounded-md bg-muted p-0.5 gap-0.5 text-[10px] font-medium border border-border">
                {(["hex", "css", "tailwind", "json"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`px-2 py-0.5 rounded uppercase cursor-pointer transition-all ${
                      exportFormat === fmt
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <textarea
                readOnly
                value={getExportString()}
                rows={5}
                className="w-full p-3 font-mono text-xs leading-relaxed bg-muted/40 border border-border/80 rounded-lg resize-none outline-none select-all"
              />
              <Button
                onClick={handleCopyExport}
                className="w-full h-9 text-xs gap-1.5 cursor-pointer font-bold"
              >
                {copiedExport ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedExport ? "Config Copied!" : "Copy Configuration to Clipboard"}
              </Button>
            </CardContent>
          </Card>

          {/* RIGHT: Live Component Mockup */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  UI Component Preview Mockup
                </CardTitle>
                <CardDescription className="text-xs">
                  Live preview of colors applied to component tokens
                </CardDescription>
              </div>
              <div className="flex rounded-md bg-muted p-0.5 gap-0.5 text-[10px] font-medium border border-border">
                {(["light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPreviewTheme(t)}
                    className={`px-2.5 py-0.5 rounded capitalize cursor-pointer transition-all ${
                      previewTheme === t
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t} Mode
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Preview Dashboard Card using colors:
                  colors[0] -> primary brand (background, text contrast)
                  colors[1] -> primary text / headings
                  colors[2] -> button/accent base
                  colors[3] -> panel background
                  colors[4] -> subtext or light borders
              */}
              <div
                style={{
                  backgroundColor: previewTheme === "light" ? colors[3].hex : colors[4].hex
                }}
                className="p-5 rounded-xl border border-border/80 flex flex-col gap-4 text-left transition-colors duration-300"
              >
                {/* Header bar preview */}
                <div className="flex items-center justify-between border-b pb-3 border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        backgroundColor: colors[0].hex,
                        color: getLuminance(colors[0].hex) > 0.45 ? "#000000" : "#FFFFFF"
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs transition-colors duration-300"
                    >
                      A
                    </div>
                    <span
                      style={{
                        color: previewTheme === "light" ? colors[4].hex : colors[3].hex
                      }}
                      className="text-xs font-bold font-mono tracking-wider transition-colors duration-300"
                    >
                      APPLICATION.IO
                    </span>
                  </div>
                  <div
                    style={{
                      backgroundColor: colors[1].hex,
                      color: getLuminance(colors[1].hex) > 0.45 ? "#000000" : "#FFFFFF"
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs transition-colors duration-300"
                  >
                    Theme Mode
                  </div>
                </div>

                {/* Content preview card */}
                <div
                  style={{
                    backgroundColor: previewTheme === "light" ? "#FFFFFF" : adjustLightness(colors[4].hex, 8)
                  }}
                  className={`p-4 rounded-lg shadow-xs border ${
                    previewTheme === "light" ? "border-black/5" : "border-white/5"
                  } transition-colors duration-300`}
                >
                  <h3
                    style={{
                      color: previewTheme === "light" ? colors[4].hex : colors[3].hex
                    }}
                    className="text-xs font-bold mb-1.5 transition-colors duration-300"
                  >
                    Structured Analytics Summary
                  </h3>
                  <p
                    style={{
                      color: previewTheme === "light" ? colors[4].hex : colors[3].hex
                    }}
                    className="text-[10px] leading-relaxed opacity-75 font-medium transition-colors duration-300 mb-4"
                  >
                    This layout previews how your primary, secondary, and accent colors work in tandem with light and dark semantic neutrals.
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      style={{
                        backgroundColor: colors[0].hex,
                        color: getLuminance(colors[0].hex) > 0.45 ? "#000000" : "#FFFFFF",
                      }}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-md shadow-xs transition-all hover:opacity-90 cursor-pointer"
                    >
                      Primary Action
                    </button>
                    <button
                      style={{
                        borderColor: colors[2].hex,
                        color: colors[2].hex,
                      }}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-md border transition-all hover:bg-muted/30 cursor-pointer bg-transparent"
                    >
                      Accent Accent
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
