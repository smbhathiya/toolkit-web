"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

const emptySubscribe = () => () => {}

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-xl border border-border bg-background/50 hover:bg-muted dark:hover:bg-muted/50 shrink-0"
        disabled
        aria-label="Toggle theme"
      >
        <span className="h-4 w-4 shrink-0" />
      </Button>
    )
  }

  // Fallback to system preference if theme is system
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative rounded-xl border border-border bg-background/50 hover:bg-muted dark:hover:bg-muted/50 transition-all duration-300 active:scale-95 shrink-0 cursor-pointer"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0  shrink-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100  shrink-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
