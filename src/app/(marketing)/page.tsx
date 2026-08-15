import { Navbar } from "./components/navbar";
import { Hero } from "./components/hero";
import { CaseStudy } from "./components/case-study";
import { Problem } from "./components/problem";
import { Workflow } from "./components/workflow";
import { AiFeatures } from "./components/ai-features";
import { HumanInTheLoop } from "./components/human-in-the-loop";
import { ProductSection } from "./components/product-section";
import { CampaignContext } from "./components/campaign-context";
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
        <CaseStudy />
        <Problem />
        <Workflow />
        <AiFeatures />
        <HumanInTheLoop />
        <ProductSection />
        <CampaignContext />
        <Evidence />
        <Audience />
        <WhySection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}