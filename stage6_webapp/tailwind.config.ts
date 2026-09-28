import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#14110D",
        foreground: "#EDE6D9",
        oxidation: {
          green: "#5E8B7E",   // Good / Cool
          amber: "#B5793B",   // Warning / Heat
          clay: "#A6543A",    // Bad / Toxic
        }
      },
      fontFamily: {
        serif: ["var(--font-roboto-slab)"],
        mono: ["var(--font-jetbrains-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
