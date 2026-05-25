import { Link } from "react-router-dom";
import type { CTAFooterData, FooterData } from "../../types/landing";
import logo from '../../assets/image/logo.jpeg'

interface CTAFooterProps {
  data: CTAFooterData;
  footerData: FooterData;
}

export function CTAFooter({ data, footerData }: CTAFooterProps) {
  return (
    <>
      {/* CTA Band */}
      <section className="relative overflow-hidden py-24 lg:py-32" id="cta">
        {/* Rich gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1cb0f6] via-[#536ef9] to-[#7f00ff] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-5xl sm:text-6xl lg:text-[5rem] font-extrabold text-white leading-none tracking-tight m-0">
            {data.heading}
          </h2>

          <p className="text-xl sm:text-2xl text-sky-100/90 font-bold max-w-xl mx-auto leading-relaxed m-0">
            {data.sub}
          </p>

          <div className="pt-2">
            <Link
              to="/learn-dashboard"
              className="inline-block px-10 py-4 bg-white border-b-4 border-slate-250 hover:bg-slate-50 active:border-b-0 active:translate-y-[2px] text-[#1cb0f6] font-black text-lg uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-indigo-900/20"
            >
              {data.cta} 🚀
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1cb0f6] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/30 flex items-center justify-center p-0.5 bg-white/20 flex-shrink-0">
              <img src={logo} alt="Mascot" className="w-full h-full object-cover rounded-md" />
            </div>
            <p className="text-white/90 font-bold text-sm m-0">{footerData.tagline}</p>
          </div>
          <p className="text-white/70 font-bold text-xs m-0">{footerData.copy}</p>
        </div>
      </footer>
    </>
  );
}
