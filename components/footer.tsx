import Link from "next/link"
import Image from "next/image"
import { ShieldCheck, Heart } from "lucide-react"
import pkg from "@/package.json"

export function Footer() {
  const version = pkg.version

  return (
    <footer className="mt-auto w-full border-t border-border/60 bg-card/60 px-4 py-12 backdrop-blur-xl sm:px-6">
      <div className="mx-auto max-w-[1400px] space-y-10">
        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-2">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <Image
                src="/logo.svg"
                alt="OmniTool"
                width={28}
                height={28}
                className="shrink-0 transition-transform duration-200 group-hover:scale-105"
              />
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-rose-600 dark:text-rose-500">
                  OmniTool
                </span>
                <span className="rounded-md border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-rose-600 uppercase dark:text-rose-400">
                  BEE
                </span>
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                  v{version}
                </span>
              </div>
            </Link>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              The privacy-first suite of web tools for PDF operations, image
              compression, developer utilities, and health metrics. 100%
              Client-side processing directly in your browser.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Zero Upload Risk &bull; Files stay on your machine</span>
            </div>
          </div>

          {/* Quick Links — PDF Suite */}
          <div className="space-y-3 text-xs">
            <h4 className="text-[11px] font-bold tracking-wider text-foreground uppercase">
              PDF Suite
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link
                  href="/pdf-organizer"
                  className="transition-colors hover:text-rose-500"
                >
                  Split & Merge Studio
                </Link>
              </li>
              <li>
                <Link
                  href="/pdf-merger"
                  className="transition-colors hover:text-rose-500"
                >
                  PDF Merger
                </Link>
              </li>
              <li>
                <Link
                  href="/pdf-splitter"
                  className="transition-colors hover:text-rose-500"
                >
                  PDF Splitter
                </Link>
              </li>
              <li>
                <Link
                  href="/image-to-pdf"
                  className="transition-colors hover:text-rose-500"
                >
                  Image to PDF Converter
                </Link>
              </li>
              <li>
                <Link
                  href="/pdf-compressor"
                  className="transition-colors hover:text-rose-500"
                >
                  PDF Compressor
                </Link>
              </li>
              <li>
                <Link
                  href="/pdf-link-editor"
                  className="transition-colors hover:text-rose-500"
                >
                  PDF Link Editor
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links — Media & Generators */}
          <div className="space-y-3 text-xs">
            <h4 className="text-[11px] font-bold tracking-wider text-foreground uppercase">
              Media & Generators
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link
                  href="/image-converter"
                  className="transition-colors hover:text-rose-500"
                >
                  Any Image Converter
                </Link>
              </li>
              <li>
                <Link
                  href="/image-compressor"
                  className="transition-colors hover:text-rose-500"
                >
                  Image Size Reducer
                </Link>
              </li>
              <li>
                <Link
                  href="/qr-generator"
                  className="transition-colors hover:text-rose-500"
                >
                  QR Code Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/barcode-generator"
                  className="transition-colors hover:text-rose-500"
                >
                  Barcode Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/password-generator"
                  className="transition-colors hover:text-rose-500"
                >
                  Password Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/blob-generator"
                  className="transition-colors hover:text-rose-500"
                >
                  SVG Blob Generator
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links — Developer & Health */}
          <div className="space-y-3 text-xs">
            <h4 className="text-[11px] font-bold tracking-wider text-foreground uppercase">
              Dev & Health
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link
                  href="/json-formatter"
                  className="transition-colors hover:text-rose-500"
                >
                  JSON Formatter & Tree
                </Link>
              </li>
              <li>
                <Link
                  href="/base64-coder"
                  className="transition-colors hover:text-rose-500"
                >
                  Base64 Coder
                </Link>
              </li>
              <li>
                <Link
                  href="/hash-generator"
                  className="transition-colors hover:text-rose-500"
                >
                  Hash Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/guid-generator"
                  className="transition-colors hover:text-rose-500"
                >
                  GUID / UUID Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/bmi-calculator"
                  className="transition-colors hover:text-rose-500"
                >
                  BMI Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/water-intake"
                  className="transition-colors hover:text-rose-500"
                >
                  Water Intake Calculator
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <span>
              &copy; {new Date().getFullYear()} OmniTool By BEE. All rights
              reserved.
            </span>
          </div>
          <span className="flex items-center gap-1">
            Developed By
            <a
              href="https://bhathiya.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-foreground underline-offset-4 transition-colors hover:text-rose-500 hover:underline"
            >
              bhathiya.dev
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
