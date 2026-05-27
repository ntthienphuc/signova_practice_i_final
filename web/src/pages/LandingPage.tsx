import { useOutletContext } from "react-router-dom";
import { Hero } from "../components/landing/Hero";
import { ProblemStatement } from "../components/landing/ProblemStatement";
import { Features } from "../components/landing/Features";
import { Products } from "../components/landing/Products";
import { TargetUsers } from "../components/landing/TargetUsers";
import { Pricing } from "../components/landing/Pricing";
import { ValueProps } from "../components/landing/ValueProps";
import { CTAFooter } from "../components/landing/CTAFooter";
import landingData from "../data/landingData";
import type { LandingOutletContext } from "../layouts/LandingLayout";

export default function LandingPage() {
  const { locale } = useOutletContext<LandingOutletContext>();
  const data = landingData[locale];

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
