"use client"

import { useState, useEffect, useCallback } from "react"
import {
  KeyRound,
  Copy,
  Check,
  RotateCw,
  Eye,
  EyeOff,
  History,
  Shield,
  ListPlus,
  Info,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

// Helper to generate a single password
function generateSecurePassword(
  length: number,
  options: {
    upper: boolean
    lower: boolean
    number: boolean
    symbol: boolean
    excludeSimilar: boolean
    easyToSay: boolean
  }
): string {
  if (options.easyToSay) {
    // Generate pronounceable password using syllable pattern: consonant-vowel-consonant
    const vowels = options.excludeSimilar ? "aeuy" : "aeiouy"
    const consonants = options.excludeSimilar 
      ? "bcdfghjkmnpqrstvwxz" 
      : "bcdfghjklmnpqrstvwxyz"
    
    let result = ""
    for (let i = 0; i < length; i++) {
      const chars = i % 2 === 0 ? consonants : vowels
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    // Capitalize some parts if upper is enabled
    if (options.upper) {
      result = result
        .split("")
        .map((c, idx) => (idx % 3 === 0 ? c.toUpperCase() : c))
        .join("")
    }
    return result
  }

  let pool = ""
  if (options.lower) pool += "abcdefghijklmnopqrstuvwxyz"
  if (options.upper) pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  if (options.number) pool += "0123456789"
  if (options.symbol) pool += "!@#$%^&*()_+-=[]{}|;':\",./<>?"

  if (options.excludeSimilar) {
    // Exclude characters: i, l, 1, L, o, 0, O, I
    pool = pool.replace(/[il1Lo0OI]/g, "")
  }

  if (pool.length === 0) return ""

  let result = ""
  if (typeof window !== "undefined" && window.crypto) {
    const array = new Uint32Array(length)
    window.crypto.getRandomValues(array)
    for (let i = 0; i < length; i++) {
      result += pool.charAt(array[i] % pool.length)
    }
  } else {
    // Fallback if window/crypto is not available during SSR
    for (let i = 0; i < length; i++) {
      result += pool.charAt(Math.floor(Math.random() * pool.length))
    }
  }
  return result
}

// Calculate password entropy
function getEntropy(
  length: number,
  options: {
    upper: boolean
    lower: boolean
    number: boolean
    symbol: boolean
    excludeSimilar: boolean
    easyToSay: boolean
  }
): number {
  if (length <= 0) return 0
  let poolSize = 0
  if (options.easyToSay) {
    // pronounceable
    const vowels = options.excludeSimilar ? 4 : 6
    const consonants = options.excludeSimilar ? 19 : 21
    poolSize = (vowels + consonants) / 2 // average pool size
  } else {
    if (options.lower) poolSize += 26
    if (options.upper) poolSize += 26
    if (options.number) poolSize += 10
    if (options.symbol) poolSize += 29
    if (options.excludeSimilar) poolSize -= 8
  }

  if (poolSize === 0) return 0
  return Math.round(length * Math.log2(poolSize))
}

export default function PasswordGenerator() {
  const [password, setPassword] = useState("")
  const [copied, setCopied] = useState(false)
  const [showPassword, setShowPassword] = useState(true)
  const [length, setLength] = useState(16)
  
  // Options
  const [options, setOptions] = useState({
    upper: true,
    lower: true,
    number: true,
    symbol: true,
    excludeSimilar: false,
    easyToSay: false,
  })

  // Bulk options
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkCount, setBulkCount] = useState(5)
  const [bulkPasswords, setBulkPasswords] = useState<string[]>([])
  const [bulkCopiedIdx, setBulkCopiedIdx] = useState<number | null>(null)
  const [bulkCopiedAll, setBulkCopiedAll] = useState(false)

  // History
  const [history, setHistory] = useState<string[]>([])

  // Generate password trigger
  const handleGenerate = useCallback(() => {
    // If no character type is selected, force lower case to make it valid
    const activeOpts = { ...options }
    if (!options.upper && !options.lower && !options.number && !options.symbol && !options.easyToSay) {
      activeOpts.lower = true
      setOptions((prev) => ({ ...prev, lower: true }))
    }

    if (bulkMode) {
      const generated: string[] = []
      for (let i = 0; i < bulkCount; i++) {
        generated.push(generateSecurePassword(length, activeOpts))
      }
      setBulkPasswords(generated)
      if (generated[0]) {
        setPassword(generated[0])
        setHistory((prev) => {
          const filtered = prev.filter((p) => p !== generated[0])
          return [generated[0], ...filtered].slice(0, 5)
        })
      }
    } else {
      const newPwd = generateSecurePassword(length, activeOpts)
      setPassword(newPwd)
      setHistory((prev) => {
        const filtered = prev.filter((p) => p !== newPwd)
        return [newPwd, ...filtered].slice(0, 5)
      })
    }
  }, [bulkCount, bulkMode, length, options])

  // Trigger generation on load and option changes
  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) handleGenerate()
    })
    return () => {
      active = false
    }
  }, [handleGenerate])

  const handleCopyMain = async () => {
    if (!password) return
    await navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleCopyBulk = async (val: string, index: number) => {
    await navigator.clipboard.writeText(val)
    setBulkCopiedIdx(index)
    setTimeout(() => setBulkCopiedIdx(null), 1500)
  }

  const handleCopyAllBulk = async () => {
    if (bulkPasswords.length === 0) return
    const textToCopy = bulkPasswords.join("\n")
    await navigator.clipboard.writeText(textToCopy)
    setBulkCopiedAll(true)
    setTimeout(() => setBulkCopiedAll(false), 1500)
  }

  // Strength details based on entropy
  const entropy = getEntropy(length, options)
  
  let strengthLabel = "Weak"
  let strengthColor = "bg-destructive"
  let strengthTextColor = "text-destructive"
  let progressWidth = "w-1/4"
  let strengthDesc = "Vulnerable to basic brute force attacks. Make it longer or check more character pools."

  if (entropy >= 90) {
    strengthLabel = "Very Strong"
    strengthColor = "bg-emerald-500"
    strengthTextColor = "text-emerald-500"
    progressWidth = "w-full"
    strengthDesc = "Extremely secure. Ideal for master keys, password managers, and top level databases."
  } else if (entropy >= 70) {
    strengthLabel = "Strong"
    strengthColor = "bg-teal-500"
    strengthTextColor = "text-teal-500"
    progressWidth = "w-3/4"
    strengthDesc = "High security password. Solid defense against advanced brute force methods."
  } else if (entropy >= 45) {
    strengthLabel = "Medium"
    strengthColor = "bg-amber-500"
    strengthTextColor = "text-amber-500"
    progressWidth = "w-1/2"
    strengthDesc = "Moderate strength. Acceptable for simple online accounts, but not recommended for critical vaults."
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-24 pb-10 sm:px-6 sm:pt-28 sm:pb-14">
        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Secure Password Generator
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Generate strong, cryptographically secure keys client-side to protect your digital accounts.
            </p>
          </div>
        </div>

        {/* Outer Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT/MID: Settings Card */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm">
              <CardContent className="pt-6 space-y-6">
                {/* Result Display Box */}
                <div className="relative flex items-center justify-between rounded-xl bg-muted/40 p-4 border border-border/80">
                  <div className="flex-1 min-w-0 pr-10">
                    <input
                      type={showPassword ? "text" : "password"}
                      readOnly
                      value={password}
                      className="w-full bg-transparent font-mono text-base md:text-xl font-bold tracking-wider text-foreground outline-none select-all"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                      title="Regenerate password"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <Button
                      onClick={handleCopyMain}
                      className="h-9 px-3 gap-1.5 text-xs font-semibold cursor-pointer"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                {/* Strength Gauge */}
                <div className="space-y-2 bg-muted/20 p-4 rounded-xl border border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Strength Index:
                    </span>
                    <span className={`text-xs font-bold ${strengthTextColor}`}>
                      {strengthLabel} ({entropy} bits)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strengthColor} ${progressWidth}`} />
                  </div>
                  <div className="flex items-start gap-1.5 mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    <Info className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                    <span>{strengthDesc}</span>
                  </div>
                </div>

                {/* Length Config */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-foreground">Password Length</label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={6}
                        max={64}
                        value={length}
                        onChange={(e) => {
                          const val = Math.max(6, Math.min(64, parseInt(e.target.value) || 6))
                          setLength(val)
                        }}
                        className="w-14 h-8 px-2 text-center text-xs font-semibold"
                      />
                      <span className="text-xs text-muted-foreground font-medium">chars</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground font-semibold">6</span>
                    <input
                      type="range"
                      min={6}
                      max={64}
                      value={length}
                      onChange={(e) => setLength(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                    />
                    <span className="text-xs text-muted-foreground font-semibold">64</span>
                  </div>
                </div>

                {/* Settings Checkboxes */}
                <div className="space-y-3.5">
                  <label className="text-sm font-semibold text-foreground block">Characters Included</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Lowercase */}
                    <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border/80 hover:bg-muted/15 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={options.lower}
                        disabled={options.easyToSay}
                        onChange={(e) => setOptions((prev) => ({ ...prev, lower: e.target.checked }))}
                        className="rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer disabled:opacity-40"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold text-foreground block leading-none">Lowercase Letters</span>
                        <span className="text-[10px] text-muted-foreground">e.g. a-z</span>
                      </div>
                    </label>

                    {/* Uppercase */}
                    <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border/80 hover:bg-muted/15 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={options.upper}
                        onChange={(e) => setOptions((prev) => ({ ...prev, upper: e.target.checked }))}
                        className="rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold text-foreground block leading-none">Uppercase Letters</span>
                        <span className="text-[10px] text-muted-foreground">e.g. A-Z</span>
                      </div>
                    </label>

                    {/* Numbers */}
                    <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border/80 hover:bg-muted/15 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={options.number}
                        disabled={options.easyToSay}
                        onChange={(e) => setOptions((prev) => ({ ...prev, number: e.target.checked }))}
                        className="rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer disabled:opacity-40"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold text-foreground block leading-none">Numerical Digits</span>
                        <span className="text-[10px] text-muted-foreground">e.g. 0-9</span>
                      </div>
                    </label>

                    {/* Symbols */}
                    <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border/80 hover:bg-muted/15 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={options.symbol}
                        disabled={options.easyToSay}
                        onChange={(e) => setOptions((prev) => ({ ...prev, symbol: e.target.checked }))}
                        className="rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer disabled:opacity-40"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold text-foreground block leading-none">Special Symbols</span>
                        <span className="text-[10px] text-muted-foreground">e.g. !@#$%^&*</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Advanced Exclusions */}
                <div className="border-t border-border/80 pt-4 space-y-3.5">
                  <label className="text-sm font-semibold text-foreground block">Advanced Constraints</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Avoid Similar */}
                    <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border/80 hover:bg-muted/15 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={options.excludeSimilar}
                        onChange={(e) => setOptions((prev) => ({ ...prev, excludeSimilar: e.target.checked }))}
                        className="rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold text-foreground block leading-none">Avoid Confusing Characters</span>
                        <span className="text-[10px] text-muted-foreground">Excludes i, l, 1, L, o, 0, O, I</span>
                      </div>
                    </label>

                    {/* Easy to say */}
                    <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border/80 hover:bg-muted/15 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={options.easyToSay}
                        onChange={(e) => {
                          const val = e.target.checked
                          setOptions((prev) => ({
                            ...prev,
                            easyToSay: val,
                            // If easy to say, disable numbers & symbols
                            lower: val ? true : prev.lower,
                            number: val ? false : prev.number,
                            symbol: val ? false : prev.symbol,
                          }))
                        }}
                        className="rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold text-foreground block leading-none">Easy to Pronounce</span>
                        <span className="text-[10px] text-muted-foreground">Alternates consonants and vowels</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Bulk Toggle config */}
                <div className="border-t border-border/80 pt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bulkModeCheck"
                      checked={bulkMode}
                      onChange={(e) => setBulkMode(e.target.checked)}
                      className="rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="bulkModeCheck" className="text-xs font-bold text-foreground cursor-pointer select-none">
                      Generate Multiple Passwords at Once
                    </label>
                  </div>

                  {bulkMode && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-semibold">Quantity:</span>
                      <select
                        value={bulkCount}
                        onChange={(e) => setBulkCount(parseInt(e.target.value))}
                        className="bg-muted border border-border text-foreground rounded px-2.5 py-1 text-xs font-bold focus:outline-none"
                      >
                        {[5, 10, 15, 20].map((num) => (
                          <option key={num} value={num}>
                            {num} Passwords
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bulk Display Section */}
            {bulkMode && bulkPasswords.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <ListPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Bulk Password Generation List
                    </CardTitle>
                    <CardDescription className="text-xs">Copy individual passwords or all at once</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAllBulk}
                    className="h-8 text-xs gap-1.5 cursor-pointer"
                  >
                    {bulkCopiedAll ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {bulkCopiedAll ? "All Copied!" : "Copy All List"}
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-border/60 max-h-60 overflow-y-auto pr-1 bg-muted/10 border border-border/80 rounded-lg">
                    {bulkPasswords.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 font-mono text-xs md:text-sm hover:bg-muted/30">
                        <span className="truncate select-all pr-4">{item}</span>
                        <button
                          onClick={() => handleCopyBulk(item, index)}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {bulkCopiedIdx === index ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {bulkCopiedIdx === index ? "Copied" : "Copy"}
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT: History Sidebar */}
          <div className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Session History
                </CardTitle>
                <CardDescription className="text-xs">
                  Restore or copy recently generated passwords
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-lg text-xs text-muted-foreground">
                    History list is currently empty.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {history.map((pwd, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col p-2.5 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="font-mono text-xs text-foreground truncate select-all font-semibold pb-1.5">
                          {pwd}
                        </div>
                        <div className="flex gap-2 border-t border-border/40 pt-1.5">
                          <button
                            onClick={async () => {
                              await navigator.clipboard.writeText(pwd)
                            }}
                            className="flex-1 text-center py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-all cursor-pointer font-bold"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => {
                              setPassword(pwd)
                            }}
                            className="flex-1 text-center py-0.5 rounded text-[10px] text-blue-600 dark:text-blue-400 hover:bg-blue-100/40 hover:dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-900/40 transition-all cursor-pointer font-bold"
                          >
                            Load
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
