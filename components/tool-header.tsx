"use client"

import Link from "next/link"
import { ArrowLeft, ShieldCheck, LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ToolHeaderProps {
  title: string
  description: string
  icon: LucideIcon
  iconClass?: string
  iconWrapperClass?: string
  categoryName?: string
  badgeText?: string
}

export function ToolHeader({
  title,
  description,
  icon: Icon,
  iconClass = "text-rose-500",
  iconWrapperClass = "bg-rose-500/10 border-rose-500/20",
  categoryName = "PDF Suite",
  badgeText = "100% Client-Side",
}: ToolHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8 rounded-lg border border-border bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400 hover:underline transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Tools</span>
            </Link>
            <span className="hidden md:inline text-muted-foreground/40">/</span>
            <span className="hidden md:inline font-medium text-muted-foreground">{categoryName}</span>
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 rounded">
              {badgeText}
            </Badge>
          </div>

          {/* Title & Icon Header */}
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${iconWrapperClass}`}>
              <Icon className={`w-5 h-5 ${iconClass}`} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mt-0.5">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Security & Privacy Shield Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold shrink-0 self-start md:self-center">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Zero Server Uploads &bull; Safe & Private</span>
        </div>
      </div>
    </div>
  )
}
