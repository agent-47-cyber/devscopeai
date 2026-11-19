/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {

      colors: {
        "primary": "#FF7A1A", /* DevScope Orange */
        "primary-hover": "#FF8C3A",
        "primary-active": "#E06A14",
        "primary-muted": "#1A1711",
        "on-primary": "#050505",

        "secondary": "#f59e0b", /* Amber */
        "on-secondary": "#111111",

        "background": "#050505",
        "on-background": "#FFFFFF",
        
        "surface": "#0B0B0B",
        "surface-deep": "#050505",
        "surface-dim": "#0B0B0B",
        "surface-bright": "#121212",
        "surface-container": "#161616", /* Cards */
        "surface-container-high": "#1D1D1D", /* Hover */
        
        "on-surface": "#FFFFFF",
        "on-surface-variant": "#A3A3A3", /* Secondary Text */
        "muted": "#737373", /* Muted Text */

        "outline": "#242424", /* Borders */
        "outline-variant": "#242424",
        "border-subtle": "#1D1D1D",
        
        "success": "#22c55e",
        "warning": "#eab308",
        "error": "#ef4444",
        "info": "#3b82f6",
      },
      borderRadius: {
        DEFAULT: "2px",
        sm: "2px",
        md: "4px",
        lg: "4px",
        xl: "8px",
        full: "9999px",
      },
      spacing: {
        "gutter": "1.5rem",
        "sidebar-width": "240px",
        "section-margin": "3rem",
        "card-gap": "1rem",
        "container-padding": "2rem",
        "margin-desktop": "32px",
        "unit": "4px",
        "margin-mobile": "16px",
        "container-max": "1440px",
      },
      fontFamily: {
        /* ─── Systematic Font Families ─────────────────────────────── */
        "display": ["Hanken Grotesk", "Inter", "system-ui", "sans-serif"],
        "headline": ["Hanken Grotesk", "Inter", "system-ui", "sans-serif"],
        "title": ["Inter", "system-ui", "sans-serif"],
        "body": ["Inter", "system-ui", "sans-serif"],
        "label": ["Geist Mono", "JetBrains Mono", "SF Mono", "Cascadia Code", "Consolas", "Roboto Mono", "monospace"],
        "code": ["Geist Mono", "JetBrains Mono", "SF Mono", "Cascadia Code", "Consolas", "Roboto Mono", "monospace"],
        "mono": ["Geist Mono", "JetBrains Mono", "SF Mono", "Cascadia Code", "Consolas", "Roboto Mono", "monospace"],

        /* ─── Legacy Aliases ───────────────────────────────────────── */
        "title-sm": ["Inter", "system-ui", "sans-serif"],
        "label-caps": ["Geist Mono", "JetBrains Mono", "SF Mono", "Cascadia Code", "Consolas", "monospace"],
        "display-lg": ["Hanken Grotesk", "Inter", "system-ui", "sans-serif"],
        "data-lg": ["Hanken Grotesk", "Inter", "system-ui", "sans-serif"],
        "body-md": ["Inter", "system-ui", "sans-serif"],
        "label-sm": ["Inter", "system-ui", "sans-serif"],
        "headline-md": ["Hanken Grotesk", "Inter", "system-ui", "sans-serif"],
        "body-sm": ["Inter", "system-ui", "sans-serif"],
        "headline-lg-mobile": ["Inter", "system-ui", "sans-serif"],
        "body-lg": ["Inter", "system-ui", "sans-serif"],
        "headline-lg": ["Inter", "system-ui", "sans-serif"],
        "code-md": ["Geist Mono", "JetBrains Mono", "SF Mono", "Cascadia Code", "Consolas", "monospace"],
      },
      fontSize: {
        /* ─── Display ──────────────────────────────────────────────── */
        "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-md": ["36px", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],

        /* ─── Headline ─────────────────────────────────────────────── */
        "headline-lg": ["32px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-sm": ["20px", { lineHeight: "1.3", fontWeight: "600" }],

        /* ─── Title ────────────────────────────────────────────────── */
        "title-lg": ["18px", { lineHeight: "1.4", fontWeight: "600" }],
        "title-md": ["16px", { lineHeight: "1.5", fontWeight: "600" }],
        "title-sm": ["14px", { lineHeight: "1.5", fontWeight: "600" }],

        /* ─── Body ─────────────────────────────────────────────────── */
        "body-lg": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "1.5", fontWeight: "400" }],

        /* ─── Label (Monospace) ─────────────────────────────────────── */
        "label-lg": ["14px", { lineHeight: "1.4", letterSpacing: "0.05em", fontWeight: "600" }],
        "label-md": ["12px", { lineHeight: "1.4", letterSpacing: "0.08em", fontWeight: "600" }],
        "label-sm": ["11px", { lineHeight: "1.3", letterSpacing: "0.10em", fontWeight: "700" }],
        "label-xs": ["10px", { lineHeight: "1.2", letterSpacing: "0.12em", fontWeight: "700" }],

        /* ─── Code ─────────────────────────────────────────────────── */
        "code-lg": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "code-md": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "code-sm": ["12px", { lineHeight: "1.5", fontWeight: "400" }],

        /* ─── Data (Large Numbers) ─────────────────────────────────── */
        "data-lg": ["40px", { lineHeight: "1", fontWeight: "700" }],
        "data-md": ["28px", { lineHeight: "1.1", fontWeight: "700" }],

        /* ─── Legacy Alias ─────────────────────────────────────────── */
        "label-caps": ["11px", { lineHeight: "12px", letterSpacing: "0.1em", fontWeight: "700" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "display": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
      },
      boxShadow: {
        "card": "inset 0 1px 0 0 rgba(255,255,255,0.04), 0 18px 50px rgba(0,0,0,0.35)",
        "card-hover": "inset 0 1px 0 0 rgba(255,255,255,0.05), 0 24px 70px rgba(0,0,0,0.46)",
        "glow": "0 0 0 1px rgba(184,161,96,0.14)",
        "glow-lg": "0 18px 50px rgba(0,0,0,0.38)",
        "btn-primary": "0 10px 24px rgba(0,0,0,0.32)",
        "btn-primary-hover": "0 14px 34px rgba(0,0,0,0.42)",
        "focus-ring": "0 0 0 3px rgba(184,161,96,0.16)",
      },
      transitionDuration: {
        "instant": "0ms",
        "rapid": "100ms",
        "fast": "200ms",
        "normal": "300ms",
        "smooth": "400ms",
        "slow": "600ms",
        "dramatic": "1000ms",
      },
      transitionTimingFunction: {
        "ds-default": "cubic-bezier(0.4, 0, 0.2, 1)",
        "ds-enter": "cubic-bezier(0.0, 0, 0.2, 1)",
        "ds-exit": "cubic-bezier(0.4, 0, 1, 1)",
        "ds-spring": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        "fade-in": "fadeIn 300ms ease-out both",
        "slide-up": "slideUpFade 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "breathe": "breathe 4000ms ease-in-out infinite",
        "pulse-ring": "pulseRing 3000ms ease-in-out infinite",
        "flicker": "flicker 5000ms infinite",
        "terminal-cursor": "terminalCursor 1100ms steps(1, end) infinite",
        "skeleton": "skeletonShimmer 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "from": { opacity: "0" },
          "to": { opacity: "1" },
        },
        slideUpFade: {
          "from": { opacity: "0", transform: "translateY(8px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { opacity: "var(--breathe-min, 0.4)" },
          "50%": { opacity: "var(--breathe-max, 0.8)" },
        },
        pulseRing: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(184,161,96,0)" },
          "50%": { boxShadow: "0 0 0 2px rgba(184,161,96,0.12)" },
        },
        flicker: {
          "0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%": { opacity: "1" },
          "20%, 22%, 24%, 55%": { opacity: "0.4" },
        },
        terminalCursor: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        skeletonShimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
