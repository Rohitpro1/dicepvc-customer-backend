import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/billing"],
    },
    sitemap: "https://dicepvc.ai/sitemap.xml",
  };
}
