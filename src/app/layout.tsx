import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "KevPhonesGC | Compra y venta de iPhone en Canarias",
    template: "%s | KevPhonesGC",
  },
  description: "Compra, vende y valora tu iPhone en Canarias con KevPhonesGC. Consulta el stock disponible, solicita una valoración y contacta directamente por WhatsApp.",
  applicationName: "KevPhonesGC",
  authors: [{ name: "KevPhonesGC" }],
  creator: "KevPhonesGC",
  category: "technology",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KevPhones Admin",
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "KevPhonesGC",
    title: "KevPhonesGC | Compra y venta de iPhone en Canarias",
    description: "Compra, vende y valora tu iPhone en Canarias con KevPhonesGC. Consulta el stock disponible, solicita una valoración y contacta directamente por WhatsApp.",
  }
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
