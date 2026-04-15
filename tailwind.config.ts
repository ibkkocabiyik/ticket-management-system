import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#6366F1",
          foreground: "#ffffff",
        },
        input: "hsl(var(--border))",
        ring: "#6366F1",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(99,102,241,0.06), 0 1px 2px -1px rgba(99,102,241,0.04)",
        "card-hover": "0 4px 12px 0 rgba(99,102,241,0.12)",
      },
      keyframes: {
        slideInFadeIn: {
          "0%": { transform: "translateY(-12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "modal-in": {
          "0%": { transform: "scale(0.95) translateY(8px)", opacity: "0" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        "overlay-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "popover-in": {
          "0%": { transform: "translateY(-6px) scale(0.97)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "comment-in": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.3s cubic-bezier(0.32,0.72,0,1)",
        "modal-in": "modal-in 0.25s cubic-bezier(0.16,1,0.3,1)",
        "overlay-in": "overlay-in 0.2s ease-out",
        "slide-in-fade-in": "slideInFadeIn 0.4s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.32,0.72,0,1) both",
        "popover-in": "popover-in 0.15s cubic-bezier(0.16,1,0.3,1) both",
        "comment-in": "comment-in 0.25s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
