import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { AppShell } from "@/components/layout/app-shell";
import { ShortcutProvider } from "@/lib/shortcuts/shortcut-context";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "LinkStack — Minimalist Package URL Manager",
    template: "%s | LinkStack",
  },
  description:
    "Organize, manage, and discover web resources grouped into Packages and Sections. Fast, lightweight, and productivity-focused.",
  keywords: [
    "URL manager",
    "bookmark manager",
    "developer tools",
    "productivity",
    "link organization",
    "Linkwarden",
    "CtrlTAB",
  ],
  authors: [{ name: "LinkStack" }],
  openGraph: {
    title: "LinkStack — Minimalist Package URL Manager",
    description: "Organize, manage, and discover web resources grouped into Packages and Sections.",
    url: "/",
    siteName: "LinkStack",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkStack — Minimalist Package URL Manager",
    description: "Organize, manage, and discover web resources grouped into Packages and Sections.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "LinkStack",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "All",
    description:
      "Minimalist Package URL Manager for developers and productivity enthusiasts. Organize links into Packages and Sections.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <ShortcutProvider>
              <AppShell>{children}</AppShell>
            </ShortcutProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
