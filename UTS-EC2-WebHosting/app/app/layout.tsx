import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://101.50.1.99";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "UTS Cloud Computing — AWS EC2",
    template: "%s · UTS Cloud Computing — AWS EC2",
  },
  description:
    "Website tugas UTS Cloud Computing: deployment Next.js + Tailwind + PostgreSQL ke AWS EC2 dengan Docker, Nginx, HTTPS, Terraform, Helm, Kubernetes, dan GitHub Actions. Nama: Muhammad Arya Fatthurahman — NIM 2023230006 — Kelas TIFM.",
  keywords: [
    "AWS",
    "EC2",
    "Next.js",
    "Docker",
    "Terraform",
    "Kubernetes",
    "Helm",
    "GitHub Actions",
  ],
  openGraph: {
    title: "UTS Cloud Computing — AWS EC2",
    description:
      "Dari localhost ke AWS: Next.js, Docker, Nginx, HTTPS, Terraform, dan CI/CD.",
    type: "website",
    locale: "id_ID",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fafafa",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
