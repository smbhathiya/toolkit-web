"use client"

import { useState, useEffect, useRef } from "react"
import { Droplets, Thermometer, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import gsap from "gsap"

type WeightUnit = "kg" | "lbs"

const ACTIVITY_LEVELS = [
  { label: "Sedentary",   desc: "Little or no exercise",    factor: 1.0,  emoji: "🪑" },
  { label: "Light",       desc: "1–3 days / week",          factor: 1.12, emoji: "🚶" },
  { label: "Moderate",    desc: "3–5 days / week",          factor: 1.25, emoji: "🏃" },
  { label: "Active",      desc: "6–7 days / week",          factor: 1.4,  emoji: "🏋️" },
  { label: "Very Active", desc: "Intense daily training",   factor: 1.6,  emoji: "⚡" },
]

const CLIMATE_OPTIONS = [
  { label: "Temperate",   desc: "Cool or mild climate",     factor: 1.0  },
  { label: "Hot / Humid", desc: "Warm or tropical climate", factor: 1.15 },
]

function calcWater(weightKg: number, activityFactor: number, climateFactor: number) {
  const liters = weightKg * 0.033 * activityFactor * climateFactor
  return { liters: Math.round(liters * 10) / 10, glasses: Math.round(liters / 0.25), ml: Math.round(liters * 1000) }
}

export default function WaterIntake() {
  const [weight, setWeight] = useState("")
  const [unit, setUnit] = useState<WeightUnit>("kg")
  const [activityIdx, setActivityIdx] = useState(1)
  const [climateIdx, setClimateIdx] = useState(0)

  const weightKg = unit === "kg" ? parseFloat(weight) : parseFloat(weight) * 0.453592
  const valid = weightKg > 0 && !isNaN(weightKg)
  const result = valid ? calcWater(weightKg, ACTIVITY_LEVELS[activityIdx].factor, CLIMATE_OPTIONS[climateIdx].factor) : null

  const litersRef = useRef<HTMLSpanElement>(null)
  const mlRef = useRef<HTMLSpanElement>(null)
  const glassesRef = useRef<HTMLSpanElement>(null)
  const waterFillRef = useRef<HTMLDivElement>(null)
  const prevResultRef = useRef<typeof result>(null)
  const hasShownRef = useRef(false)

  useEffect(() => {
    if (!result) { hasShownRef.current = false; prevResultRef.current = null; return }
    const isFirstShow = !hasShownRef.current
    hasShownRef.current = true

    const ctx = gsap.context(() => {
      if (isFirstShow) {
        gsap.from(".water-result-panel", { opacity: 0, x: 30, duration: 0.5, ease: "power3.out" })
        gsap.from(".water-glass-icon", { scale: 0, opacity: 0, duration: 0.25, stagger: 0.04, ease: "back.out(1.7)", delay: 0.3 })
      }
      const cL = { val: prevResultRef.current?.liters ?? 0 }
      gsap.to(cL, { val: result.liters, duration: 0.7, ease: "power2.out",
        onUpdate() { if (litersRef.current) litersRef.current.textContent = cL.val.toFixed(1) } })
      const cG = { val: prevResultRef.current?.glasses ?? 0 }
      gsap.to(cG, { val: result.glasses, duration: 0.7, ease: "power2.out",
        onUpdate() { if (glassesRef.current) glassesRef.current.textContent = Math.round(cG.val).toString() } })
      const cM = { val: prevResultRef.current?.ml ?? 0 }
      gsap.to(cM, { val: result.ml, duration: 0.7, ease: "power2.out",
        onUpdate() { if (mlRef.current) mlRef.current.textContent = Math.round(cM.val).toLocaleString() } })
      gsap.to(waterFillRef.current, { height: `${Math.min(92, (result.liters / 5) * 100)}%`, duration: 0.9, ease: "power2.out" })
    })
    prevResultRef.current = result
    return () => ctx.revert()
  }, [result?.liters, result?.glasses, result?.ml])

  const fillPct = result ? Math.min(92, (result.liters / 5) * 100) : 0

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 pt-24 pb-12 sm:pt-28 sm:pb-16">
        <div className="mx-auto w-full max-w-[1400px]">

          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-start">

            {/* Input card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0">
                    <Droplets className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl leading-none">Water Intake</CardTitle>
                    <CardDescription className="mt-1">Daily Hydration Calculator</CardDescription>
                  </div>
                </div>
                <CardDescription className="mt-2 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Results update instantly as you change the settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Weight */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Body Weight</Label>
                    <div className="flex rounded-md bg-muted p-0.5 gap-0.5">
                      {(["kg","lbs"] as WeightUnit[]).map((u) => (
                        <button key={u} onClick={() => { setUnit(u); setWeight("") }}
                          className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                            unit === u ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                          }`}>{u}</button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <Input type="number" placeholder={unit === "kg" ? "e.g. 70" : "e.g. 154"}
                      value={weight} onChange={(e) => setWeight(e.target.value)}
                      className="h-11 pr-12 text-base" min="1" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{unit}</span>
                  </div>
                </div>

                {/* Activity */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Activity Level</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                    {ACTIVITY_LEVELS.map((a, i) => (
                      <button key={a.label} onClick={() => setActivityIdx(i)}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                          activityIdx === i
                            ? "border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/20 shadow-sm"
                            : "border-border hover:border-sky-200 dark:hover:border-sky-800 hover:bg-muted/30"
                        }`}>
                        <span className="text-xl">{a.emoji}</span>
                        <div>
                          <p className={`text-sm font-medium ${activityIdx === i ? "text-foreground" : "text-muted-foreground"}`}>{a.label}</p>
                          <p className="text-xs text-muted-foreground">{a.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Climate */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Climate</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {CLIMATE_OPTIONS.map((c, i) => (
                      <button key={c.label} onClick={() => setClimateIdx(i)}
                        className={`flex flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left transition-all ${
                          climateIdx === i
                            ? "border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/20 shadow-sm"
                            : "border-border hover:border-sky-200 dark:hover:border-sky-800 hover:bg-muted/30"
                        }`}>
                        <span className={`text-sm font-medium ${climateIdx === i ? "text-foreground" : "text-muted-foreground"}`}>{c.label}</span>
                        <span className="text-xs text-muted-foreground">{c.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Result panel — sticky on desktop */}
            <div className="md:sticky md:top-28 space-y-4">
              {result ? (
                <Card className="water-result-panel overflow-hidden">
                  <CardContent className="p-0">
                    {/* Bottle + hero */}
                    <div className="bg-gradient-to-b from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 px-5 pt-6 pb-5 border-b border-sky-100 dark:border-sky-800/50 flex flex-col items-center gap-4">
                      {/* Bottle visual */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-5 h-2.5 rounded-t-sm bg-sky-300 dark:bg-sky-700" />
                        <div className="w-14 h-24 border-2 border-sky-300 dark:border-sky-600 rounded-b-2xl rounded-t-sm overflow-hidden relative bg-white/50 dark:bg-sky-900/10">
                          <div ref={waterFillRef} className="absolute bottom-0 left-0 right-0 bg-sky-300/70 dark:bg-sky-600/70" style={{ height: "0%" }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{Math.round(fillPct)}% of 5L target</span>
                      </div>
                      {/* Main number */}
                      <div className="text-center">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Daily intake</p>
                        <div className="flex items-baseline gap-1.5 justify-center">
                          <span className="text-5xl font-black text-sky-600 dark:text-sky-400">
                            <span ref={litersRef}>{result.liters}</span>
                          </span>
                          <span className="text-xl font-semibold text-muted-foreground">L</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="px-5 py-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-border bg-muted/20 p-3.5 text-center">
                          <p className="text-2xl font-bold text-foreground"><span ref={glassesRef}>{result.glasses}</span></p>
                          <p className="text-xs text-muted-foreground mt-0.5">glasses (250ml)</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-3.5 text-center">
                          <p className="text-2xl font-bold text-foreground"><span ref={mlRef}>{result.ml.toLocaleString()}</span></p>
                          <p className="text-xs text-muted-foreground mt-0.5">millilitres</p>
                        </div>
                      </div>

                      {/* Glass icons */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {Math.min(result.glasses, 16)} glass{result.glasses !== 1 ? "es" : ""} shown
                          {result.glasses > 16 ? ` +${result.glasses - 16} more` : ""}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: Math.min(result.glasses, 16) }).map((_, i) => (
                            <div key={i} className="water-glass-icon w-6 h-8 rounded-b-md border-2 border-sky-300 dark:border-sky-600 bg-sky-100 dark:bg-sky-900/40 overflow-hidden relative">
                              <div className="absolute bottom-0 left-0 right-0 h-3 bg-sky-300/60 dark:bg-sky-600/60 rounded-b-sm" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-border bg-muted/10 flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                    <Droplets className="w-7 h-7 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Enter your weight</p>
                    <p className="text-xs text-muted-foreground mt-1">Your recommendation will appear here</p>
                  </div>
                </div>
              )}

              <Card size="sm">
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">Note: </span>
                    A general estimate. Coffee, tea, and food also contribute to daily hydration.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
