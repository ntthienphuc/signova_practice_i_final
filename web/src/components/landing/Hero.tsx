import { Link } from "react-router-dom";
import type { HeroData } from "../../types/landing";

interface HeroProps {
  data: HeroData;
}

export function Hero({ data }: HeroProps) {
  return (
    <section className="relative bg-slate-950 overflow-hidden pt-36 pb-28 lg:pt-48 lg:pb-36" id="hero">
      {/* Ambient glow blobs */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] bg-teal-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-700/6 rounded-full blur-3xl pointer-events-none" />

      {/* Dot-grid overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-sm font-medium mb-10">
          <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 animate-pulse" />
          {data.badge}
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-7">
          {data.headline}
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          {data.subheadline}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/practice"
            className="px-9 py-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-sky-500/20 text-base"
          >
            {data.ctaPrimary}
          </Link>
          <a
            href="#features"
            className="px-9 py-4 bg-white/6 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all text-base"
          >
            <span className="mr-2">▶</span>
            {data.ctaSecondary}
          </a>
        </div>
      </div>
    </section>
  );
}
