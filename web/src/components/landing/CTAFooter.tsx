import type { CTAFooterData, FooterData } from "../../types/landing";

interface CTAFooterProps {
  data: CTAFooterData;
  footerData: FooterData;
}

export function CTAFooter({ data, footerData }: CTAFooterProps) {
  return (
    <>
      {/* CTA band */}
      <section className="relative bg-indigo-600 overflow-hidden py-20 lg:py-28">
        {/* Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
            {data.heading}
          </h2>
          <p className="text-lg text-indigo-200 mb-10 max-w-xl mx-auto leading-relaxed">
            {data.sub}
          </p>
          <a
            href="#"
            className="inline-block px-10 py-4 bg-white text-indigo-700 font-bold text-base rounded-xl hover:bg-indigo-50 transition-colors shadow-xl shadow-indigo-900/30"
          >
            {data.cta}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <p className="text-slate-400 text-sm">{footerData.tagline}</p>
          </div>
          <p className="text-slate-600 text-sm">{footerData.copy}</p>
        </div>
      </footer>
    </>
  );
}
