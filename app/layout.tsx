import { Geist_Mono, Inter } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  metadataBase: new URL("https://utilbee.bhathiya.dev"),
  title: {
    default: "UtilBEE - Privacy-First Online Web Tools Suite",
    template: "%s | UtilBEE",
  },
  description:
    "100% free & client-side online web tools suite for PDF operations, image compression, QR code generation, favicon studio, developer utilities, and health metrics. No file uploads or signup required.",
  keywords: [
    "online pdf tools",
    "pdf merger",
    "pdf splitter",
    "image compressor",
    "favicon generator",
    "qr code generator",
    "barcode generator",
    "password generator",
    "json formatter",
    "base64 encoder",
    "hash generator",
    "uuid generator",
    "bmi calculator",
    "privacy-first web tools",
    "utilbee",
  ],
  authors: [{ name: "UtilBEE Team", url: "https://bhathiya.dev" }],
  creator: "Bhathiya",
  publisher: "UtilBEE",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://utilbee.bhathiya.dev",
    siteName: "UtilBEE",
    title: "UtilBEE - Free Privacy-First Online Web Tools",
    description:
      "Convert PDFs, compress images, generate favicons, QR codes, passwords & format JSON 100% client-side in your browser.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "UtilBEE - Free Online Web Tools Suite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UtilBEE - Free Privacy-First Online Web Tools",
    description:
      "Convert PDFs, compress images, generate favicons, QR codes, passwords & format JSON 100% client-side.",
    creator: "@bhathiyadev",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
}

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "UtilBEE",
    url: "https://utilbee.bhathiya.dev",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Privacy-first suite of online web tools for PDF editing, image compression, QR generation, favicon studio, and developer utilities.",
    browserRequirements: "Requires WebAssembly & HTML5 Canvas support",
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
