// tailwind.config.js - Tailwind v4 CSS-First Configuration  
// CSS tokens are defined in src/lib/styles/tokens.css
export default {
  // Let CSS-first handle everything via @import in Vite plugin
  content: [], // Not needed in v4 CSS-first mode
  
  // CSS-first config only needs to specify non-standard plugin requirements
  plugins: [
    // Only keep essential plugins that extend CSS-first functionality
    require('tailwindcss-animate'), // For animation utilities not in core
  ],
};