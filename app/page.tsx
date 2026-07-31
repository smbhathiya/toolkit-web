"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Search,
  Star,
  ShieldCheck,
  Sparkles,
  Grid,
  List,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ALL_TOOLS, TOOL_CATEGORIES } from "@/lib/tools-registry"

export default function Home() {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const savedFavs = localStorage.getItem("utilbee_fav_tools")
      return savedFavs ? JSON.parse(savedFavs) : []
    } catch {
      return []
    }
  })

  const toggleFavorite = (e: React.MouseEvent, toolId: string) => {
    e.preventDefault()
    e.stopPropagation()

    setFavorites((prev) => {
      const updated = prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
      try {
        localStorage.setItem("utilbee_fav_tools", JSON.stringify(updated))
      } catch (err) {
        console.error("Failed to save favorites", err)
      }
      return updated
    })
  }

  const filteredTools = ALL_TOOLS.filter((tool) => {
    const matchesQuery =
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.description.toLowerCase().includes(query.toLowerCase())

    if (!matchesQuery) return false

    if (activeCategory === "all") return true
    if (activeCategory === "favorites") return favorites.includes(tool.id)
    return tool.category === activeCategory
  })

  const categoriesToRender =
    activeCategory === "all"
      ? Object.keys(TOOL_CATEGORIES).map((catId) => ({
          catId,
          catMeta: TOOL_CATEGORIES[catId],
          tools: filteredTools.filter((t) => t.category === catId),
        })).filter((cat) => cat.tools.length > 0)
      : [
          {
            catId: activeCategory,
            catMeta:
              activeCategory === "favorites"
                ? { label: "Your Favorite Tools", icon: Star, description: "Quick access to your bookmarked tools." }
                : TOOL_CATEGORIES[activeCategory],
            tools: filteredTools,
          },
        ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-28 pb-4 sm:pt-24 sm:pb-6 bg-background">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 relative text-center">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
            UtilBEE <br />
            <span className="text-rose-600 dark:text-rose-500">
              Your Everyday Toolkit
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Fast, privacy-focused PDF & developer tools directly in your browser. Zero server uploads, no file limits, 100% free.
          </p>
        </div>
      </section>

      {/* Main Tools Container */}
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 sm:py-14">
        {/* Search & Category Tabs */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-md text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === "all"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              All Tools ({ALL_TOOLS.length})
            </button>

            {favorites.length > 0 && (
              <button
                onClick={() => setActiveCategory("favorites")}
                className={`flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-md text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === "favorites"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                }`}
              >
                <Star className="w-4 h-4 fill-amber-500" />
                <span>Favorites ({favorites.length})</span>
              </button>
            )}

            {Object.entries(TOOL_CATEGORIES).map(([catKey, cat]) => {
              const count = ALL_TOOLS.filter((t) => t.category === catKey).length
              return (
                <button
                  key={catKey}
                  onClick={() => setActiveCategory(catKey)}
                  className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-md text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === catKey
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {cat.label} ({count})
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex-1 md:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tools..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 pl-9 text-xs sm:text-sm rounded-xl"
              />
            </div>

            <div className="hidden sm:flex items-center rounded-xl border border-border/80 bg-muted/40 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "grid" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "list" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Compact List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tools Display */}
        {categoriesToRender.length > 0 ? (
          <div className="space-y-12">
            {categoriesToRender.map(({ catId, catMeta, tools }) => (
              <section key={catId} className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-3">
                    {catMeta?.icon && (
                      <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        <catMeta.icon className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                        {catMeta?.label}
                      </h2>
                      {catMeta?.description && (
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          {catMeta.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    {tools.length} {tools.length === 1 ? "tool" : "tools"}
                  </Badge>
                </div>

                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {tools.map((tool) => {
                      const Icon = tool.icon
                      const isFav = favorites.includes(tool.id)

                      return (
                        <Link
                          key={tool.id}
                          href={tool.href}
                          className="group relative"
                        >
                          <Card className="h-full rounded-md border border-border bg-card hover:border-rose-500/40 hover:shadow-xs transition-all">
                            <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
                              <div className="flex items-start justify-between gap-3">
                                <div
                                  className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${tool.iconWrapperClass}`}
                                >
                                  <Icon className={`w-5 h-5 ${tool.iconClass}`} />
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {tool.badgeText && (
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                      {tool.badgeText}
                                    </span>
                                  )}
                                  {tool.isPopular && !tool.badgeText && (
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      POPULAR
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => toggleFavorite(e, tool.id)}
                                    title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-amber-500 transition-colors"
                                  >
                                    <Star
                                      className={`w-4 h-4 ${
                                        isFav ? "fill-amber-500 text-amber-500" : "opacity-40 hover:opacity-100"
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-sm font-bold text-foreground group-hover:text-rose-500 transition-colors">
                                    {tool.name}
                                  </h3>
                                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                  {tool.description}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tools.map((tool) => {
                      const Icon = tool.icon
                      const isFav = favorites.includes(tool.id)

                      return (
                        <Link
                          key={tool.id}
                          href={tool.href}
                          className="group flex items-center justify-between p-3.5 rounded-md border border-border bg-card hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${tool.iconWrapperClass}`}
                            >
                              <Icon className={`w-5 h-5 ${tool.iconClass}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-foreground group-hover:text-rose-500 transition-colors truncate">
                                {tool.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => toggleFavorite(e, tool.id)}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-amber-500 transition-colors"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  isFav ? "fill-amber-500 text-amber-500" : "opacity-40"
                                }`}
                              />
                            </button>
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-500 transition-colors" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-base font-semibold text-foreground">No tools match &ldquo;{query}&rdquo;</p>
            <p className="text-xs text-muted-foreground">Try clearing filters or search terms</p>
          </div>
        )}

        {/* Why Client-Side PDF Architecture is Superior */}
        <section className="mt-16 sm:mt-24 p-6 sm:p-10 rounded-lg border border-border bg-card shadow-xs relative overflow-hidden">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy & Speed Advantage</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Why In-Browser PDF Processing is Superior
            </h2>

            <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
              Traditional online PDF converters require you to upload private contracts, financial statements, and sensitive documents to third-party cloud servers. OmniTool operates 100% locally inside your web browser using high-performance WebAssembly and JavaScript engines.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">100% Client-Side Privacy</h4>
                  <p className="text-xs text-muted-foreground">Files never leave your device. Zero upload risk.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">No File Size Limits</h4>
                  <p className="text-xs text-muted-foreground">Process gigabyte-sized PDFs at native disk speed.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">Zero Waiting Queues</h4>
                  <p className="text-xs text-muted-foreground">Instant execution without waiting for server downloads.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">All Tools Unlocked</h4>
                  <p className="text-xs text-muted-foreground">No daily usage caps, watermarks, or paywalls.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
