import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "SEOFlow AI — автоматизация SEO directory campaigns",
    template: "%s | SEOFlow AI",
  },
  description:
    "SEOFlow помогает исследовать SEO-площадки, готовить контент, запускать directory campaigns и отслеживать результаты в одном рабочем пространстве.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full bg-zinc-50 font-sans text-zinc-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}