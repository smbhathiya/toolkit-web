"use client"

import { useState, useEffect, useRef } from "react"
import { Scale, ArrowDown, ArrowUp, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import gsap from "gsap"

type HeightUnit = "cm" | "ft"
type WeightUnit = "kg" | "lbs"

interface BMIResult {
  bmi: number
  category: string
  badgeClass: string
  heroBg: string
  heroText: string
  description: string
  position: number
  healthyWeightMin: number
  healthyWeightMax: number
  weightDifference: number | null
  weightAction: "gain" | "lose" | "maintain"
  unit: WeightUnit
}

function getCategory(bmi: number): Pick<BMIResult, "category" | "badgeClass" | "heroBg" | "heroText" | "description"> {
  if (bmi < 18.5) return {
    category: "Underweight",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    heroBg: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800",
    heroText: "text-blue-600 dark:text-blue-400",
    description: "You may need to gain some weight. Consider consulting a nutritionist.",
  }
  if (bmi < 25) return {
    category: "Normal weight",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    heroBg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800",
    heroText: "text-emerald-600 dark:text-emerald-400",
    description: "You have a healthy body weight! Keep up the great work.",
  }
  if (bmi < 30) return {
    category: "Overweight",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    heroBg: "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800",
    heroText: "text-amber-600 dark:text-amber-400",
    description: "A balanced diet and regular exercise can help you reach your goal.",
  }
  return {
    category: "Obese",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    heroBg: "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800",
    heroText: "text-red-600 dark:text-red-400",
    description: "Please consult a healthcare professional for personalized guidance.",
  }
}

function calcBMI(
  heightUnit: HeightUnit, weightUnit: WeightUnit,
  heightCm: string, heightFt: string, heightIn: string, weight: string
): BMIResult | null {
  const heightM = heightUnit === "cm"
    ? parseFloat(heightCm) / 100
    : (parseFloat(heightFt || "0") * 12 + parseFloat(heightIn || "0")) * 0.0254
  const weightKg = weightUnit === "kg" ? parseFloat(weight) : parseFloat(weight) * 0.453592
  if (!heightM || !weightKg || heightM <= 0 || weightKg <= 0) return null

  const bmi = weightKg / (heightM * heightM)
  const position = Math.min(Math.max(((bmi - 15) / 25) * 100, 2), 98)
  const minKg = 18.5 * heightM * heightM
  const maxKg = 24.9 * heightM * heightM
  let healthyWeightMin = minKg, healthyWeightMax = maxKg, currentWeightInUnit = weightKg

  if (weightUnit === "lbs") {
    healthyWeightMin = minKg / 0.453592
    healthyWeightMax = maxKg / 0.453592
    currentWeightInUnit = parseFloat(weight)
  }

  let weightAction: "gain" | "lose" | "maintain" = "maintain"
  let weightDifference: number | null = null
  if (bmi < 18.5) { weightAction = "gain"; weightDifference = healthyWeightMin - currentWeightInUnit }
  else if (bmi >= 25) { weightAction = "lose"; weightDifference = currentWeightInUnit - healthyWeightMax }

  return { bmi, position, healthyWeightMin, healthyWeightMax, weightDifference, weightAction, unit: weightUnit, ...getCategory(bmi) }
}

function UnitToggle<T extends string>({ value, options, onChange }: {
  value: T; options: { label: string; value: T }[]; onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-md bg-muted p-0.5 gap-0.5">
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`px-3 py-1 text-xs font-medium rounded transition-all ${
            value === opt.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function BMICalculator() {
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm")
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg")
  const [heightCm, setHeightCm] = useState("")
  const [heightFt, setHeightFt] = useState("")
  const [heightIn, setHeightIn] = useState("")
  const [weight, setWeight] = useState("")
  const [result, setResult] = useState<BMIResult | null>(null)

  const resultRef = useRef<HTMLDivElement>(null)
  const bmiValueRef = useRef<HTMLSpanElement>(null)
  const markerRef = useRef<HTMLDivElement>(null)

  const handleCalculate = () => setResult(calcBMI(heightUnit, weightUnit, heightCm, heightFt, heightIn, weight))
  const handleReset = () => { setHeightCm(""); setHeightFt(""); setHeightIn(""); setWeight(""); setResult(null) }

  useEffect(() => {
    if (!result || !resultRef.current) return
    const ctx = gsap.context(() => {
      gsap.from(resultRef.current, { opacity: 0, y: 24, duration: 0.5, ease: "power3.out" })
      const counter = { val: 0 }
      gsap.to(counter, {
        val: result.bmi, duration: 1.2, ease: "power2.out",
        onUpdate() { if (bmiValueRef.current) bmiValueRef.current.textContent = counter.val.toFixed(1) },
      })
      gsap.fromTo(markerRef.current, { left: "50%" }, { left: `${result.position}%`, duration: 1.3, ease: "power2.out", delay: 0.1 })
      gsap.from(".bmi-legend-item", { opacity: 0, y: 8, duration: 0.35, stagger: 0.07, ease: "power2.out", delay: 0.25 })
      gsap.from(".bmi-detail-row", { opacity: 0, x: -12, duration: 0.4, stagger: 0.1, ease: "power2.out", delay: 0.45 })
    })
    return () => ctx.revert()
  }, [result])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 pt-24 pb-12 sm:pt-28 sm:pb-16">
        <div className="mx-auto w-full max-w-[1400px]">

          {/* ── grid: 1 col mobile → 2 col md+ ── */}
          <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-6 items-start">

            {/* Input card — sticky on desktop */}
            <Card className="md:sticky md:top-28">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl leading-none">BMI Calculator</CardTitle>
                    <CardDescription className="mt-1">Body Mass Index</CardDescription>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  Enter your height and weight to calculate your BMI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Height */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Height</Label>
                    <UnitToggle
                      value={heightUnit}
                      options={[{ label: "cm", value: "cm" as HeightUnit }, { label: "ft & in", value: "ft" as HeightUnit }]}
                      onChange={(v) => { setHeightUnit(v); setResult(null) }}
                    />
                  </div>
                  {heightUnit === "cm" ? (
                    <Input type="number" placeholder="e.g. 175 cm" value={heightCm}
                      onChange={(e) => { setHeightCm(e.target.value); setResult(null) }}
                      className="h-11 text-base" min="1" />
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input type="number" placeholder="5" value={heightFt}
                          onChange={(e) => { setHeightFt(e.target.value); setResult(null) }}
                          className="h-11 pr-9 text-base" min="1" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ft</span>
                      </div>
                      <div className="relative flex-1">
                        <Input type="number" placeholder="9" value={heightIn}
                          onChange={(e) => { setHeightIn(e.target.value); setResult(null) }}
                          className="h-11 pr-9 text-base" min="0" max="11" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">in</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Weight */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Weight</Label>
                    <UnitToggle
                      value={weightUnit}
                      options={[{ label: "kg", value: "kg" as WeightUnit }, { label: "lbs", value: "lbs" as WeightUnit }]}
                      onChange={(v) => { setWeightUnit(v); setResult(null) }}
                    />
                  </div>
                  <div className="relative">
                    <Input type="number" placeholder={weightUnit === "kg" ? "e.g. 70 kg" : "e.g. 154 lbs"}
                      value={weight} onChange={(e) => { setWeight(e.target.value); setResult(null) }}
                      className="h-11 pr-14 text-base" min="1" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{weightUnit}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button onClick={handleCalculate} className="flex-1 h-11 text-sm font-semibold">
                    Calculate BMI
                  </Button>
                  <Button variant="outline" onClick={handleReset} className="h-11 px-5">
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Result column */}
            <div className="space-y-4 min-h-[300px]">
              {result ? (
                <div ref={resultRef}>
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Hero */}
                      <div className={`px-6 pt-6 pb-5 border-b ${result.heroBg}`}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                          Your BMI Score
                        </p>
                        <div className="flex items-end gap-4 justify-between">
                          <div>
                            <p className={`text-8xl font-black tracking-tight leading-none ${result.heroText}`}>
                              <span ref={bmiValueRef}>{result.bmi.toFixed(1)}</span>
                            </p>
                            <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-sm font-semibold ${result.badgeClass}`}>
                              {result.weightAction === "maintain" && <Minus className="w-3.5 h-3.5" />}
                              {result.weightAction === "lose" && <ArrowDown className="w-3.5 h-3.5" />}
                              {result.weightAction === "gain" && <ArrowUp className="w-3.5 h-3.5" />}
                              {result.category}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground max-w-[180px] text-right leading-relaxed">
                            {result.description}
                          </p>
                        </div>
                      </div>

                      <div className="px-6 py-5 space-y-5">
                        {/* Gauge bar */}
                        <div className="space-y-2.5">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">BMI Scale</p>
                          <div className="relative h-5 rounded-full overflow-visible">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-emerald-400 via-[40%] via-amber-400 via-[60%] to-red-400" />
                            <div
                              ref={markerRef}
                              className="absolute w-8 h-8 rounded-full bg-background border-[3px] border-foreground/70 shadow-xl z-10"
                              style={{ left: `${result.position}%`, top: "50%", transform: "translate(-50%, -50%)" }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
                            <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 mt-1">
                            {[
                              { label: "Underweight", color: "bg-blue-400" },
                              { label: "Normal", color: "bg-emerald-400" },
                              { label: "Overweight", color: "bg-amber-400" },
                              { label: "Obese", color: "bg-red-400" },
                            ].map(({ label, color }) => (
                              <div key={label} className="bmi-legend-item flex flex-col items-center gap-1.5">
                                <div className={`h-1.5 w-full rounded-full ${color}`} />
                                <span className="text-xs text-muted-foreground text-center">{label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="rounded-xl border border-border bg-muted/30 divide-y divide-border/60">
                          <div className="bmi-detail-row flex justify-between items-center px-4 py-3">
                            <span className="text-sm text-muted-foreground">Healthy weight range</span>
                            <span className="text-sm font-semibold text-foreground">
                              {result.healthyWeightMin.toFixed(1)} – {result.healthyWeightMax.toFixed(1)} {result.unit}
                            </span>
                          </div>
                          {result.weightAction === "maintain" ? (
                            <div className="bmi-detail-row flex items-center gap-2.5 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                              <Minus className="w-4 h-4 shrink-0" />
                              You&apos;re within your healthy weight range!
                            </div>
                          ) : (
                            <div className="bmi-detail-row flex justify-between items-center px-4 py-3">
                              <span className="text-sm text-muted-foreground">Recommended goal</span>
                              <span className={`text-sm font-bold ${result.weightAction === "lose" ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"}`}>
                                {result.weightAction === "lose" ? "Lose" : "Gain"} ~{result.weightDifference?.toFixed(1)} {result.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="h-full min-h-[280px] rounded-2xl border-2 border-dashed border-border bg-muted/10 flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Scale className="w-7 h-7 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No result yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Enter your height and weight, then tap Calculate BMI</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Card size="sm" className="mt-6">
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Note: </span>
                BMI is a screening tool, not a diagnostic measure. For personalized health advice, consult a healthcare professional.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
