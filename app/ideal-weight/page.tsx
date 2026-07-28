"use client"

import { useState, useEffect, useRef } from "react"
import { Ruler, User, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import gsap from "gsap"

type HeightUnit = "cm" | "ft"
type Gender = "male" | "female"

interface WeightResult {
  devine: number; robinson: number; miller: number
  bmiMin: number; bmiMax: number; average: number
}

function calcIdeal(heightCm: number, gender: Gender): WeightResult {
  const h = heightCm / 2.54 - 60
  const devine   = gender === "male" ? 50   + 2.3  * h : 45.5 + 2.3  * h
  const robinson = gender === "male" ? 52   + 1.9  * h : 49   + 1.7  * h
  const miller   = gender === "male" ? 56.2 + 1.41 * h : 53.1 + 1.36 * h
  const hM = heightCm / 100
  const average = Math.round(((devine + robinson + miller) / 3) * 10) / 10
  return {
    devine:   Math.round(devine   * 10) / 10,
    robinson: Math.round(robinson * 10) / 10,
    miller:   Math.round(miller   * 10) / 10,
    bmiMin: Math.round(18.5 * hM * hM * 10) / 10,
    bmiMax: Math.round(24.9 * hM * hM * 10) / 10,
    average,
  }
}

const FORMULAS = [
  { key: "devine"   as const, label: "Devine",   barColor: "bg-blue-400",   textColor: "text-blue-600 dark:text-blue-400",   desc: "Classic clinical formula" },
  { key: "robinson" as const, label: "Robinson", barColor: "bg-purple-400", textColor: "text-purple-600 dark:text-purple-400", desc: "Revised Peterson formula" },
  { key: "miller"   as const, label: "Miller",   barColor: "bg-teal-400",   textColor: "text-teal-600 dark:text-teal-400",   desc: "Conservative estimate" },
]

export default function IdealWeight() {
  const [unit, setUnit] = useState<HeightUnit>("cm")
  const [heightCm, setHeightCm] = useState("")
  const [heightFt, setHeightFt] = useState("")
  const [heightIn, setHeightIn] = useState("")
  const [gender, setGender] = useState<Gender>("male")

  const resolvedCm = unit === "cm"
    ? parseFloat(heightCm)
    : parseFloat(heightFt || "0") * 30.48 + parseFloat(heightIn || "0") * 2.54

  const valid = resolvedCm >= 100 && resolvedCm <= 250
  const result = valid ? calcIdeal(resolvedCm, gender) : null

  const avgRef = useRef<HTMLSpanElement>(null)
  const avgLbsRef = useRef<HTMLSpanElement>(null)
  const barRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)]
  const valRefs = [useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null)]
  const prevResultRef = useRef<typeof result>(null)
  const hasShownRef = useRef(false)

  useEffect(() => {
    if (!result) { hasShownRef.current = false; prevResultRef.current = null; return }
    const isFirstShow = !hasShownRef.current
    hasShownRef.current = true
    const prev = prevResultRef.current
    const maxVal = Math.max(result.devine, result.robinson, result.miller)

    const ctx = gsap.context(() => {
      if (isFirstShow) gsap.from(".ideal-result-panel", { opacity: 0, x: 30, duration: 0.5, ease: "power3.out" })

      const cAvg = { val: prev?.average ?? 0 }
      gsap.to(cAvg, { val: result.average, duration: 0.8, ease: "power2.out",
        onUpdate() {
          if (avgRef.current) avgRef.current.textContent = cAvg.val.toFixed(1)
          if (avgLbsRef.current) avgLbsRef.current.textContent = Math.round(cAvg.val * 2.20462).toString()
        }})

      FORMULAS.forEach(({ key }, i) => {
        gsap.fromTo(barRefs[i].current,
          { width: `${isFirstShow ? 0 : (prev ? (prev[key] / maxVal) * 100 : 0)}%` },
          { width: `${(result[key] / maxVal) * 100}%`, duration: 0.8, ease: "power2.out", delay: i * 0.08 })
        const cv = { val: prev?.[key] ?? 0 }
        gsap.to(cv, { val: result[key], duration: 0.8, ease: "power2.out", delay: i * 0.08,
          onUpdate() { if (valRefs[i].current) valRefs[i].current.textContent = cv.val.toFixed(1) }})
      })

      if (isFirstShow) gsap.from(".ideal-bmi-row", { opacity: 0, y: 10, duration: 0.4, ease: "power2.out", delay: 0.5 })
    })
    prevResultRef.current = result
    return () => ctx.revert()
  }, [result, barRefs, valRefs])

  const maxVal = result ? Math.max(result.devine, result.robinson, result.miller) : 1

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 pt-24 pb-12 sm:pt-28 sm:pb-16">
        <div className="mx-auto w-full max-w-[1400px]">

          <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-6 items-start">

            {/* Input card — sticky */}
            <Card className="md:sticky md:top-28">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                    <Ruler className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl leading-none">Ideal Weight</CardTitle>
                    <CardDescription className="mt-1">Healthy Weight Calculator</CardDescription>
                  </div>
                </div>
                <CardDescription className="mt-2 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Results update instantly as you enter your details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Gender */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Biological Sex</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["male","female"] as Gender[]).map((g) => (
                      <button key={g} onClick={() => setGender(g)}
                        className={`flex items-center justify-center gap-2.5 rounded-xl border py-3.5 text-sm font-medium capitalize transition-all ${
                          gender === g
                            ? "border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 text-foreground shadow-sm"
                            : "border-border hover:border-teal-200 dark:hover:border-teal-800 hover:bg-muted/40 text-muted-foreground"
                        }`}>
                        <User className="w-4 h-4" />{g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Height */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Height</Label>
                    <div className="flex rounded-md bg-muted p-0.5 gap-0.5">
                      {(["cm","ft"] as HeightUnit[]).map((u) => (
                        <button key={u} onClick={() => { setUnit(u); setHeightCm(""); setHeightFt(""); setHeightIn("") }}
                          className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                            unit === u ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                          }`}>{u === "ft" ? "ft & in" : "cm"}</button>
                      ))}
                    </div>
                  </div>
                  {unit === "cm" ? (
                    <Input type="number" placeholder="e.g. 175 cm" value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)} className="h-11 text-base" min="100" max="250" />
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input type="number" placeholder="5" value={heightFt}
                          onChange={(e) => setHeightFt(e.target.value)} className="h-11 pr-9 text-base" min="3" max="8" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ft</span>
                      </div>
                      <div className="relative flex-1">
                        <Input type="number" placeholder="9" value={heightIn}
                          onChange={(e) => setHeightIn(e.target.value)} className="h-11 pr-9 text-base" min="0" max="11" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">in</span>
                      </div>
                    </div>
                  )}
                  {!valid && (heightCm || heightFt) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Valid range: 100–250 cm (3&apos;3&quot; – 8&apos;2&quot;)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Result column */}
            <div className="space-y-4 min-h-[300px]">
              {result ? (
                <Card className="ideal-result-panel overflow-hidden">
                  <CardContent className="p-0">
                    {/* Hero */}
                    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 px-6 pt-6 pb-5 border-b border-teal-100 dark:border-teal-800/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Average ideal weight</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-7xl font-black text-teal-700 dark:text-teal-300 leading-none">
                          <span ref={avgRef}>{result.average}</span>
                        </span>
                        <span className="text-2xl font-semibold text-muted-foreground">kg</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        ≈ <span ref={avgLbsRef} className="font-semibold text-foreground">{Math.round(result.average * 2.20462)}</span> lbs
                      </p>
                    </div>

                    <div className="px-6 py-5 space-y-5">
                      {/* Formula bars */}
                      <div className="space-y-4">
                        {FORMULAS.map(({ key, label, barColor, textColor, desc }, i) => (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div>
                                <span className="font-semibold text-foreground">{label}</span>
                                <span className="text-xs text-muted-foreground ml-2">{desc}</span>
                              </div>
                              <span className={`font-bold tabular-nums ${textColor}`}>
                                <span ref={valRefs[i]}>{result[key]}</span> kg
                                <span className="text-xs font-normal text-muted-foreground ml-1.5">
                                  ({Math.round(result[key] * 2.20462)} lbs)
                                </span>
                              </span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                              <div ref={barRefs[i]} className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${(result[key] / maxVal) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* BMI range */}
                      <div className="ideal-bmi-row rounded-xl border border-border bg-muted/30 px-4 py-3.5">
                        <p className="text-xs text-muted-foreground mb-1.5">Healthy BMI range (18.5 – 24.9)</p>
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-foreground">{result.bmiMin} – {result.bmiMax} kg</span>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(result.bmiMin * 2.205)}–{Math.round(result.bmiMax * 2.205)} lbs
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full min-h-[280px] rounded-2xl border-2 border-dashed border-border bg-muted/10 flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <Ruler className="w-7 h-7 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No result yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Enter a valid height above to see your ideal weight range</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Card size="sm" className="mt-6">
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Note: </span>
                These formulas estimate ideal weight for average adults. They do not account for muscle mass, bone density, or ethnicity. Consult a doctor for personalized guidance.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
