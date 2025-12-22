/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "c:/Users/mafhp/Documents/GitHub/port-command/packages/quality-core/dashboard/public/index.html",
        "c:/Users/mafhp/Documents/GitHub/port-command/packages/quality-core/dashboard/public/**/*.js"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace']
            },
            colors: {
                // Background tokens
                background: 'var(--background-base)',
                surface: 'var(--background-surface)',
                'surface-2': 'var(--background-surface-2)',
                'surface-hover': 'var(--background-surface-hover)',
                'surface-active': 'var(--background-surface-active)',

                // Foreground tokens
                foreground: 'var(--foreground-base)',
                muted: 'var(--foreground-muted)',
                subtle: 'var(--foreground-subtle)',

                // Border tokens
                border: 'var(--border-base)',
                'border-strong': 'var(--border-strong)',
                'border-subtle': 'var(--border-subtle)',

                // Brand colors
                primary: 'var(--color-primary)',
                'primary-hover': 'var(--color-primary-hover)',
                'primary-glow': 'var(--color-primary-glow)',
                secondary: 'var(--color-secondary)',
                accent: 'var(--color-accent)',

                // Semantic colors
                success: 'var(--color-success)',
                warning: 'var(--color-warning)',
                error: 'var(--color-error)',
                info: 'var(--color-info)',
            },
            boxShadow: {
                'glow': '0 0 20px var(--color-primary-glow)',
                'glow-lg': '0 0 40px var(--color-primary-glow)',
            },
            borderRadius: {
                'lg': 'var(--radius-lg)',
                'xl': 'var(--radius-xl)',
            }
        }
    },
    plugins: [],
}
