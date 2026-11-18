import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#6957e8",
        "brand-dark": "#5140ca",
        "brand-soft": "#f0edff",
        coral: "#ff8066",
        mint: "#42bfa4",
        sun: "#f6c85f",
        sky: "#4a9ce8",
        ink: "#25243a",
        muted: "#77758b",
        line: "#eae8f0",
        canvas: "#f8f7fc",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        shimmer: "shimmer 1.3s infinite",
        "pulse-dot": "pulse-dot 2s infinite",
      },
      keyframes: {
        shimmer: {
          "100%": {
            transform: "translateX(100%)",
          },
        },
        "pulse-dot": {
          "0%, 100%": {
            transform: "scale(1)",
            opacity: "1",
          },
          "50%": {
            transform: "scale(1.8)",
            opacity: "0.35",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
