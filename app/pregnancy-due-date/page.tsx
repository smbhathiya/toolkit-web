"use client"

import { useState, useEffect, useRef } from "react"
import { Baby, CalendarDays, CheckCircle2, Circle, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import gsap from "gsap"

interface PregnancyResult {
  eddFormatted: string; weeksPregnant: number; daysIntoWeek: number
  daysPregnant: number; daysRemaining: number; trimester: 1 | 2 | 3
  progressPercent: number; milestones: { week: number; label: string; passed: boolean }[]
}

const MILESTONES = [
  { week: 6,  label: "Heartbeat detectable" },
  { week: 10, label: "Nuchal translucency scan" },
  { week: 13, label: "End of first trimester" },
  { week: 18, label: "Anatomy scan" },
  { week: 24, label: "Viability milestone" },
  { week: 27, label: "End of second trimester" },
  { week: 36, label: "Baby is full-term soon" },
  { week: 40, label: "Due date" },
]

const TRIMESTER_INFO = {
  1: { label: "First Trimester",  badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",   color: "#f472b6" },
  2: { label: "Second Trimester", badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", color: "#a78bfa" },
  3: { label: "Third Trimester",  badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",   color: "#fb7185" },
}

function calcPregnancy(lmp: Date): PregnancyResult {
  const today = new Date(); today.setHours(0,0,0,0)
  const lmpClean = new Date(lmp); lmpClean.setHours(0,0,0,0)
  const edd = new Date(lmpClean); edd.setDate(edd.getDate() + 280)
  const daysPregnant = Math.floor((today.getTime() - lmpClean.getTime()) / 86400000)
  const weeksPregnant = Math.floor(daysPregnant / 7)
  return {
    eddFormatted: edd.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    weeksPregnant, daysIntoWeek: daysPregnant % 7,
    daysPregnant,
    daysRemaining: Math.max(0, Math.ceil((edd.getTime() - today.getTime()) / 86400000)),
    progressPercent: Math.min(100, Math.round((daysPregnant / 280) * 100)),
    trimester: weeksPregnant <= 12 ? 1 : weeksPregnant <= 26 ? 2 : 3,
    milestones: MILESTONES.map((m) => ({ ...m, passed: weeksPregnant >= m.week })),
  }
}

const CIRC = 2 * Math.PI * 42

export default function PregnancyDueDate() {
  const [lmp, setLmp] = useState<Date | undefined>()
  const [open, setOpen] = useState(false)
  const [calMonth, setCalMonth] = useState<Date>(new Date())
  const today = new Date()
  const result = lmp && lmp < today ? calcPregnancy(lmp) : null
  const formattedLmp = lmp
    ? lmp.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "Select last menstrual period date"

  const arcRef = useRef<SVGCircleElement>(null)
  const weeksRef = useRef<HTMLSpanElement>(null)
  const daysRef = useRef<HTMLSpanElement>(null)
  const remainingRef = useRef<HTMLSpanElement>(null)
  const pctRef = useRef<HTMLSpanElement>(null)

  const handleSelect = (date: Date | undefined) => { setLmp(date); if (date) setOpen(false) }

  useEffect(() => {
    if (!result) return
    const ctx = gsap.context(() => {
      gsap.from(".preg-result-col", { opacity: 0, x: 30, duration: 0.5, ease: "power3.out" })
      gsap.fromTo(arcRef.current,
        { strokeDashoffset: CIRC },
        { strokeDashoffset: CIRC * (1 - result.progressPercent / 100), duration: 1.5, ease: "power2.out", delay: 0.2 })
      const animC = (ref: React.RefObject<HTMLSpanElement | null>, target: number, dur = 1.0) => {
        const c = { val: 0 }
        gsap.to(c, { val: target, duration: dur, ease: "power2.out", delay: 0.2,
          onUpdate() { if (ref.current) ref.current.textContent = Math.round(c.val).toString() } })
      }
      animC(weeksRef, result.weeksPregnant)
      animC(daysRef, result.daysPregnant)
      animC(remainingRef, result.daysRemaining)
      animC(pctRef, result.progressPercent, 1.5)
      gsap.from(".milestone-item", { opacity: 0, x: -16, duration: 0.35, stagger: 0.06, ease: "power2.out", delay: 0.5 })
    })
    return () => ctx.revert()
  }, [result])

  const tInfo = result ? TRIMESTER_INFO[result.trimester] : null
  const arcColor = tInfo?.color ?? "#f472b6"

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 pt-24 pb-12 sm:pt-28 sm:pb-16">
        <div className="mx-auto w-full max-w-[1400px]">

          <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6 items-start">

            {/* Input card — sticky */}
            <Card className="md:sticky md:top-28">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center shrink-0">
                    <Baby className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl leading-none">Pregnancy Due Date</CardTitle>
                    <CardDescription className="mt-1">Estimated Delivery Date</CardDescription>
                  </div>
                </div>
                <CardDescription className="mt-2 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Based on Naegele&apos;s rule — LMP + 280 days
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Last Menstrual Period (LMP)</p>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`w-full justify-start gap-2 h-11 font-normal text-sm ${!lmp ? "text-muted-foreground" : ""}`}>
                        <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                        {formattedLmp}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                        <Select
                          value={String(calMonth.getMonth())}
                          onValueChange={(v) => setCalMonth(new Date(calMonth.getFullYear(), Number(v)))}
                        >
                          <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                              <SelectItem key={m} value={String(i)}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={String(calMonth.getFullYear())}
                          onValueChange={(v) => setCalMonth(new Date(Number(v), calMonth.getMonth()))}
                        >
                          <SelectTrigger className="h-8 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-52">
                            {Array.from({ length: 3 }, (_, i) => today.getFullYear() - i).map((y) => (
                              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Calendar mode="single" selected={lmp} onSelect={handleSelect}
                        month={calMonth} onMonthChange={setCalMonth} disabled={(d) => d >= today} />
                    </PopoverContent>
                  </Popover>
                  {lmp && !result && <p className="text-xs text-destructive flex items-center gap-1"><Info className="w-3 h-3" /> Please select a date before today.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Result column */}
            <div className="space-y-4 min-h-[300px]">
              {result && tInfo ? (
                <div className="preg-result-col space-y-4">
                  {/* Due date card */}
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 px-6 pt-6 pb-5 border-b border-pink-100 dark:border-pink-800/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Estimated due date</p>
                        <p className="text-xl font-bold text-foreground leading-snug">{result.eddFormatted}</p>
                        <div className="mt-3">
                          <Badge variant="outline" className={`border-transparent text-xs font-semibold px-3 py-1 ${tInfo.badge}`}>
                            {tInfo.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="px-6 py-5 space-y-5">
                        {/* Circular ring + stats */}
                        <div className="flex items-center gap-6">
                          {/* SVG ring */}
                          <div className="shrink-0 relative">
                            <svg width="100" height="100" viewBox="0 0 96 96" className="-rotate-90">
                              <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="9" className="text-muted/40" />
                              <circle ref={arcRef} cx="48" cy="48" r="42" fill="none"
                                stroke={arcColor} strokeWidth="9" strokeLinecap="round"
                                strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - result.progressPercent / 100)} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span ref={pctRef} className="text-xl font-black leading-none">{result.progressPercent}</span>
                              <span className="text-[10px] text-muted-foreground">% done</span>
                            </div>
                          </div>

                          {/* Stat rows */}
                          <div className="flex-1 space-y-2">
                            {[
                              { label: "Current week",   ref: weeksRef,    v: result.weeksPregnant, sub: `+${result.daysIntoWeek}d` },
                              { label: "Days pregnant",  ref: daysRef,     v: result.daysPregnant,  sub: "" },
                              { label: "Days remaining", ref: remainingRef, v: result.daysRemaining, sub: "" },
                            ].map(({ label, ref, v, sub }) => (
                              <div key={label} className="flex items-center justify-between rounded-lg bg-muted/30 px-3.5 py-2.5">
                                <span className="text-xs text-muted-foreground">{label}</span>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-sm font-bold text-foreground"><span ref={ref}>{v}</span></span>
                                  {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Week 1</span><span>Week 40</span>
                          </div>
                          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full transition-none" style={{ width: `${result.progressPercent}%`, backgroundColor: arcColor }} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Milestones */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Key Milestones
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-1.5">
                      {result.milestones.map((m) => (
                        <div key={m.week} className={`milestone-item flex items-center justify-between rounded-xl px-4 py-3 border transition-colors ${
                          m.passed ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/15" : "border-border bg-muted/20"
                        }`}>
                          <div className="flex items-center gap-3">
                            {m.passed
                              ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                              : <Circle className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
                            <span className={`text-sm ${m.passed ? "text-foreground font-medium" : "text-muted-foreground"}`}>{m.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">Wk {m.week}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="h-full min-h-[280px] rounded-2xl border-2 border-dashed border-border bg-muted/10 flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                    <Baby className="w-7 h-7 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No result yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Select your LMP date to track your pregnancy</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Card size="sm" className="mt-6">
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Note: </span>
                Based on Naegele&apos;s rule (LMP + 280 days). Actual delivery date may vary. Always follow your doctor&apos;s guidance.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
