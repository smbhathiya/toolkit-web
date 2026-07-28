"use client"

import { useState, useRef } from "react"
import {
  Braces,
  Copy,
  Check,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Maximize2,
  FileCode,
  ChevronRight,
  ChevronDown
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

// Sample JSONs for testing
const SAMPLE_JSONS = {
  simple: `{
  "name": "OmniTool",
  "version": "1.3.0",
  "active": true,
  "tags": ["utility", "web", "developer"],
  "stats": {
    "speed": "instant",
    "offline": true
  }
}`,
  complex: `{
  "id": "user_01h8v9wz",
  "profile": {
    "firstName": "Jane",
    "lastName": "Doe",
    "age": 28,
    "email": "jane.doe@example.com",
    "avatar": null
  },
  "roles": [
    {
      "role": "Admin",
      "permissions": ["read", "write", "delete"]
    },
    {
      "role": "Billing",
      "permissions": ["view_invoices", "pay"]
    }
  ],
  "preferences": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    }
  },
  "loginHistory": [
    {
      "timestamp": "2026-07-06T14:30:00Z",
      "ip": "192.168.1.1",
      "successful": true
    },
    {
      "timestamp": "2026-07-05T09:15:12Z",
      "ip": "203.0.113.195",
      "successful": false
    }
  ]
}`
}

interface ErrorDetails {
  message: string
  line?: number
  column?: number
}

// Tree view component for interactive JSON display
interface TreeNodeProps {
  name?: string
  value: any
  isLast?: boolean
  depth?: number
}

function JsonTreeNode({ name, value, isLast = true, depth = 0 }: TreeNodeProps) {
  const [collapsed, setCollapsed] = useState(false)
  const isObject = value !== null && typeof value === "object"
  const isArray = Array.isArray(value)

  if (isObject) {
    const keys = Object.keys(value)
    const isEmpty = keys.length === 0
    const startBracket = isArray ? "[" : "{"
    const endBracket = isArray ? "]" : "}"

    if (isEmpty) {
      return (
        <div className="font-mono text-xs md:text-sm py-0.5 pl-4 md:pl-6 leading-relaxed select-text">
          {name && (
            <span className="text-purple-600 dark:text-purple-400 font-semibold">
              &quot;{name}&quot;:{" "}
            </span>
          )}
          <span className="text-muted-foreground">{startBracket}{endBracket}{isLast ? "" : ","}</span>
        </div>
      )
    }

    return (
      <div className="font-mono text-xs md:text-sm py-0.5 leading-relaxed select-text">
        <div className="flex items-center gap-1 group">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-4 h-4 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground select-none cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          {name && (
            <span className="text-purple-600 dark:text-purple-400 font-semibold">
              &quot;{name}&quot;:{" "}
            </span>
          )}
          <span className="text-muted-foreground">{startBracket}</span>
          {collapsed && (
            <span
              onClick={() => setCollapsed(false)}
              className="text-[10px] md:text-xs text-muted-foreground px-1 bg-muted hover:bg-muted/80 rounded select-none cursor-pointer mx-1"
            >
              {isArray ? `${value.length} item(s)` : `${keys.length} key(s)`}
            </span>
          )}
          {collapsed && (
            <span className="text-muted-foreground">
              {endBracket}
              {!isLast && ","}
            </span>
          )}
        </div>

        {!collapsed && (
          <div className="pl-4 md:pl-6 border-l border-border/80 ml-2 mt-0.5">
            {isArray
              ? value.map((val, idx) => (
                  <JsonTreeNode
                    key={idx}
                    value={val}
                    isLast={idx === value.length - 1}
                    depth={depth + 1}
                  />
                ))
              : keys.map((key, idx) => (
                  <JsonTreeNode
                    key={key}
                    name={key}
                    value={value[key]}
                    isLast={idx === keys.length - 1}
                    depth={depth + 1}
                  />
                ))}
          </div>
        )}

        {!collapsed && (
          <div className="pl-6 text-muted-foreground mt-0.5">
            {endBracket}
            {!isLast && ","}
          </div>
        )}
      </div>
    )
  }

  // Primitive Types
  let valueNode = null
  if (value === null) {
    valueNode = <span className="text-amber-600 dark:text-amber-400 font-medium">null</span>
  } else if (typeof value === "boolean") {
    valueNode = (
      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
        {value ? "true" : "false"}
      </span>
    )
  } else if (typeof value === "number") {
    valueNode = <span className="text-sky-600 dark:text-sky-400 font-medium">{value}</span>
  } else {
    // string
    valueNode = (
      <span className="text-orange-600 dark:text-orange-400 font-medium break-all">
        &quot;{value}&quot;
      </span>
    )
  }

  return (
    <div className="font-mono text-xs md:text-sm py-0.5 pl-6 md:pl-8 leading-relaxed select-text">
      {name && (
        <span className="text-purple-600 dark:text-purple-400 font-semibold">
          &quot;{name}&quot;:{" "}
        </span>
      )}
      {valueNode}
      {!isLast && <span className="text-muted-foreground">,</span>}
    </div>
  )
}

function highlightJson(jsonStr: string): string {
  if (!jsonStr) return ""
  // Escape HTML characters to prevent XSS
  const safeStr = jsonStr
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // JSON syntax highlighting regex
  return safeStr.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "text-sky-600 dark:text-sky-400 font-semibold" // number default
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "text-purple-600 dark:text-purple-400 font-bold" // key
        } else {
          cls = "text-orange-600 dark:text-orange-400 font-medium" // string
        }
      } else if (/true|false/.test(match)) {
        cls = "text-emerald-600 dark:text-emerald-400 font-bold" // boolean
      } else if (/null/.test(match)) {
        cls = "text-amber-600 dark:text-amber-400 font-bold" // null
      }
      
      if (/:$/.test(match)) {
        return `<span class="${cls}">${match.slice(0, -1)}</span>:`
      }
      return `<span class="${cls}">${match}</span>`
    }
  )
}

