import { Navbar } from "./components/navbar";
import { Hero } from "./components/hero";
import { Problem } from "./components/problem";
import { Workflow } from "./components/workflow";
import { AiFeatures } from "./components/ai-features";
import { HumanInTheLoop } from "./components/human-in-the-loop";
import { ProductSection } from "./components/product-section";
import { CampaignShowcase } from "./components/campaign-showcase";
import { AuditShowcase } from "./components/audit-showcase";
import { ContentShowcase } from "./components/content-showcase";
import { CaseStudy } from "./components/case-study";
import { Evidence } from "./components/evidence";
import { Audience } from "./components/audience";
import { WhySection } from "./components/why-section";
import { FinalCta } from "./components/final-cta";
import { Footer } from "./components/footer";

export default function MarketingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Workflow />
        <AiFeatures />
        <HumanInTheLoop />
        <ProductSection />
        <CampaignShowcase />
        <AuditShowcase />
        <ContentShowcase />
        <CaseStudy />
        <Evidence />
        <Audience />
        <WhySection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}