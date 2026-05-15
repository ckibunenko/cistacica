import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        muted: "#60706b",
        line: "#d9e2de",
        brand: "#17735f",
        leaf: "#d9f1e9",
        coral: "#e56d59",
        amber: "#f2b84b",
        sky: "#dcebf8"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 33, 31, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
