import Link from "next/link"
import Image from "next/image"
import { ShieldCheck, Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t border-border/60 bg-card/60 backdrop-blur-xl px-4 sm:px-6 py-12 mt-auto">
      <div className="max-w-[1400px] mx-auto space-y-10">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <Image
                src="/logo.svg"
                alt="OmniTool By BEE"
                width={28}
                height={28}
                className="shrink-0 group-hover:scale-105 transition-transform duration-200"
              />
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-rose-600 dark:text-rose-500">
                  OmniTool
                </span>
                <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  BEE
                </span>
              </div>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              The privacy-first suite of web tools for PDF operations, image compression, developer utilities, and health metrics. 100% Client-side processing directly in your browser.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero Upload Risk &bull; Files stay on your machine</span>
            </div>
          </div>

          {/* Quick Links — PDF Suite */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-foreground text-[11px]">
              PDF Suite
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/pdf-organizer" className="hover:text-rose-500 transition-colors">
                  Split & Merge Studio
                </Link>
              </li>
              <li>
                <Link href="/pdf-merger" className="hover:text-rose-500 transition-colors">
                  PDF Merger
                </Link>
              </li>
              <li>
                <Link href="/pdf-splitter" className="hover:text-rose-500 transition-colors">
                  PDF Splitter
                </Link>
              </li>
              <li>
                <Link href="/image-to-pdf" className="hover:text-rose-500 transition-colors">
                  Image to PDF Converter
                </Link>
              </li>
              <li>
                <Link href="/pdf-compressor" className="hover:text-rose-500 transition-colors">
                  PDF Compressor
                </Link>
              </li>
              <li>
                <Link href="/pdf-link-editor" className="hover:text-rose-500 transition-colors">
                  PDF Link Editor
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links — Media & Generators */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-foreground text-[11px]">
              Media & Generators
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/image-converter" className="hover:text-rose-500 transition-colors">
                  Any Image Converter
                </Link>
              </li>
              <li>
                <Link href="/image-compressor" className="hover:text-rose-500 transition-colors">
                  Image Size Reducer
                </Link>
              </li>
              <li>
                <Link href="/qr-generator" className="hover:text-rose-500 transition-colors">
                  QR Code Generator
                </Link>
              </li>
              <li>
                <Link href="/barcode-generator" className="hover:text-rose-500 transition-colors">
                  Barcode Generator
                </Link>
              </li>
              <li>
                <Link href="/password-generator" className="hover:text-rose-500 transition-colors">
                  Password Generator
                </Link>
              </li>
              <li>
                <Link href="/blob-generator" className="hover:text-rose-500 transition-colors">
                  SVG Blob Generator
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links — Developer & Health */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-foreground text-[11px]">
              Dev & Health
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/json-formatter" className="hover:text-rose-500 transition-colors">
                  JSON Formatter & Tree
                </Link>
              </li>
              <li>
                <Link href="/base64-coder" className="hover:text-rose-500 transition-colors">
                  Base64 Coder
                </Link>
              </li>
              <li>
                <Link href="/hash-generator" className="hover:text-rose-500 transition-colors">
                  Hash Generator
                </Link>
              </li>
              <li>
                <Link href="/guid-generator" className="hover:text-rose-500 transition-colors">
                  GUID / UUID Generator
                </Link>
              </li>
              <li>
                <Link href="/bmi-calculator" className="hover:text-rose-500 transition-colors">
                  BMI Calculator
                </Link>
              </li>
              <li>
                <Link href="/water-intake" className="hover:text-rose-500 transition-colors">
                  Water Intake Calculator
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            &copy; {new Date().getFullYear()} OmniTool By BEE. All rights reserved.
          </span>
          <span className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> by{" "}
            <a
              href="https://bhathiya.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-foreground hover:text-rose-500 hover:underline underline-offset-4 transition-colors"
            >
              bhathiya.dev
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
