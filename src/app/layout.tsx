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
    url: "https://kevphones.es/",
    siteName: "KevPhonesGC",
    title: "Compra y vende iPhone en Gran Canaria | KevPhonesGC",
    description: "Compra iPhone disponibles o vende el tuyo con valoración orientativa en Gran Canaria. Consulta stock y solicita tu valoración en KevPhonesGC.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "KevPhonesGC - Compra y vende iPhone en Gran Canaria",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compra y vende iPhone en Gran Canaria | KevPhonesGC",
    description: "Compra iPhone disponibles o vende el tuyo con valoración orientativa en Gran Canaria. Consulta stock y solicita tu valoración en KevPhonesGC.",
    images: ["/opengraph-image"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://kevphones.es/#organization",
      "name": "KevPhonesGC",
      "url": "https://kevphones.es",
      "logo": "https://kevphones.es/brand/kevphonesgc-logo.PNG",
      "description": "Compra iPhone disponibles o vende el tuyo con valoración orientativa en Gran Canaria. Consulta stock y solicita tu valoración en KevPhonesGC.",
      "areaServed": {
        "@type": "AdministrativeArea",
        "name": "Gran Canaria"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://kevphones.es/#website",
      "url": "https://kevphones.es",
      "name": "KevPhonesGC",
      "publisher": {
        "@id": "https://kevphones.es/#organization"
      },
      "inLanguage": "es"
    }
  ]
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
        <VercelAnalytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
