// Theme utility to apply dynamic theme colors and dark mode
export const themePresets = {
  pink: {
    primary: '#ec4899',
    primaryDark: '#db2777',
    primaryLight: '#f472b6',
    background: '#fff5f8',
    surface: '#ffffff',
    surfaceAlt: '#fdf2f8',
    text: '#1f2937',
    textMuted: '#6b7280'
  },
  purple: {
    primary: '#9333ea',
    primaryDark: '#7e22ce',
    primaryLight: '#a855f7',
    background: '#f5f3ff',
    surface: '#ffffff',
    surfaceAlt: '#f3e8ff',
    text: '#1f2937',
    textMuted: '#6b7280'
  },
  blue: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa',
    background: '#eff6ff',
    surface: '#ffffff',
    surfaceAlt: '#dbeafe',
    text: '#1f2937',
    textMuted: '#6b7280'
  },
  emerald: {
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#34d399',
    background: '#ecfdf5',
    surface: '#ffffff',
    surfaceAlt: '#d1fae5',
    text: '#1f2937',
    textMuted: '#6b7280'
  },
  rose: {
    primary: '#e11d48',
    primaryDark: '#be123c',
    primaryLight: '#f43f5e',
    background: '#fff1f2',
    surface: '#ffffff',
    surfaceAlt: '#ffe4e6',
    text: '#1f2937',
    textMuted: '#6b7280'
  },
  amber: {
    primary: '#f59e0b',
    primaryDark: '#d97706',
    primaryLight: '#fbbf24',
    background: '#fffbeb',
    surface: '#ffffff',
    surfaceAlt: '#fef3c7',
    text: '#1f2937',
    textMuted: '#6b7280'
  },
  lavender: {
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    primaryLight: '#c084fc',
    background: '#faf5ff',
    surface: '#ffffff',
    surfaceAlt: '#f3e8ff',
    text: '#1f2937',
    textMuted: '#6b7280'
  },
  forest: {
    primary: '#16a34a',
    primaryDark: '#15803d',
    primaryLight: '#4ade80',
    background: '#f0fdf4',
    surface: '#ffffff',
    surfaceAlt: '#dcfce7',
    text: '#1f2937',
    textMuted: '#6b7280'
  },
  saffron: {
    primary: '#f97316',
    primaryDark: '#ea580c',
    primaryLight: '#fb923c',
    background: '#fff7ed',
    surface: '#ffffff',
    surfaceAlt: '#ffedd5',
    text: '#1f2937',
    textMuted: '#6b7280'
  },
  midnight: {
    primary: '#0f172a',
    primaryDark: '#020817',
    primaryLight: '#334155',
    background: '#020817',
    surface: '#0f172a',
    surfaceAlt: '#111827',
    text: '#e2e8f0',
    textMuted: '#94a3b8'
  }
};

export const applyTheme = () => {
  const savedSettings = localStorage.getItem('appSettings');
  const settings = savedSettings ? JSON.parse(savedSettings) : {};
  const theme = settings.theme || 'pink';
  const themeMode = settings.themeMode || (theme === 'midnight' ? 'dark' : 'light');
  const selectedTheme = themePresets[theme] || themePresets.pink;
  const isDarkMode = themeMode === 'dark' || theme === 'midnight';

  document.documentElement.style.setProperty('--color-primary', selectedTheme.primary);
  document.documentElement.style.setProperty('--color-primary-dark', selectedTheme.primaryDark);
  document.documentElement.style.setProperty('--color-primary-light', selectedTheme.primaryLight);
  document.documentElement.style.setProperty('--color-app-bg', isDarkMode ? '#020817' : selectedTheme.background);
  document.documentElement.style.setProperty('--color-surface', isDarkMode ? '#0f172a' : selectedTheme.surface);
  document.documentElement.style.setProperty('--color-surface-alt', isDarkMode ? '#111827' : selectedTheme.surfaceAlt);
  document.documentElement.style.setProperty('--color-text', isDarkMode ? '#e2e8f0' : selectedTheme.text);
  document.documentElement.style.setProperty('--color-text-muted', isDarkMode ? '#94a3b8' : selectedTheme.textMuted);

  document.body.style.background = isDarkMode ? '#020817' : selectedTheme.background;
  document.body.style.color = isDarkMode ? '#e2e8f0' : selectedTheme.text;
  document.body.classList.toggle('dark-theme', isDarkMode);

  return selectedTheme;
};

export default applyTheme;
