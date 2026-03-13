import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthRedirectHandler } from "@/components/AuthRedirectHandler";
import { getLojaConfig } from "@/lib/loja-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const favicon = await getLojaConfig("favicon");
  return {
    title: "Easy Games",
    description: "Loja Easy Games",
    icons: favicon?.url ? { icon: favicon.url } : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CartProvider>
          <AuthRedirectHandler />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
