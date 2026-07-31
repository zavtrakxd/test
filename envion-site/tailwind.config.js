/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "Bricolage Grotesque",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        hand: ["Caveat", "ui-serif", "cursive"],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      colors: {
        envion: {
          bg: "#070716",
          panel: "#0d0e22",
          line: "#1a1c34",
          pink: "#ff8fb1",
          pinkSoft: "#ffc1d1",
          cyan: "#7dd3fc",
          purple: "#c4b5fd",
          lime: "#bef264",
        },
      },
      boxShadow: {
        glowPink: "0 0 60px -10px rgba(255, 143, 177, 0.55)",
        glowCyan: "0 0 60px -10px rgba(125, 211, 252, 0.45)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px) rotate(-2deg)" },
          "50%": { transform: "translateY(-22px) rotate(3deg)" },
        },
        bubbleUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "20%": { opacity: "0.7" },
          "100%": { transform: "translateY(-340px)", opacity: "0" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "1" },
        },
        gridmove: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "60px 60px" },
        },
        wag: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        floatSlow: "floatSlow 9s ease-in-out infinite",
        bubbleUp: "bubbleUp linear infinite",
        twinkle: "twinkle 3s ease-in-out infinite",
        gridmove: "gridmove 22s linear infinite",
        wag: "wag 3.5s ease-in-out infinite",
        shimmer: "shimmer 4s linear infinite",
      },
    },
  },
  plugins: [],
};
