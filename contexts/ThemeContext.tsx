import React, { createContext, useContext, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  theme, 
  onToggleTheme 
}) => {
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: onToggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};