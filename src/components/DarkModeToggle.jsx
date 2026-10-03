import React, { useContext } from 'react';
import { Sun, Moon } from '@phosphor-icons/react';
import { ThemeContext } from '../contexts/theme';

const DarkModeToggle = () => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      className="dark-mode-toggle"
      onClick={toggleTheme}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? <Sun size={20} weight="regular" aria-hidden="true" /> : <Moon size={20} weight="regular" aria-hidden="true" />}
    </button>
  );
};

export default DarkModeToggle;
