/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./website/index.html",
    "./website/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Background tokens
        bg: 'var(--background-base)',
        surface: 'var(--background-surface)',
        surface2: 'var(--background-surface2)',
        surfaceHover: 'var(--background-surface-hover)',
        surfaceActive: 'var(--background-surface-active)',

        // Foreground tokens
        fg: 'var(--foreground-base)',
        muted: 'var(--foreground-muted)',
        subtle: 'var(--foreground-subtle)',

        // Border tokens
        border: 'var(--border-base)',
        borderStrong: 'var(--border-strong)',

        // Brand tokens
        primary: 'var(--brand-primary)',
        primaryHover: 'var(--brand-primary-hover)',
        primaryFg: 'var(--brand-primary-foreground)',

        // Semantic tokens
        success: 'var(--semantic-success)',
        successBg: 'var(--semantic-success-bg)',
        warning: 'var(--semantic-warning)',
        warningBg: 'var(--semantic-warning-bg)',
        error: 'var(--semantic-error)',
        errorBg: 'var(--semantic-error-bg)',
        info: 'var(--semantic-info)',
        infoBg: 'var(--semantic-info-bg)',

        // Legacy grays (for compatibility)
        gray: {
          750: '#2d3748',
          850: '#1a202c',
          950: '#0d1117',
        }
      },
      boxShadow: {
        'focus': '0 0 0 3px var(--focus-ring)',
      }
    },
  },
  plugins: [],
}

