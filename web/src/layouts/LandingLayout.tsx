import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/landing/Navbar";
import landingData from "../data/landingData";

export type LandingLocale = "vi" | "en";

export interface LandingOutletContext {
  locale: LandingLocale;
}

export default function LandingLayout() {
  const [locale, setLocale] = useState<LandingLocale>("vi");

  return (
    <>
      <Navbar data={landingData[locale].nav} locale={locale} onLocaleChange={setLocale} />
      <Outlet context={{ locale } satisfies LandingOutletContext} />
    </>
  );
}
