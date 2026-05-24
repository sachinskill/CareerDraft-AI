/**
 * Template Configuration System
 * 
 * Predefined layouts:
 *   - Executive
 *   - Minimal ATS
 *   - Corporate
 *   - Sidebar Modern
 *   - Elegant
 *   - Technical
 *   - Compact ATS
 */

// ── Themes ────────────────────────────────────────────────────────────────────
export const THEMES = {
  slate: {
    id: "slate",
    name: "Slate Gray",
    primary: "#475569",
    accent: "#334155",
    light: "#f8fafc",
    text: "#1e293b",
  },
  blue: {
    id: "blue",
    name: "Ocean Blue",
    primary: "#2563eb",
    accent: "#1e40af",
    light: "#eff6ff",
    text: "#1e3a8a",
  },
  purple: {
    id: "purple",
    name: "Royal Purple",
    primary: "#7c3aed",
    accent: "#5b21b6",
    light: "#f5f3ff",
    text: "#4c1d95",
  },
  emerald: {
    id: "emerald",
    name: "Emerald Green",
    primary: "#059669",
    accent: "#047857",
    light: "#ecfdf5",
    text: "#064e3b",
  },
  rose: {
    id: "rose",
    name: "Rose Red",
    primary: "#e11d48",
    accent: "#be123c",
    light: "#fff1f2",
    text: "#881337",
  },
  dark: {
    id: "dark",
    name: "Charcoal Dark",
    primary: "#1e293b",
    accent: "#0f172a",
    light: "#f1f5f9",
    text: "#0f172a",
  }
};

// ── Fonts ─────────────────────────────────────────────────────────────────────
export const FONTS = {
  inter: {
    id: "inter",
    name: "Inter (Sans)",
    stack: "'Inter', system-ui, sans-serif",
    googleUrl: null, // preloaded
  },
  poppins: {
    id: "poppins",
    name: "Poppins (Modern)",
    stack: "'Poppins', sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
  },
  lato: {
    id: "lato",
    name: "Lato (Classic)",
    stack: "'Lato', sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap",
  },
  merriweather: {
    id: "merriweather",
    name: "Merriweather (Serif)",
    stack: "'Merriweather', Georgia, serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap",
  }
};

// ── Template catalog ──────────────────────────────────────────────────────────
export const TEMPLATES = [
  {
    id: "executive",
    name: "Executive",
    description: "Premium serif typography with structural slate accents designed for leaders.",
    layout: "executive",
    badge: "Popular",
    categories: ["professional", "executive"]
  },
  {
    id: "minimal-ats",
    name: "Minimal ATS",
    description: "Clean single-column standard template optimized for maximum readability and keyword parsing.",
    layout: "minimal-ats",
    badge: "ATS-Friendly",
    categories: ["ats-friendly", "minimal"]
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Classic structured header bands and horizontal dividers preferred by recruitment teams.",
    layout: "corporate",
    badge: "Classic",
    categories: ["professional", "executive"]
  },
  {
    id: "sidebar-modern",
    name: "Sidebar Modern",
    description: "Bold two-column layout highlighting contacts and skills in a prominent sidebar.",
    layout: "sidebar-modern",
    badge: "Trending",
    categories: ["modern", "creative"]
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Centred headlines with traditional serif typography for a sophisticated academic look.",
    layout: "elegant",
    badge: null,
    categories: ["minimal", "creative"]
  },
  {
    id: "technical",
    name: "Technical",
    description: "Optimised layout featuring high-density skills grid for developers and engineers.",
    layout: "technical",
    badge: null,
    categories: ["modern", "ats-friendly"]
  },
  {
    id: "compact-ats",
    name: "Compact ATS",
    description: "High-density single-column template optimized to fit extensive career histories on one page.",
    layout: "compact-ats",
    badge: null,
    categories: ["ats-friendly", "minimal"]
  }
];

/** Look up a template config by id. Falls back to the first template. */
export const getTemplate = (id) =>
  TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
