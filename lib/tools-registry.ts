import {
  Scale,
  QrCode,
  Barcode,
  Fingerprint,
  ArrowLeftRight,
  ShieldCheck,
  CalendarDays,
  Droplets,
  Ruler,
  Baby,
  FileStack,
  Scissors,
  Stamp,
  Minimize2,
  Layers,
  FileImage,
  Zap,
  Braces,
  KeyRound,
  Palette,
  Sparkles,
  Link2,
  LucideIcon,
} from "lucide-react"

export interface ToolItem {
  id: string
  name: string
  description: string
  icon: LucideIcon
  href: string
  category: string
  iconClass: string
  iconWrapperClass: string
  isPopular?: boolean
  isNew?: boolean
  badgeText?: string
}

export interface ToolCategory {
  id: string
  label: string
  description: string
  icon: LucideIcon
}

export const TOOL_CATEGORIES: Record<string, { label: string; icon: LucideIcon; description: string }> = {
  document: {
    label: "PDF Tools",
    description: "Split, merge, compress, watermark, edit & organize PDFs directly in your browser.",
    icon: Layers,
  },
  media: {
    label: "Media",
    description: "Convert & shrink image formats with zero quality loss.",
    icon: FileImage,
  },
  generators: {
    label: "Generators",
    description: "Create QR codes, barcodes, passwords, colors, GUIDs & SVG blobs.",
    icon: Sparkles,
  },
  developer: {
    label: "Developer",
    description: "Base64 encoding, cryptographic hashing, and JSON formatting.",
    icon: Braces,
  },
  health: {
    label: "Health",
    description: "Track BMI, age, water intake, ideal body weight & pregnancy milestones.",
    icon: Scale,
  },
}

