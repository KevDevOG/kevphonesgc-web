import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { VercelAnalytics } from "@/components/analytics/VercelAnalytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kevphones.es"),
  title: {
    default: "Compra y vende iPhone en Gran Canaria | KevPhonesGC",
    template: "%s | KevPhonesGC",
  },
  description: "Compra iPhone disponibles o vende el tuyo con valoración orientativa en Gran Canaria. Consulta stock y solicita tu valoración en KevPhonesGC.",
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
    title: "Compra y vende iPhone en Gran Canaria | KevPhonesGC",
    description: "Compra iPhone disponibles o vende el tuyo con valoración orientativa en Gran Canaria. Consulta stock y solicita tu valoración en KevPhonesGC.",
  }
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <VercelAnalytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
