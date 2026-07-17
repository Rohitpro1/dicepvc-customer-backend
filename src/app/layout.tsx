import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DicePVC AI | Advanced Aadhaar PVC Generation",
  description: "The enterprise-standard for Aadhaar PVC printing. Intelligent OCR processing, seamless printer integration, and bulk automation.",
  metadataBase: new URL("https://dicepvc.ai"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "DicePVC AI | Advanced Aadhaar PVC Generation",
    description: "The enterprise-standard for Aadhaar PVC printing. Intelligent OCR processing, seamless printer integration, and bulk automation.",
    url: "https://dicepvc.ai",
    siteName: "DicePVC AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DicePVC AI | Advanced Aadhaar PVC Generation",
    description: "The enterprise-standard for Aadhaar PVC printing. Intelligent OCR processing, seamless printer integration, and bulk automation.",
  },
};

import QueryProvider from "@/components/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="min-h-full font-sans antialiased bg-background text-on-surface">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
