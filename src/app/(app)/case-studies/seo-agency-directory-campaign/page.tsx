import type { Metadata } from "next";
import { CaseStudyClient } from "./case-view";

export const metadata: Metadata = {
  title: "SEOFlow Case Study — 77-Platform Business Listing Automation",
  description:
    "See how SEOFlow handled a real 77-platform business listing campaign with automated execution, verification, evidence capture and human-in-the-loop workflows.",
};

export default function CaseStudyPage() {
  return <CaseStudyClient />;
}
