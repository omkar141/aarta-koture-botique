// Theme utility to apply dynamic theme colors
export const applyTheme = () => {
  const savedSettings = localStorage.getItem('appSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    const theme = settings.theme || 'pink';
    
    const themes = {
      pink: {
        primary: '#ec4899',
        primaryDark: '#db2777',
        primaryLight: '#f472b6'
      },
      purple: {
        primary: '#9333ea',
        primaryDark: '#7e22ce',
        primaryLight: '#a855f7'
      },
      blue: {
        primary: '#3b82f6',
        primaryDark: '#2563eb',
        primaryLight: '#60a5fa'
      },
      emerald: {
        primary: '#10b981',
        primaryDark: '#059669',
        primaryLight: '#34d399'
      },
      rose: {
        primary: '#e11d48',
        primaryDark: '#be123c',
        primaryLight: '#f43f5e'
      },
      amber: {
        primary: '#f59e0b',
        primaryDark: '#d97706',
        primaryLight: '#fbbf24'
      }
    };

    const selectedTheme = themes[theme] || themes.pink;
    
    // Apply CSS variables to root
    document.documentElement.style.setProperty('--color-primary', selectedTheme.primary);
    document.documentElement.style.setProperty('--color-primary-dark', selectedTheme.primaryDark);
    document.documentElement.style.setProperty('--color-primary-light', selectedTheme.primaryLight);
    
    return selectedTheme;
  }
  
  // Default theme
  return {
    primary: '#ec4899',
    primaryDark: '#db2777',
    primaryLight: '#f472b6'
  };
};

export default applyTheme;
