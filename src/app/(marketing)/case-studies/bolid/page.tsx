import type { Metadata } from "next";
import BolidCaseView from "./case-view";

export const metadata: Metadata = {
  title: {
    absolute: "BOLID AI Search Audit — SEOFlow AI",
  },
  description:
    "AI Search visibility case study for АО НВП «Болид»: prompt-based measurement, source intelligence, competitor analysis, AI positioning and verification runs.",
  alternates: {
    canonical: "/case-studies/bolid",
  },
};

export default function BolidCaseStudyPage() {
  return <BolidCaseView />;
}