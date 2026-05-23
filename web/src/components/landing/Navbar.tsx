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
          ? "bg-dark-bg/90 backdrop-blur-md shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
              <span className="text-text-main font-bold text-sm leading-none">S</span>
            </div>
            <span className="font-bold text-text-main text-lg tracking-tight">Signova</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {data.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); scrollToSection(link.href); }}
                className="text-text-muted hover:text-text-main transition-colors text-sm font-medium cursor-pointer"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-text-muted hover:text-text-main text-xs font-semibold tracking-wide transition-colors bg-transparent"
            >
              <span className={locale === "vi" ? "text-text-main" : "text-text-hint"}>VI</span>
              <span className="text-text-hint">/</span>
              <span className={locale === "en" ? "text-text-main" : "text-text-hint"}>EN</span>
            </button>
            <Link
              to="/practice"
              className="px-5 py-2 bg-brand-primary hover:bg-brand-primaryHover text-text-main text-sm font-semibold rounded-lg transition-colors"
            >
              {data.cta}
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 bg-transparent border-0 text-text-muted"
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
        <div className="md:hidden bg-dark-bg border-t border-white/5 px-4 pb-4 pt-2">
          {data.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => { e.preventDefault(); scrollToSection(link.href); setMobileOpen(false); }}
              className="flex items-center py-3 text-text-muted hover:text-text-main text-sm font-medium border-b border-white/5 last:border-0 transition-colors cursor-pointer"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => onLocaleChange(locale === "vi" ? "en" : "vi")}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/10 text-sm font-semibold bg-transparent"
            >
              <span className={locale === "vi" ? "text-text-main" : "text-text-hint"}>Tiếng Việt</span>
              <span className="text-text-hint">/</span>
              <span className={locale === "en" ? "text-text-main" : "text-text-hint"}>English</span>
            </button>
            <Link
              to="/practice"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center py-3 bg-brand-primary hover:bg-brand-primaryHover text-text-main text-sm font-semibold rounded-lg transition-colors"
            >
              {data.cta}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
