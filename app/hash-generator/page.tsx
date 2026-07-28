"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, Copy, Check } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

const ALGORITHMS = ["SHA-1", "SHA-256", "SHA-512"] as const
type Algo = (typeof ALGORITHMS)[number]

async function digest(algo: Algo, text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest(algo, data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export default function HashGenerator() {
  const [input, setInput] = useState("")
  const [hashes, setHashes] = useState<Partial<Record<Algo, string>>>({})
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (!input.trim()) {
      Promise.resolve().then(() => {
        if (active) setHashes({})
      })
      return () => {
        active = false
      }
    }
    Promise.all(ALGORITHMS.map((a) => digest(a, input).then((h) => [a, h] as const))).then(
      (results) => {
        if (active)
          setHashes(Object.fromEntries(results) as Record<Algo, string>)
      }
    )
    return () => {
      active = false
    }
  }, [input])

  const copyHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash)
    setCopied(hash)
    setTimeout(() => setCopied(null), 1500)
  }

  const ALGO_COLORS: Record<Algo, string> = {
    "SHA-1":   "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
    "SHA-256": "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20",
    "SHA-512": "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <CardTitle className="text-lg leading-none">Hash Generator</CardTitle>
                  <CardDescription className="mt-0.5">Cryptographic Hashing</CardDescription>
                </div>
              </div>
              <CardDescription className="mt-1">
                Generate SHA-1, SHA-256, and SHA-512 hashes from any text
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Input */}
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">Input Text</p>
                <Textarea
                  placeholder="Type or paste your text here…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={4}
                  className="resize-none text-sm"
                />
              </div>

              {/* Hash outputs */}
              <div className="space-y-3">
                {ALGORITHMS.map((algo) => {
                  const hash = hashes[algo]
                  return (
                    <div key={algo} className="rounded-xl border border-border overflow-hidden">
                      <div className={`flex items-center justify-between px-3 py-1.5 ${ALGO_COLORS[algo]}`}>
                        <span className="text-xs font-semibold">{algo}</span>
                        <button
                          onClick={() => hash && copyHash(hash)}
                          disabled={!hash}
                          className="disabled:opacity-30 transition-opacity"
                        >
                          {copied === hash ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="px-3 py-2.5 bg-muted/20">
                        {hash ? (
                          <p className="font-mono text-[11px] text-foreground break-all leading-relaxed">
                            {hash}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            {input ? "Computing…" : "Enter text above"}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Note: </span>
                Hashing is one-way - original text cannot be recovered from a hash.
                SHA-1 is included for compatibility; prefer SHA-256 or SHA-512 for
                security-sensitive use.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
