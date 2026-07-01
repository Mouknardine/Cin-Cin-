import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "480px",
      md: "768px",
      lg: "1080px",
      xl: "1400px",
      "2xl": "1720px",
    },
    extend: {
      colors: {
        ink: "#100F0C",
        paper: "#FFFFFF",
        red: "#C22A1D",
        mustard: "#E0A32B",
        line: "#100F0C1a",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        body: ["var(--font-body)", "Helvetica Neue", "Arial", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.06em",
        widen: "0.14em",
        widest: "0.28em",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.65, 0, 0.35, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
