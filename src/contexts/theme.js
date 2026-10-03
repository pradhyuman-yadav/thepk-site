import { createContext, useContext } from 'react';

// Context object and hook live apart from ThemeProvider so the provider file only exports a component
export const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);
