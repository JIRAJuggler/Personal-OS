/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,html}', './index.html'],
  theme: {
    extend: {
      colors: {
        bg: '#0d0d0d',
        surface: '#141414',
        'surface-2': '#1a1a1a',
        accent: '#f97316',
        'text-primary': '#e8e6e1',
        'text-muted': '#888580',
        'text-faint': '#4a4845',
        success: '#22c55e',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
}
