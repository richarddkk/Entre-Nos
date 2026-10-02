export const THEME_KEY = 'entre-nos-theme';
export function preferredTheme(saved, prefersDark = false) {
  return saved === 'light' || saved === 'dark' ? saved : prefersDark ? 'dark' : 'light';
}
export function readTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch {}
  return preferredTheme(saved, window.matchMedia('(prefers-color-scheme: dark)').matches);
}
export function applyTheme(theme, persist = false) {
  const value = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = value;
  document.documentElement.style.colorScheme = value;
  if (persist) { try { localStorage.setItem(THEME_KEY, value); } catch {} }
  return value;
}
