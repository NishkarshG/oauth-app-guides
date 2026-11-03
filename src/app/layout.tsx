import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: "OAuth App Guides",
  description: "Look up an app and see what it really takes to get its OAuth app approved: the steps, the wait and the blockers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh">
        <header className="no-print border-b border-line">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-sm sm:px-6">
            <Link href="/" className="font-mono font-medium">oauth-app-guides</Link>
            <Link href="/evidence" className="text-muted hover:text-ink">How we check this</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      </body>
    </html>
  );
}
