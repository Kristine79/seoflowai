import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SeoFlowAI — AI управление SEO-каталогами",
  description: "AI-менеджер для подачи заявок в SEO-каталоги",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full bg-zinc-50 font-sans text-zinc-900">
        <Providers>
          <div className="flex h-full">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
