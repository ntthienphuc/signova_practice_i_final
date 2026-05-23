import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { NavData } from "../../types/landing";

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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm leading-none">S</span>
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">Signova</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {data.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); scrollToSection(link.href); }}
                className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop locale toggle + CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => onLocaleChange(locale === "vi" ? "en" : "vi")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-900 text-xs font-semibold tracking-wide transition-colors bg-white/70"
            >
              <span className={locale === "vi" ? "text-slate-900" : "text-slate-400"}>VI</span>
              <span className="text-slate-400">/</span>
              <span className={locale === "en" ? "text-slate-900" : "text-slate-400"}>EN</span>
            </button>
            <Link
              to="/practice"
              className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-sky-400 hover:opacity-95 text-white text-sm font-semibold rounded-lg transition-colors shadow-md shadow-sky-200"
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
              to="/practice"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center py-3 bg-gradient-to-r from-indigo-500 to-sky-400 hover:opacity-95 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {data.cta}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
