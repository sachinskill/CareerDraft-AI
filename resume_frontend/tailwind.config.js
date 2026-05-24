/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "app-gradient": "linear-gradient(135deg, #eff6ff 0%, #ffffff 45%, #faf5ff 100%)",
        "brand-gradient": "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
        "brand-gradient-hover": "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 4px 16px 0 rgb(0 0 0 / 0.06)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 8px 32px 0 rgb(0 0 0 / 0.10)",
        "brand": "0 4px 14px 0 rgb(99 102 241 / 0.35)",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        saas: {
          "primary":          "#6366f1",   // indigo-500
          "primary-content":  "#ffffff",
          "secondary":        "#8b5cf6",   // violet-500
          "secondary-content":"#ffffff",
          "accent":           "#ec4899",   // pink-500
          "accent-content":   "#ffffff",
          "neutral":          "#374151",   // gray-700
          "neutral-content":  "#ffffff",
          "base-100":         "#ffffff",
          "base-200":         "#f8fafc",   // slate-50
          "base-300":         "#e2e8f0",   // slate-200
          "base-content":     "#1e293b",   // slate-800
          "info":             "#0ea5e9",
          "info-content":     "#ffffff",
          "success":          "#10b981",
          "success-content":  "#ffffff",
          "warning":          "#f59e0b",
          "warning-content":  "#ffffff",
          "error":            "#ef4444",
          "error-content":    "#ffffff",
        },
      },
      "light",
      "night",
    ],
    darkTheme: "night",
  },
};