export const ALL_TOOLS: ToolItem[] = [
  // Document Tools (PDF Suite - ILovePDF Rivals!)
  {
    id: "pdf-organizer",
    name: "PDF Split & Merge Studio",
    description: "Visual canvas: upload multiple PDFs & images, reorder, rotate, extract & merge.",
    icon: Layers,
    href: "/pdf-organizer",
    category: "document",
    iconClass: "text-indigo-600 dark:text-indigo-400",
    iconWrapperClass: "bg-indigo-500/10 border-indigo-500/20",
    isPopular: true,
    badgeText: "STUDIO",
  },
  {
    id: "image-to-pdf",
    name: "Image to PDF Converter",
    description: "Convert JPG, PNG, WEBP, GIF & BMP images into a compiled PDF document.",
    icon: FileImage,
    href: "/image-to-pdf",
    category: "document",
    iconClass: "text-blue-600 dark:text-blue-400",
    iconWrapperClass: "bg-blue-500/10 border-blue-500/20",
    isPopular: true,
    isNew: true,
    badgeText: "NEW",
  },
  {
    id: "pdf-merger",
    name: "PDF Merger",
    description: "Combine multiple PDF files into one clean document seamlessly.",
    icon: FileStack,
    href: "/pdf-merger",
    category: "document",
    iconClass: "text-rose-600 dark:text-rose-400",
    iconWrapperClass: "bg-rose-500/10 border-rose-500/20",
    isPopular: true,
    badgeText: "FAST",
  },
  {
    id: "pdf-splitter",
    name: "PDF Splitter",
    description: "Separate pages from a PDF document or extract specific page ranges.",
    icon: Scissors,
    href: "/pdf-splitter",
    category: "document",
    iconClass: "text-amber-600 dark:text-amber-400",
    iconWrapperClass: "bg-amber-500/10 border-amber-500/20",
    isPopular: true,
  },
  {
    id: "pdf-compressor",
    name: "PDF Compressor",
    description: "Optimize PDF object streams and reduce file size up to 70%.",
    icon: Minimize2,
    href: "/pdf-compressor",
    category: "document",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    iconWrapperClass: "bg-emerald-500/10 border-emerald-500/20",
    isPopular: true,
  },
  {
    id: "pdf-link-editor",
    name: "PDF Link Editor",
    description: "Draw interactive click hotspots on PDF pages and attach web links.",
    icon: Link2,
    href: "/pdf-link-editor",
    category: "document",
    iconClass: "text-violet-600 dark:text-violet-400",
    iconWrapperClass: "bg-violet-500/10 border-violet-500/20",
    isNew: true,
  },

  // Media & Images
  {
    id: "image-converter",
    name: "Any Image Converter",
    description: "Convert PNG, JPG, WEBP, BMP, GIF & SVG to any format client-side.",
    icon: FileImage,
    href: "/image-converter",
    category: "media",
    iconClass: "text-blue-600 dark:text-blue-400",
    iconWrapperClass: "bg-blue-500/10 border-blue-500/20",
    isPopular: true,
  },
  {
    id: "image-compressor",
    name: "Image Size Reducer",
    description: "Intelligently shrink image file sizes client-side with zero upload wait time.",
    icon: Zap,
    href: "/image-compressor",
    category: "media",
    iconClass: "text-amber-600 dark:text-amber-400",
    iconWrapperClass: "bg-amber-500/10 border-amber-500/20",
  },

  // Generators
  {
    id: "qr-generator",
    name: "QR Generator",
    description: "Generate instant QR codes for URLs, text, WiFi credentials, and contacts.",
    icon: QrCode,
    href: "/qr-generator",
    category: "generators",
    iconClass: "text-purple-600 dark:text-purple-400",
    iconWrapperClass: "bg-purple-500/10 border-purple-500/20",
    isPopular: true,
  },
  {
    id: "barcode-generator",
    name: "Barcode Generator",
    description: "Create standard Code128, EAN, and UPC barcodes instantly.",
    icon: Barcode,
    href: "/barcode-generator",
    category: "generators",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    iconWrapperClass: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "guid-generator",
    name: "GUID / UUID Generator",
    description: "Generate cryptographically random UUID v4 identifiers in bulk.",
    icon: Fingerprint,
    href: "/guid-generator",
    category: "generators",
    iconClass: "text-violet-600 dark:text-violet-400",
    iconWrapperClass: "bg-violet-500/10 border-violet-500/20",
  },
  {
    id: "password-generator",
    name: "Password Generator",
    description: "Generate custom, cryptographically secure passwords in your browser.",
    icon: KeyRound,
    href: "/password-generator",
    category: "generators",
    iconClass: "text-blue-600 dark:text-blue-400",
    iconWrapperClass: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "color-palette-generator",
    name: "Color Palette Generator",
    description: "Generate harmonic color schemes using visual color theory.",
    icon: Palette,
    href: "/color-palette-generator",
    category: "generators",
    iconClass: "text-amber-600 dark:text-amber-400",
    iconWrapperClass: "bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "blob-generator",
    name: "SVG Blob Generator",
    description: "Generate smooth organic vector SVG shapes and gradient overlays.",
    icon: Sparkles,
    href: "/blob-generator",
    category: "generators",
    iconClass: "text-pink-600 dark:text-pink-400",
    iconWrapperClass: "bg-pink-500/10 border-pink-500/20",
  },

  // Developer Tools
  {
    id: "base64-coder",
    name: "Base64 Encoder / Decoder",
    description: "Encode raw text to Base64 format or decode Base64 back to plain text.",
    icon: ArrowLeftRight,
    href: "/base64-coder",
    category: "developer",
    iconClass: "text-cyan-600 dark:text-cyan-400",
    iconWrapperClass: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate SHA-1, SHA-256, and SHA-512 hashes from input strings.",
    icon: ShieldCheck,
    href: "/hash-generator",
    category: "developer",
    iconClass: "text-rose-600 dark:text-rose-400",
    iconWrapperClass: "bg-rose-500/10 border-rose-500/20",
  },
  {
    id: "json-formatter",
    name: "JSON Formatter & Tree",
    description: "Format, validate, repair, and visualize hierarchical JSON data.",
    icon: Braces,
    href: "/json-formatter",
    category: "developer",
    iconClass: "text-purple-600 dark:text-purple-400",
    iconWrapperClass: "bg-purple-500/10 border-purple-500/20",
    isPopular: true,
  },

  // Health & Fitness
  {
    id: "bmi-calculator",
    name: "BMI Calculator",
    description: "Calculate your Body Mass Index and health category recommendation.",
    icon: Scale,
    href: "/bmi-calculator",
    category: "health",
    iconClass: "text-blue-600 dark:text-blue-400",
    iconWrapperClass: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "age-calculator",
    name: "Age Calculator",
    description: "Find your exact age down to years, months, days, and total hours.",
    icon: CalendarDays,
    href: "/age-calculator",
    category: "health",
    iconClass: "text-orange-600 dark:text-orange-400",
    iconWrapperClass: "bg-orange-500/10 border-orange-500/20",
  },
  {
    id: "water-intake",
    name: "Water Intake Calculator",
    description: "Calculate recommended daily hydration based on body metrics and activity level.",
    icon: Droplets,
    href: "/water-intake",
    category: "health",
    iconClass: "text-sky-600 dark:text-sky-400",
    iconWrapperClass: "bg-sky-500/10 border-sky-500/20",
  },
  {
    id: "ideal-weight",
    name: "Ideal Body Weight",
    description: "Calculate healthy target weight range with standard clinical formulas.",
    icon: Ruler,
    href: "/ideal-weight",
    category: "health",
    iconClass: "text-teal-600 dark:text-teal-400",
    iconWrapperClass: "bg-teal-500/10 border-teal-500/20",
  },
  {
    id: "pregnancy-due-date",
    name: "Pregnancy Due Date",
    description: "Estimate estimated delivery date, trimester timeline & developmental milestones.",
    icon: Baby,
    href: "/pregnancy-due-date",
    category: "health",
    iconClass: "text-pink-600 dark:text-pink-400",
    iconWrapperClass: "bg-pink-500/10 border-pink-500/20",
  },
]
