import type { MetadataRoute } from "next"
import { ALL_TOOLS } from "@/lib/tools-registry"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://omnitool.bhathiya.dev"

  const toolRoutes = ALL_TOOLS.map((tool) => ({
    url: `${baseUrl}${tool.href}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...toolRoutes,
  ]
}
