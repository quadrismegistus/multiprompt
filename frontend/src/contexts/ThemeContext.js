// src/contexts/ThemeContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';

console.log('ThemeContext module loaded');

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  console.log('ThemeProvider rendered');

  const [theme, setTheme] = useState(() => {
    console.log('Initializing theme state');
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    console.log('Initial theme:', initialTheme);
    return initialTheme;
  });

  useEffect(() => {
    console.log('Setting up media query effect');
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      console.log('Media query changed, matches dark mode:', mediaQuery.matches);
    //   if (!localStorage.getItem('theme')) {
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        console.log('Setting new theme based on media query:', newTheme);
        setTheme(newTheme);
    //   }
    };

    mediaQuery.addListener(handleChange);
    console.log('Media query listener added');

    return () => {
      console.log('Cleaning up media query listener');
      mediaQuery.removeListener(handleChange);
    };
  }, []);

  useEffect(() => {
    console.log('Theme changed, updating document and localStorage');
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    console.log('Toggle theme called');
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      console.log('New theme:', newTheme);
      return newTheme;
    });
  };

  console.log('Rendering ThemeContext.Provider with theme:', theme);
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  console.log('useTheme hook called, returned context:', context);
  return context;
};