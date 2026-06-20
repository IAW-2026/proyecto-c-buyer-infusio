import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Infusio – Marketplace de Infusiones",
  description: "Explorá y comprá infusiones artesanales y accesorios.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
        <head>
          <link rel="preconnect" href="https://deciding-hen-71.clerk.accounts.dev" />
          <link rel="dns-prefetch" href="https://deciding-hen-71.clerk.accounts.dev" />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
