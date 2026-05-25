import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { NavData } from "../../types/landing";
import logo from '../../assets/image/logo.jpeg'
interface NavbarProps {
  data: NavData;
  locale: "vi" | "en";
  onLocaleChange: (locale: "vi" | "en") => void;
}

function scrollToSection(href: string) {
  const id = href.replace(/^#/, "");
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Navbar({ data, locale, onLocaleChange }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/88 backdrop-blur-md shadow-lg shadow-slate-200/60 border-b border-slate-200/70"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center p-0.5 bg-white shadow-sm transition-transform hover:scale-105">
              <img src={logo} alt="Mascot" className="w-full h-full object-cover rounded-lg" />
            </div>
            <span className="font-black text-slate-800 text-xl tracking-[0.1em] uppercase leading-none">Signova</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {data.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); scrollToSection(link.href); }}
                className="text-black hover:text-[#1cb0f6] transition-colors text-sm font-black uppercase tracking-wider cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop locale toggle + CTA */}
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              onClick={() => onLocaleChange(locale === "vi" ? "en" : "vi")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-800 text-xs font-black transition-all bg-white cursor-pointer active:translate-y-px"
            >
              <span className={locale === "vi" ? "text-sky-600 font-black" : "text-slate-400 font-bold"}>VI</span>
              <span className="text-slate-300">|</span>
              <span className={locale === "en" ? "text-sky-600 font-black" : "text-slate-400 font-bold"}>EN</span>
            </button>
            <Link
              to="/learn-dashboard"
              className="px-6 py-2.5 bg-[#1cb0f6] border-b-4 border-[#1899d6] hover:bg-[#24c4ff] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all active:border-b-0 active:translate-y-1"
            >
              {data.cta}
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 bg-transparent border-0 text-slate-500"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            type="button"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 border-t border-slate-200 px-4 pb-4 pt-2 shadow-lg shadow-slate-100">
          {data.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => { e.preventDefault(); scrollToSection(link.href); setMobileOpen(false); }}
              className="flex items-center py-3 text-slate-500 hover:text-slate-900 text-sm font-medium border-b border-slate-100 last:border-0 transition-colors cursor-pointer"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => onLocaleChange(locale === "vi" ? "en" : "vi")}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold bg-white"
            >
              <span className={locale === "vi" ? "text-slate-900" : "text-slate-400"}>Tiếng Việt</span>
              <span className="text-slate-400">/</span>
              <span className={locale === "en" ? "text-slate-900" : "text-slate-400"}>English</span>
            </button>
            <Link
              to="/learn-dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center py-3 bg-[#1cb0f6] border-b-4 border-[#1899d6] hover:bg-[#24c4ff] active:border-b-0 active:translate-y-1 text-white text-sm font-black uppercase tracking-wider rounded-xl transition-all"
            >
              {data.cta}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
