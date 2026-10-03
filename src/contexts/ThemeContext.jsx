import React, { useState, useEffect } from 'react';
import { ThemeContext } from './theme';

const readSaved = () => {
  try {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const systemPrefersDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

export const ThemeProvider = ({ children }) => {
  // Follows the system setting until the visitor uses the toggle; the inline script in index.html applies it before paint.
  const [isDarkMode, setIsDarkMode] = useState(() => readSaved() ?? systemPrefersDark());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-dark', isDarkMode ? '1' : '0');
  }, [isDarkMode]);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return undefined;
    const onChange = (e) => {
      if (readSaved() === null) setIsDarkMode(e.matches);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('darkMode', JSON.stringify(next));
      } catch {
        // Storage can be unavailable (private mode); the toggle still works for this visit.
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
