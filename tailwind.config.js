// Colors are CSS variables so light/dark themes swap at runtime. The helper
// keeps Tailwind opacity modifiers (e.g. bg-brand-accent/10) working via color-mix.
const v = (name) => ({ opacityValue }) =>
  opacityValue === undefined || opacityValue === '1'
    ? `var(${name})`
    : `color-mix(in srgb, var(${name}) calc(${opacityValue} * 100%), transparent)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          primary: v('--bg-primary'),
          secondary: v('--bg-secondary'),
          tertiary: v('--bg-tertiary'),
          elevated: v('--bg-elevated'),
        },
        content: {
          primary: v('--text-primary'),
          secondary: v('--text-secondary'),
          muted: v('--text-muted'),
        },
        typography: {
          primary: v('--text-primary'),
          secondary: v('--text-secondary'),
        },
        brand: {
          accent: v('--accent'),
          strong: v('--accent-strong'),
          bright: v('--accent-bright'),
          highlight: v('--highlight'),
          // Legacy names used by some admin/owner screens
          text: v('--text-primary'),
          'text-secondary': v('--text-secondary'),
          bg1: v('--bg-primary'),
          bg2: v('--bg-secondary'),
          bg3: v('--bg-tertiary'),
        },
        surface: v('--surface'),
        danger: v('--danger'),
        success: v('--success'),
        'on-accent': v('--on-accent'),
        'border-subtle': v('--border-subtle'),
      },
      borderColor: {
        subtle: v('--border-subtle'),
        strong: v('--border-strong'),
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Figtree', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: 'var(--shadow-sm)',
        lift: 'var(--shadow-md)',
        float: 'var(--shadow-lg)',
      },
      borderRadius: {
        card: 'var(--radius)',
        panel: 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
};
