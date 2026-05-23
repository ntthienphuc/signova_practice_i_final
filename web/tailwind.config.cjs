/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        dark: {
          bg: "#020617",
          card: "rgba(255, 255, 255, 0.04)",
          cardHover: "rgba(255, 255, 255, 0.08)",
          sidebar: "#090d16",
        },
        brand: {
          primary: "#0284c7",
          primaryHover: "#0ea5e9",
          primaryLight: "#7dd3fc",
          teal: "#0d9488",
          tealDark: "#0f766e",
          tealLight: "#2dd4bf",
        },
        text: {
          main: "#ffffff",
          muted: "#94a3b8",
          hint: "#64748b",
        },
      },
      blur: {
        "4xl": "72px",
      },
    },
  },
  plugins: [],
};