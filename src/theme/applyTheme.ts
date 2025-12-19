/**
 * Theme System - Apply theme tokens to CSS variables
 */

type ThemeTokens = Record<string, Record<string, string>>;

/**
 * Converts camelCase to kebab-case for CSS variables
 */
function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}

/**
 * Applies theme tokens to document root as CSS variables
 * Example: { background: { base: '#fff' } } → --background-base: #fff
 */
export function applyTheme(tokens: ThemeTokens): void {
  const root = document.documentElement;

  Object.entries(tokens).forEach(([group, values]) => {
    if (typeof values === 'object' && values !== null) {
      Object.entries(values).forEach(([key, value]) => {
        const cssVar = `--${toKebabCase(group)}-${toKebabCase(key)}`;
        root.style.setProperty(cssVar, value);
      });
    }
  });
}

/**
 * Removes theme tokens from document root
 */
export function clearTheme(tokens: ThemeTokens): void {
  const root = document.documentElement;

  Object.entries(tokens).forEach(([group, values]) => {
    if (typeof values === 'object' && values !== null) {
      Object.entries(values).forEach(([key]) => {
        const cssVar = `--${toKebabCase(group)}-${toKebabCase(key)}`;
        root.style.removeProperty(cssVar);
      });
    }
  });
}
