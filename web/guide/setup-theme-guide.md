# Comprehensive Global Theme Setup Guide for Signova (React + Tailwind CSS)

This document outlines the engineering specifications for injecting the landing page's custom dark-tech color palette into Tailwind's global design system configuration. Adhering to this setup ensures semantic class consistency across the codebase and guarantees all future views (like the Learn Dashboard) align visually with our core brand design system.

---

## 1. Tailwind Architecture Configuration (`tailwind.config.js` or `tailwind.config.ts`)

Open your project's root Tailwind configuration file and expand the `theme.extend` object exactly as shown below. Colors are strictly categorized by application function (`dark` surfaces, `brand` markers, and `text` typography hierarchies).

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Tech Premium Dark Surface System
        dark: {
          bg: "#020617",            // Corresponds to slate-950 base node
          card: "rgba(255, 255, 255, 0.04)", // Corresponds to transparent white/5 layout container
          cardHover: "rgba(255, 255, 255, 0.08)",
          sidebar: "#090d16",       // Deep-inset sidebar background matte
        },
        // Signova Core Brand Identity Spectrum (Synced with Landing Hero)
        brand: {
          primary: "#0284c7",       // Core Blue (sky-600)
          primaryHover: "#0ea5e9",  // Active State Highlight (sky-500)
          primaryLight: "#7dd3fc",  // Accent Muted Blue (sky-300)
          teal: "#0d9488",          // Functional Teal Accent (teal-600)
          tealDark: "#0f766e",      // Deep Contrast Teal (teal-700)
          tealLight: "#2dd4bf",     // Neon Pulse Green (teal-400)
        },
        // Semantic Typography Hierarchy
        text: {
          main: "#ffffff",          // Full Contrast Bold Primary Typography
          muted: "#94a3b8",         // Muted Supporting Copy (slate-400)
          hint: "#64748b",          // Sub-elements / Inactive placeholders (slate-500)
        }
      },
      // Expanded structural blur ranges for ambient glow blobs
      blur: {
        '4xl': '72px',
      }
    },
  },
  plugins: [],
}