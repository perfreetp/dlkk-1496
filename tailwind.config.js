/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#1e3a5f",
          600: "#1e40af",
          700: "#1e3a8a",
          800: "#1e3a5f",
          900: "#172554",
        },
        critical: {
          red: "#dc2626",
          redLight: "#fef2f2",
          orange: "#ea580c",
          orangeLight: "#fff7ed",
          yellow: "#ca8a04",
          yellowLight: "#fefce8",
          success: "#16a34a",
          successLight: "#f0fdf4",
        },
      },
      fontFamily: {
        sans: ['"Source Han Sans CN"', '"Noto Sans SC"', "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', '"SF Mono"', "Menlo", "monospace"],
      },
      keyframes: {
        pulseBorder: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(220, 38, 38, 0.5)" },
          "50%": { boxShadow: "0 0 0 6px rgba(220, 38, 38, 0)" },
        },
        blinkBg: {
          "0%, 100%": { backgroundColor: "#fef2f2" },
          "50%": { backgroundColor: "#fee2e2" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeInUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        bounceNumber: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
        },
      },
      animation: {
        "pulse-border": "pulseBorder 1.5s ease-in-out infinite",
        "blink-bg": "blinkBg 1.2s ease-in-out infinite",
        "slide-in-left": "slideInLeft 0.4s ease-out",
        "fade-in-up": "fadeInUp 0.35s ease-out",
        "bounce-number": "bounceNumber 0.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
