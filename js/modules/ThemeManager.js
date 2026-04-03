/**
 * ThemeManager — Manages light/dark theme state.
 * Reads system preference on first visit; persists choice to localStorage.
 */
export class ThemeManager {
  static #KEY = 'quanta-theme';

  static init() {
    const stored   = localStorage.getItem(ThemeManager.#KEY);
    const system   = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    ThemeManager.apply(stored ?? system);
  }

  static apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(ThemeManager.#KEY, theme);
  }

  static toggle() {
    const next = ThemeManager.current() === 'dark' ? 'light' : 'dark';
    ThemeManager.apply(next);
    return next;
  }

  static current() {
    return document.documentElement.getAttribute('data-theme') ?? 'dark';
  }

  /** Returns the icon character appropriate for the current theme. */
  static icon() {
    return ThemeManager.current() === 'dark' ? '☀' : '☾';
  }
}
