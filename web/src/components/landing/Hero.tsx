import { Link } from "react-router-dom";
import type { HeroData } from "../../types/landing";
import heroImage from '../../assets/image/hero-image.jpeg'

interface HeroProps {
  data: HeroData;
}

export function Hero({ data }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#1cb0f6] pt-28 pb-36 lg:pt-44 lg:pb-80" id="hero">
      {/* Subtle depth overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1cb0f6] via-[#1cb0f6] to-[#1899d6] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* Left — centered text column */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-7">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-sm font-black uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-white flex-shrink-0 animate-ping" />
              {data.badge}
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] font-display">
              {data.headline}
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-sky-100/90 font-bold leading-relaxed max-w-lg">
              {data.subheadline}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1 w-full sm:w-auto">
              <Link
                to="/learn-dashboard"
                className="px-8 py-4 bg-white border-b-4 border-slate-200 hover:bg-slate-50 active:border-b-0 active:translate-y-1 text-[#1cb0f6] font-black uppercase tracking-wider rounded-2xl transition-all text-lg shadow-md text-center"
              >
                {data.ctaPrimary} 🚀
              </Link>
              <a
                href="#features"
                className="px-8 py-4 bg-white/15 border-2 border-white/40 hover:bg-white/25 text-white font-black uppercase tracking-wider rounded-2xl transition-all text-lg text-center"
              >
                {data.ctaSecondary}
              </a>
            </div>
          </div>

          {/* Right — image circle, centered in column */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative w-[300px] sm:w-[360px] lg:w-[420px] aspect-square rounded-full overflow-hidden border-[6px] border-white/25 shadow-2xl flex-shrink-0">
              <img
                src={heroImage}
                alt="AI Camera Feed Mockup"
                className="w-full h-full object-cover pointer-events-none select-none"
              />
              {/* Score badge */}
              <div className="absolute bottom-[15%] right-4 bg-white/95 backdrop-blur-sm border-2 border-b-4 border-[#58cc02] py-2 px-4 rounded-2xl shadow-md text-center">
                <span className="block text-xs uppercase font-black text-[#46a302] tracking-wider leading-none">AI Score</span>
                <strong className="block text-base font-black text-[#58cc02] mt-1 leading-none">92% ĐẠT</strong>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* White wave at bottom — organic hill */}
      <svg
        className="absolute bottom-[-2px] left-0 w-full"
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <path fill="white" d="M0,80 C180,80 380,15 660,8 C940,1 1180,60 1440,80 L1440,110 L0,110 Z" />
      </svg>
    </section>
  );
}
