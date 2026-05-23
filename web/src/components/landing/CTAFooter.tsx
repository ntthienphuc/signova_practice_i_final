import type { CTAFooterData, FooterData } from "../../types/landing";

interface CTAFooterProps {
  data: CTAFooterData;
  footerData: FooterData;
}

export function CTAFooter({ data, footerData }: CTAFooterProps) {
  return (
    <>
      {/* CTA band */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primaryHover via-brand-primary to-brand-teal pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-main mb-6 leading-tight">
            {data.heading}
          </h2>
          <p className="text-lg text-brand-primaryLight mb-10 max-w-xl mx-auto leading-relaxed">
            {data.sub}
          </p>
          <a
            href="#"
            className="inline-block px-10 py-4 bg-text-main text-brand-primary font-bold text-base rounded-xl hover:bg-text-main/90 transition-colors shadow-xl shadow-brand-primary/30"
          >
            {data.cta}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-bg border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-brand-primary flex items-center justify-center">
              <span className="text-text-main font-bold text-xs">S</span>
            </div>
            <p className="text-text-muted text-sm">{footerData.tagline}</p>
          </div>
          <p className="text-text-hint text-sm">{footerData.copy}</p>
        </div>
      </footer>
    </>
  );
}
