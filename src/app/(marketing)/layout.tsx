import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEOFlow AI — автоматизация SEO directory campaigns",
  description:
    "SEOFlow помогает исследовать SEO-площадки, готовить контент, запускать directory campaigns и отслеживать результаты в одном рабочем пространстве.",
  openGraph: {
    title: "SEOFlow AI — автоматизация SEO directory campaigns",
    description:
      "Анализ площадок, AI-подготовка контента, подача заявок и отчётность — в одном рабочем пространстве.",
    type: "website",
    locale: "ru_RU",
    url: "https://seoflow.ai",
    siteName: "SEOFlow AI",
  },
  alternates: {
    canonical: "/",
  },
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-full bg-white">{children}</div>;
}
