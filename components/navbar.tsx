"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ChevronDown,
  Menu,
  X,
  ArrowUpRight,
  Sparkles,
} from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TOOL_CATEGORIES, ALL_TOOLS, ToolItem } from "@/lib/tools-registry"

export function Navbar() {
  const [isVisible, setIsVisible] = useState(true)
  const [activeOpenCategory, setActiveOpenCategory] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const delta = currentScrollY - lastScrollY

      if (Math.abs(delta) > 5) {
        if (currentScrollY < 20) {
          setIsVisible(true)
        } else if (delta > 0) {
          setIsVisible(false)
          setActiveOpenCategory(null)
          setIsMobileMenuOpen(false)
        } else {
          setIsVisible(true)
        }
      }
      lastScrollY = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 w-full glass-nav transition-all duration-300 ${
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          {/* Left Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <Image
              src="/logo.svg"
              alt="OmniTool Logo"
              width={30}
              height={30}
              className="shrink-0 group-hover:scale-105 transition-transform duration-200"
            />
            <span className="text-base font-black tracking-tight text-rose-600 dark:text-rose-500">
              OmniTool
            </span>
          </Link>

          {/* Center Category Navigation */}
          <nav className="hidden md:flex items-center justify-center gap-1 flex-1 mx-4">
            {Object.entries(TOOL_CATEGORIES).map(([catKey, cat]) => {
              const categoryTools = ALL_TOOLS.filter((t) => t.category === catKey)
              const isOpen = activeOpenCategory === catKey
              const Icon = cat.icon

              return (
                <div
                  key={catKey}
                  className="relative"
                  onMouseEnter={() => setActiveOpenCategory(catKey)}
                  onMouseLeave={() => setActiveOpenCategory(null)}
                >
                  <button
                    onClick={() => setActiveOpenCategory(isOpen ? null : catKey)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-md transition-colors cursor-pointer ${
                      isOpen
                        ? "bg-muted text-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{cat.label}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 opacity-60 shrink-0 ${
                        isOpen ? "rotate-180 opacity-100" : ""
                      }`}
                    />
                  </button>

                  {/* Mega Dropdown Panel */}
                  {isOpen && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-1.5 w-[480px] sm:w-[560px] md:w-[600px] animate-in fade-in zoom-in-95 duration-150 z-50">
                      <div className="rounded-lg border border-border bg-popover text-popover-foreground p-4 shadow-xl">
                          {/* Mega Panel Header */}
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded bg-rose-500/10 text-rose-500">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                                  {cat.label}
                                </h3>
                                <p className="text-[11px] text-muted-foreground">
                                  {cat.description}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                              {categoryTools.length} {categoryTools.length === 1 ? "Tool" : "Tools"}
                            </span>
                          </div>

                          {/* Multi-Column Grid of Tools */}
                          <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
                            {categoryTools.map((tool) => {
                              const ToolIcon = tool.icon
                              return (
                                <Link
                                  key={tool.id}
                                  href={tool.href}
                                  onClick={() => setActiveOpenCategory(null)}
                                  className="group/item flex items-start gap-3 p-2.5 rounded-md bg-card hover:bg-muted border border-border/60 hover:border-rose-500/40 transition-colors"
                                >
                                  <div
                                    className={`w-8 h-8 rounded flex items-center justify-center shrink-0 border ${tool.iconWrapperClass}`}
                                  >
                                    <ToolIcon className={`w-4 h-4 ${tool.iconClass}`} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <p className="text-xs font-bold text-foreground group-hover/item:text-rose-500 transition-colors truncate">
                                        {tool.name}
                                      </p>
                                      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 group-hover/item:text-rose-500 transition-all shrink-0" />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                                      {tool.description}
                                    </p>
                                  </div>
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <ModeToggle />

            {/* Mobile Menu Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/60 bg-card p-4 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Browse Tools by Category
              </span>
              <Badge variant="outline" className="text-[10px]">
                {ALL_TOOLS.length} Available
              </Badge>
            </div>

            <div className="space-y-4">
              {Object.entries(TOOL_CATEGORIES).map(([catKey, cat]) => {
                const catTools = ALL_TOOLS.filter((t) => t.category === catKey)
                const Icon = cat.icon
                return (
                  <div key={catKey} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <Icon className="w-4 h-4 text-rose-500" />
                      <span>{cat.label}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1 pl-2 border-l-2 border-border/60">
                      {catTools.map((t) => (
                        <Link
                          key={t.id}
                          href={t.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center justify-between py-1.5 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        >
                          <span>{t.name}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </header>
    </>
  )
}
