import type { LandingData } from "../types/landing";

import { Hero } from "../components/landing/Hero";
import { ProblemStatement } from "../components/landing/ProblemStatement";
import { Features } from "../components/landing/Features";
import { Products } from "../components/landing/Products";
import { TargetUsers } from "../components/landing/TargetUsers";
import { Pricing } from "../components/landing/Pricing";
import { ValueProps } from "../components/landing/ValueProps";
import { CTAFooter } from "../components/landing/CTAFooter";
import landingData from "../data/landingData";

interface LandingPageProps {
  data?: LandingData;
}

export default function LandingPage({ data = landingData.vi }: LandingPageProps) {
  return (
    <>
      <main>
        <Hero data={data.hero} />
        <ProblemStatement data={data.problem} />
        <Features data={data.features} />
        <Products data={data.products} />
        <TargetUsers data={data.targetUsers} />
        <Pricing data={data.pricing} />
        <ValueProps data={data.valueProps} />
      </main>
      <CTAFooter data={data.ctaFooter} footerData={data.footer} />
    </>
  );
}
