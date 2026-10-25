import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register"],
        disallow: ["/api/", "/import-export/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