export default function JsonFormatter() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [copied, setCopied] = useState(false)
  const [indentSpace, setIndentSpace] = useState("2") // "2", "4", "tab"
  const [viewMode, setViewMode] = useState<"text" | "tree">("text")
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null)
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Metrics
  const [metrics, setMetrics] = useState({
    size: 0,
    keys: 0,
    depth: 0,
    chars: 0,
  })

  // Parse depth helper
  const getJsonDepth = (obj: any): number => {
    if (obj === null || typeof obj !== "object") return 0
    const keys = Object.keys(obj)
    if (keys.length === 0) return 1
    return 1 + Math.max(...keys.map((k) => getJsonDepth(obj[k])))
  }

  // Parse keys count helper
  const countKeys = (obj: any): number => {
    if (obj === null || typeof obj !== "object") return 0
    let count = 0
    if (Array.isArray(obj)) {
      obj.forEach((val) => {
        count += countKeys(val)
      })
    } else {
      const keys = Object.keys(obj)
      count += keys.length
      keys.forEach((k) => {
        count += countKeys(obj[k])
      })
    }
    return count
  }

  // Parse & validate JSON with robust details
  const validateAndCalculateMetrics = (text: string) => {
    if (!text.trim()) {
      setIsValid(null)
      setErrorDetails(null)
      setOutput("")
      setMetrics({ size: 0, keys: 0, depth: 0, chars: 0 })
      return null
    }

    try {
      const parsedObj = JSON.parse(text)
      setIsValid(true)
      setErrorDetails(null)

      // Calculate Metrics
      const byteSize = new Blob([text]).size
      const depth = getJsonDepth(parsedObj)
      const keys = countKeys(parsedObj)
      setMetrics({
        size: parseFloat((byteSize / 1024).toFixed(3)),
        keys,
        depth,
        chars: text.length,
      })
      return parsedObj
    } catch (err: any) {
      setIsValid(false)
      const msg = err.message || "Invalid JSON"
      let errorLine = undefined
      let errorCol = undefined

      // Attempt to extract position
      const lineColMatch = msg.match(/line (\d+) column (\d+)/i)
      if (lineColMatch) {
        errorLine = parseInt(lineColMatch[1], 10)
        errorCol = parseInt(lineColMatch[2], 10)
      } else {
        const positionMatch = msg.match(/at position (\d+)/i)
        if (positionMatch) {
          const pos = parseInt(positionMatch[1], 10)
          const sliceText = text.slice(0, pos)
          const lines = sliceText.split("\n")
          errorLine = lines.length
          errorCol = lines[lines.length - 1].length + 1
        }
      }

      setErrorDetails({
        message: msg,
        line: errorLine,
        column: errorCol,
      })
      setMetrics({ size: 0, keys: 0, depth: 0, chars: text.length })
      return null
    }
  }

  const handleFormat = () => {
    const parsed = validateAndCalculateMetrics(input)
    if (parsed !== null && isValid !== false) {
      const space =
        indentSpace === "tab" ? "\t" : parseInt(indentSpace, 10)
      const formatted = JSON.stringify(parsed, null, space)
      setOutput(formatted)
    }
  }

  const handleMinify = () => {
    const parsed = validateAndCalculateMetrics(input)
    if (parsed !== null && isValid !== false) {
      const minified = JSON.stringify(parsed)
      setOutput(minified)
    }
  }

  const handleValidate = () => {
    validateAndCalculateMetrics(input)
  }

  const handleCopy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleClear = () => {
    setInput("")
    setOutput("")
    setIsValid(null)
    setErrorDetails(null)
    setMetrics({ size: 0, keys: 0, depth: 0, chars: 0 })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setInput(text)
      validateAndCalculateMetrics(text)
    }
    reader.readAsText(file)
  }

  const handleDownload = () => {
    if (!output) return
    const blob = new Blob([output], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "formatted_json.json"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const loadSample = (type: "simple" | "complex") => {
    const text = SAMPLE_JSONS[type]
    setInput(text)
    // Validate first to configure states correctly
    const parsed = validateAndCalculateMetrics(text)
    if (parsed) {
      const space = indentSpace === "tab" ? "\t" : parseInt(indentSpace, 10)
      setOutput(JSON.stringify(parsed, null, space))
    }
  }

  // Determine what object to pass to TreeView
  let parsedObjectForTreeView = null
  if (isValid && output) {
    try {
      parsedObjectForTreeView = JSON.parse(output)
    } catch {
      try {
        parsedObjectForTreeView = JSON.parse(input)
      } catch {
        parsedObjectForTreeView = null
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-24 pb-10 sm:px-6 sm:pt-28 sm:pb-14">
        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
            <Braces className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              JSON Formatter & Validator
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Format, validate, tree-visualize, and diagnose JSON data with complete client-side security.
            </p>
          </div>
        </div>

        {/* Validation Banner */}
        {isValid === true && (
          <div className="mb-4 flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 rounded-lg border border-emerald-200/50 dark:border-emerald-900/40 text-xs md:text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex-1 font-medium">
              Valid JSON syntax detected! All integrity checks passed.
            </div>
          </div>
        )}

        {isValid === false && errorDetails && (
          <div className="mb-4 flex items-start gap-3 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-xs md:text-sm">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">
              <span className="font-bold">Error:</span> {errorDetails.message}
              {errorDetails.line && (
                <div className="mt-1 text-xs text-destructive/80 font-mono">
                  Faulty region: Line {errorDetails.line}, Column {errorDetails.column}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grid Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT: Input & Controls */}
          <div className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-semibold">Input JSON</CardTitle>
                  <CardDescription className="text-xs">Paste or load raw JSON data</CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    onClick={() => loadSample("simple")}
                    className="text-xs h-7 py-1 px-2.5 cursor-pointer"
                  >
                    Sample Simple
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => loadSample("complex")}
                    className="text-xs h-7 py-1 px-2.5 cursor-pointer"
                  >
                    Sample Complex
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="relative">
                  <Textarea
                    placeholder='Enter or paste JSON here... {"foo": "bar"}'
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      validateAndCalculateMetrics(e.target.value)
                    }}
                    rows={16}
                    className="font-mono text-xs md:text-sm leading-relaxed p-4 resize-y bg-muted/25"
                  />
                </div>

                {/* Indentation configuration */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between py-1 bg-muted/40 p-2.5 rounded-lg border border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                      Indentation:
                    </span>
                    <div className="flex rounded-md bg-muted p-0.5 gap-0.5 text-[11px] font-medium border border-border">
                      {["2", "4", "tab"].map((option) => (
                        <button
                          key={option}
                          onClick={() => setIndentSpace(option)}
                          className={`px-2 py-0.5 rounded capitalize cursor-pointer transition-all ${
                            indentSpace === option
                              ? "bg-background text-foreground shadow-xs font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {option === "tab" ? "Tab" : `${option} spaces`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".json"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 text-xs gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload File
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClear}
                      className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Clear
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={handleFormat}
                    disabled={!input}
                    className="h-9 text-xs gap-1.5 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Beautify
                  </Button>
                  <Button
                    onClick={handleMinify}
                    disabled={!input}
                    className="h-9 text-xs gap-1.5 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5 shrink-0 rotate-45" /> Minify
                  </Button>
                  <Button
                    onClick={handleValidate}
                    disabled={!input}
                    variant="outline"
                    className="h-9 text-xs gap-1.5 cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5" /> Force Validate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Output Preview */}
          <div className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-semibold">Processed Preview</CardTitle>
                  <CardDescription className="text-xs">Formatted results or visual node tree</CardDescription>
                </div>
                {isValid && (
                  <div className="flex rounded-md bg-muted p-0.5 gap-0.5 text-[11px] font-medium border border-border">
                    {(["text", "tree"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-3 py-0.5 rounded capitalize cursor-pointer transition-all ${
                          viewMode === mode
                            ? "bg-background text-foreground shadow-xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {mode === "text" ? "Raw Text" : "TreeView"}
                      </button>
                    ))}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {viewMode === "text" || !isValid || !parsedObjectForTreeView ? (
                  output ? (
                    <pre
                      dangerouslySetInnerHTML={{ __html: highlightJson(output) }}
                      className="font-mono text-xs md:text-sm leading-relaxed p-4 bg-muted/25 rounded-md border border-border h-[340px] md:h-[352px] overflow-y-auto whitespace-pre-wrap select-text break-all"
                    />
                  ) : (
                    <Textarea
                      readOnly
                      placeholder="Outputs will display here after formatting..."
                      value={output}
                      rows={16}
                      className="font-mono text-xs md:text-sm leading-relaxed p-4 resize-y bg-muted/25"
                    />
                  )
                ) : (
                  <div className="border border-border/60 rounded-md p-4 bg-muted/25 h-[340px] md:h-[352px] overflow-y-auto">
                    <JsonTreeNode value={parsedObjectForTreeView} />
                  </div>
                )}

                {/* Stats Bar */}
                {metrics.chars > 0 && (
                  <div className="grid grid-cols-4 gap-2 text-center py-2 bg-muted/40 rounded-lg border border-border/40 text-[10px] md:text-xs font-semibold text-muted-foreground">
                    <div>
                      <div className="text-foreground">{metrics.size} KB</div>
                      <div>File Size</div>
                    </div>
                    <div className="border-l border-border">
                      <div className="text-foreground">{metrics.keys}</div>
                      <div>Total Keys</div>
                    </div>
                    <div className="border-l border-border">
                      <div className="text-foreground">{metrics.depth}</div>
                      <div>Nesting Depth</div>
                    </div>
                    <div className="border-l border-border">
                      <div className="text-foreground">{metrics.chars}</div>
                      <div>Characters</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    disabled={!output}
                    className="flex-1 h-9 text-xs gap-1.5 cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? "Copied" : "Copy Output"}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    disabled={!output}
                    variant="outline"
                    className="h-9 px-3 text-xs gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
