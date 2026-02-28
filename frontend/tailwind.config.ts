import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        trust: {
          high: "#166534",
          medium: "#a16207",
          low: "#b91c1c",
          border: "#d1d5db",
          muted: "#6b7280"
        }
      }
    }
  },
  plugins: []
};

export default config;
