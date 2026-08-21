import { ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import type { CTAFooterData, FooterData } from "../../types/landing";
import logo from "../../assets/image/logo.jpeg";

interface CTAFooterProps {
  data: CTAFooterData;
  footerData: FooterData;
  locale: "vi" | "en";
}

const eyebrow = {
  vi: "Một bước nhỏ mỗi ngày",
  en: "One small step each day",
};

export function CTAFooter({ data, footerData, locale }: CTAFooterProps) {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-slate-950 py-20 sm:py-28" id="cta">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_24%,rgba(14,165,233,.65),transparent_27%),radial-gradient(circle_at_75%_70%,rgba(6,182,212,.35),transparent_25%)]" />
        <div className="absolute -right-24 -top-20 -z-10 h-80 w-80 rounded-full border-[32px] border-cyan-300/10" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-cyan-200"><Sparkles size={14} /> {eyebrow[locale]}</p>
            <h2 className="mt-5 text-4xl font-black leading-[1.02] tracking-[-.04em] text-white sm:text-5xl lg:text-6xl">{data.heading}</h2>
            <p className="mt-5 text-lg font-bold leading-relaxed text-slate-300 sm:text-xl">{data.sub}</p>
          </div>
          <Link
            to="/learn-dashboard"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-cyan-200 bg-cyan-300 px-8 py-4 text-sm font-black uppercase tracking-wide text-slate-950 shadow-[0_16px_35px_rgba(34,211,238,.2)] transition hover:-translate-y-0.5 hover:bg-cyan-200 active:translate-y-1 active:border-b-0 md:w-auto"
          >
            {data.cta}<ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Signova mascot" className="h-10 w-10 rounded-xl object-cover mix-blend-screen" />
            <div><p className="font-black tracking-[.16em] text-white">SIGNOVA</p><p className="text-xs font-bold text-slate-400">{footerData.tagline}</p></div>
          </div>
          <p className="text-xs font-bold text-slate-500">{footerData.copy}</p>
        </div>
      </footer>
    </>
  );
}
