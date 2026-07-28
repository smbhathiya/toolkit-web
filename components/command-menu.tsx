"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Command, ArrowRight, Sparkles } from "lucide-react"
import { ALL_TOOLS, TOOL_CATEGORIES, ToolItem } from "@/lib/tools-registry"

interface CommandMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          // Open
          setQuery("")
          setSelectedIndex(0)
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  const filteredTools = ALL_TOOLS.filter(
    (tool) =>
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.description.toLowerCase().includes(query.toLowerCase()) ||
      tool.category.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = (tool: ToolItem) => {
    router.push(tool.href)
    onClose()
  }

  const handleKeyDownInDialog = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredTools.length))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % Math.max(1, filteredTools.length))
    } else if (e.key === "Enter" && filteredTools[selectedIndex]) {
      e.preventDefault()
      handleSelect(filteredTools[selectedIndex])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-background/80 backdrop-blur-md transition-all">
      {/* Overlay click to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div
        onKeyDown={handleKeyDownInDialog}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl transition-all dark:shadow-slate-900/50 flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Search Bar Header */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5 bg-muted/20">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search tools (e.g., Merge PDF, Compress, QR)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border/80 bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-border/20">
          {filteredTools.length > 0 ? (
            filteredTools.map((tool, idx) => {
              const Icon = tool.icon
              const isSelected = idx === selectedIndex
              const catLabel = TOOL_CATEGORIES[tool.category]?.label || tool.category

              return (
                <div
                  key={tool.id}
                  onClick={() => handleSelect(tool)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-4 p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 dark:bg-rose-500/20"
                      : "hover:bg-muted/60 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${tool.iconWrapperClass}`}
                    >
                      <Icon className={`w-4 h-4 ${tool.iconClass}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{tool.name}</span>
                        {tool.isPopular && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            POPULAR
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40">
                      {catLabel}
                    </span>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? "translate-x-1 opacity-100" : "opacity-0"
                      }`}
                    />
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-12 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">No tools found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-muted-foreground/60">Try searching for PDF, Merge, Convert, or Base64</p>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="border-t border-border/60 px-4 py-2.5 bg-muted/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border/80 bg-background font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-border/80 bg-background font-mono">↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border/80 bg-background font-mono">↵</kbd> Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" /> OmniTool Quick Command Palette
          </span>
        </div>
      </div>
    </div>
  )
}
