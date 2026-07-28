"use client"

import { useState, useEffect, useRef } from "react"
import { CalendarDays, PartyPopper, Clock, Hash, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import gsap from "gsap"

interface AgeResult {
  years: number; months: number; days: number
  totalDays: number; totalMonths: number; totalWeeks: number
  dayOfWeek: string; nextBirthdayDays: number; nextBirthdayDate: string
  isBirthdayToday: boolean
}

const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

function calcAge(dob: Date): AgeResult {
  const now = new Date(); now.setHours(0,0,0,0)
  let years = now.getFullYear() - dob.getFullYear()
  let months = now.getMonth() - dob.getMonth()
  let days = now.getDate() - dob.getDate()
  if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate() }
  if (months < 0) { years--; months += 12 }
  const totalDays = Math.floor((now.getTime() - dob.getTime()) / 86400000)
  const isBirthdayToday = dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate()
  let next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate())
  if (next <= now && !isBirthdayToday) next = new Date(now.getFullYear() + 1, dob.getMonth(), dob.getDate())
  if (isBirthdayToday) next = new Date(now.getFullYear() + 1, dob.getMonth(), dob.getDate())
  return {
    years, months, days, totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: years * 12 + months,
    dayOfWeek: WEEKDAYS[dob.getDay()],
    nextBirthdayDays: isBirthdayToday ? 365 : Math.ceil((next.getTime() - now.getTime()) / 86400000),
    nextBirthdayDate: next.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    isBirthdayToday,
  }
}

