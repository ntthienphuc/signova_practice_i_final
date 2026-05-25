import { Link } from "react-router-dom";
import type { HeroData } from "../../types/landing";
import heroImage from '../../assets/image/hero-image.jpeg'

interface HeroProps {
  data: HeroData;
}

export function Hero({ data }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 lg:pt-40 lg:pb-32 bg-[radial-gradient(circle_at_top_left,rgba(85,206,255,0.12),transparent_35%),radial-gradient(circle_at_top_right,rgba(83,110,249,0.08),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f0f9ff_100%)]" id="hero">
      {/* Ambient glow blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          {/* Left Text Column */}
          <div className="text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-600 text-xs font-black uppercase tracking-wider shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1cb0f6] flex-shrink-0 animate-ping" />
              {data.badge}
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-[4.2rem] font-extrabold text-slate-800 tracking-tight leading-[1.1] mb-2 font-display">
              {data.headline}
            </h1>
            
            <p className="text-base sm:text-lg text-slate-500 font-bold max-w-xl leading-relaxed">
              {data.subheadline}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/learn-dashboard"
                className="px-8 py-3.5 bg-[#1cb0f6] border-b-4 border-[#1899d6] hover:bg-[#24c4ff] text-white font-black uppercase tracking-wider rounded-2xl transition-all text-sm shadow-md hover:shadow-sky-100 text-center active:border-b-0 active:translate-y-1"
              >
                {data.ctaPrimary} 🚀
              </Link>
              <a
                href="#features"
                className="px-8 py-3.5 bg-white border-2 border-b-4 border-slate-200 hover:bg-slate-50 text-slate-600 font-black uppercase tracking-wider rounded-2xl transition-all text-sm text-center active:border-b-0 active:translate-y-1"
              >
                {data.ctaSecondary}
              </a>
            </div>
          </div>

          {/* Right Mockup Column */}
          <div className="relative justify-self-center lg:justify-self-end w-full max-w-[420px] aspect-[4/3] sm:aspect-square bg-white border-2 border-b-4 border-slate-200 rounded-[32px] p-3.5 shadow-xl shadow-slate-100/60 animate-float">
            <div className="relative w-full h-full rounded-[24px] overflow-hidden border-2 border-slate-150 bg-slate-50">
              {/* Image from local public directory */}
              <img 
                src={heroImage}
                alt="AI Camera Feed Mockup" 
                className="w-full h-full object-cover pointer-events-none select-none" 
              />

              {/* AI Skeleton tracker overlay (connecting lines) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Left arm/hand tracker lines (correct - green) */}
                <path d="M 42,55 L 40,43 L 45,35 M 40,43 L 37,38 M 40,43 L 33,44" fill="none" stroke="#58cc02" strokeWidth="1.2" strokeLinecap="round" />
                {/* Right arm/hand tracker lines (incorrect - red) */}
                <path d="M 58,62 L 62,50 L 68,42 M 62,50 L 59,44 M 62,50 L 65,46" fill="none" stroke="#ea4335" strokeWidth="1.2" strokeLinecap="round" />
              </svg>

              {/* AI Skeleton joints (dots) */}
              {/* Left hand (correct - green) */}
              <div className="absolute top-[55%] left-[42%] w-3 h-3 rounded-full bg-[#58cc02] border-2 border-white shadow-md animate-pulse" />
              <div className="absolute top-[43%] left-[40%] w-2.5 h-2.5 rounded-full bg-[#58cc02] border-2 border-white shadow-md" />
              <div className="absolute top-[35%] left-[45%] w-2 h-2 rounded-full bg-[#58cc02] border-2 border-white shadow-md" />
              <div className="absolute top-[38%] left-[37%] w-2 h-2 rounded-full bg-[#58cc02] border-2 border-white shadow-md" />
              <div className="absolute top-[44%] left-[33%] w-2 h-2 rounded-full bg-[#58cc02] border-2 border-white shadow-md" />

              {/* Right hand (incorrect - red) */}
              <div className="absolute top-[62%] left-[58%] w-3 h-3 rounded-full bg-[#ea4335] border-2 border-white shadow-md animate-pulse" />
              <div className="absolute top-[50%] left-[62%] w-2.5 h-2.5 rounded-full bg-[#ea4335] border-2 border-white shadow-md" />
              <div className="absolute top-[42%] left-[68%] w-2 h-2 rounded-full bg-[#ea4335] border-2 border-white shadow-md" />
              <div className="absolute top-[44%] left-[59%] w-2 h-2 rounded-full bg-[#ea4335] border-2 border-white shadow-md" />
              <div className="absolute top-[46%] left-[65%] w-2 h-2 rounded-full bg-[#ea4335] border-2 border-white shadow-md" />

              {/* Mockup AI Labels */}
              {/* Target Word label at top center */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border-2 border-slate-200 py-1.5 px-4 rounded-full text-center shadow-md flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-black text-slate-400">Từ:</span>
                <span className="text-xs font-black text-slate-800 tracking-wide">CẢM ƠN</span>
                <span className="text-base select-none">👋</span>
              </div>

              {/* AI matching score in green */}
              <div className="absolute top-14 right-3 bg-white/95 backdrop-blur-sm border-2 border-b-4 border-[#58cc02] py-1.5 px-3 rounded-2xl shadow-md text-center">
                <span className="block text-[8px] uppercase font-black text-[#46a302] tracking-wider leading-none">AI Score</span>
                <strong className="block text-sm font-black text-[#58cc02] mt-0.5 leading-none">92% ĐẠT</strong>
              </div>

              {/* Instruction tag in orange */}
              <div className="absolute bottom-4 left-3 right-3 bg-white/95 backdrop-blur-sm border-2 border-b-4 border-[#ff9600] p-2.5 rounded-2xl shadow-lg flex items-center gap-2">
                <span className="text-lg leading-none">⚠️</span>
                <div className="min-w-0">
                  <span className="block text-[8px] uppercase font-black text-[#cc7a00] tracking-wider leading-none">Gợi ý từ AI</span>
                  <strong className="block text-[10px] sm:text-xs font-black text-slate-700 mt-0.5 truncate leading-tight">
                    Nâng khuỷu tay phải cao hơn 15°
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
