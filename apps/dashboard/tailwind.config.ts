import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#fafafa",
        muted: {
          DEFAULT: "#18181b",
          foreground: "#71717a",
        },
        border: "#27272a",
        accent: {
          DEFAULT: "#f59e0b",
          foreground: "#000000",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "monospace"],
        sans: ['"Geist Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