export default function AgeCalculator() {
  const [dob, setDob] = useState<Date | undefined>()
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<AgeResult | null>(null)
  const [calMonth, setCalMonth] = useState<Date>(new Date(2000, 0))
  const today = new Date()

  const resultRef = useRef<HTMLDivElement>(null)
  const yearsRef = useRef<HTMLSpanElement>(null)
  const monthsRef = useRef<HTMLSpanElement>(null)
  const daysRef = useRef<HTMLSpanElement>(null)
  const totalDaysRef = useRef<HTMLSpanElement>(null)
  const totalWeeksRef = useRef<HTMLSpanElement>(null)
  const totalMonthsRef = useRef<HTMLSpanElement>(null)

  const handleCalc = () => { if (dob) setResult(calcAge(dob)) }
  const handleReset = () => { setDob(undefined); setResult(null) }
  const handleSelect = (date: Date | undefined) => { setDob(date); setResult(null); if (date) setOpen(false) }
  const formattedDate = dob
    ? dob.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "Pick your date of birth"

  useEffect(() => {
    if (!result || !resultRef.current) return
    const ctx = gsap.context(() => {
      gsap.from(resultRef.current, { opacity: 0, y: 24, duration: 0.5, ease: "power3.out" })
      const animCount = (ref: React.RefObject<HTMLSpanElement | null>, target: number) => {
        const c = { val: 0 }
        gsap.to(c, { val: target, duration: 1.1, ease: "power2.out", delay: 0.15,
          onUpdate() { if (ref.current) ref.current.textContent = Math.round(c.val).toLocaleString() },
        })
      }
      animCount(yearsRef, result.years); animCount(monthsRef, result.months); animCount(daysRef, result.days)
      animCount(totalDaysRef, result.totalDays); animCount(totalWeeksRef, result.totalWeeks); animCount(totalMonthsRef, result.totalMonths)
      gsap.from(".age-stat-card", { opacity: 0, scale: 0.88, duration: 0.4, stagger: 0.07, ease: "back.out(1.5)", delay: 0.1 })
      gsap.from(".age-extra-row", { opacity: 0, x: -12, duration: 0.35, stagger: 0.08, ease: "power2.out", delay: 0.45 })
      gsap.from(".age-birthday-card", { opacity: 0, y: 16, duration: 0.4, ease: "power2.out", delay: 0.55 })
    })
    return () => ctx.revert()
  }, [result])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 pt-24 pb-12 sm:pt-28 sm:pb-16">
        <div className="mx-auto w-full max-w-[1400px]">

          <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-6 items-start">

            {/* Input card */}
            <Card className="md:sticky md:top-28">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl leading-none">Age Calculator</CardTitle>
                    <CardDescription className="mt-1">Date of Birth</CardDescription>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  Select your date of birth to calculate your exact age in detail
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Date of Birth</p>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`w-full justify-start gap-2 h-11 font-normal text-sm ${!dob ? "text-muted-foreground" : ""}`}>
                        <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                        {formattedDate}
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
                            {Array.from({ length: today.getFullYear() - 1900 + 1 }, (_, i) => today.getFullYear() - i).map((y) => (
                              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <CalendarPicker mode="single" selected={dob} onSelect={handleSelect}
                        month={calMonth} onMonthChange={setCalMonth} disabled={(d) => d > today} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleCalc} disabled={!dob} className="flex-1 h-11 font-semibold">Calculate Age</Button>
                  <Button variant="outline" onClick={handleReset} className="h-11 px-5">Reset</Button>
                </div>
              </CardContent>
            </Card>

            {/* Result column */}
            <div className="space-y-4 min-h-[300px]">
              {result ? (
                <div ref={resultRef} className="space-y-4">
                  {result.isBirthdayToday && (
                    <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                      <CardContent className="flex items-center gap-3 py-3.5 px-5">
                        <PartyPopper className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0" />
                        <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">Happy Birthday! 🎂 Today is your special day!</p>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Hero */}
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 px-6 pt-6 pb-5 border-b border-orange-100 dark:border-orange-800/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">You are</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-7xl font-black text-orange-600 dark:text-orange-400 leading-none">
                            <span ref={yearsRef}>{result.years}</span>
                          </span>
                          <span className="text-2xl font-semibold text-muted-foreground">years old</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Born on a <span className="font-semibold text-foreground">{result.dayOfWeek}</span>
                        </p>
                      </div>

                      <div className="px-6 py-5 space-y-4">
                        {/* Months + days remainder */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="age-stat-card rounded-xl border border-border bg-muted/20 p-4 text-center">
                            <p className="text-3xl font-bold text-foreground"><span ref={monthsRef}>{result.months}</span></p>
                            <p className="text-xs text-muted-foreground mt-1">months remaining</p>
                          </div>
                          <div className="age-stat-card rounded-xl border border-border bg-muted/20 p-4 text-center">
                            <p className="text-3xl font-bold text-foreground"><span ref={daysRef}>{result.days}</span></p>
                            <p className="text-xs text-muted-foreground mt-1">days remaining</p>
                          </div>
                        </div>

                        {/* Life stats */}
                        <div className="space-y-2">
                          {[
                            { ref: totalDaysRef, value: result.totalDays, label: "Total days lived", icon: <CalendarDays className="w-3.5 h-3.5" /> },
                            { ref: totalWeeksRef, value: result.totalWeeks, label: "Total weeks lived", icon: <Calendar className="w-3.5 h-3.5" /> },
                            { ref: totalMonthsRef, value: result.totalMonths, label: "Total months lived", icon: <Hash className="w-3.5 h-3.5" /> },
                          ].map(({ ref, value, label, icon }) => (
                            <div key={label} className="age-extra-row flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div>
                              <span className="text-sm font-bold text-foreground"><span ref={ref}>{value.toLocaleString()}</span></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Next birthday */}
                  <Card className="age-birthday-card border-orange-200 dark:border-orange-800/50">
                    <CardContent className="flex items-center justify-between py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                          <PartyPopper className="w-4.5 h-4.5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Next birthday</p>
                          <p className="text-sm font-semibold text-foreground">{result.nextBirthdayDate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-orange-600 dark:text-orange-400">{result.nextBirthdayDays}</p>
                        <p className="text-xs text-muted-foreground">days away</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="h-full min-h-[280px] rounded-2xl border-2 border-dashed border-border bg-muted/10 flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Clock className="w-7 h-7 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No result yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Select your date of birth and tap Calculate Age</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
