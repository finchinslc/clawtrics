'use client';

import { useEffect, useState } from 'react';

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    // Listen for theme changes from localStorage
    const checkTheme = () => {
      const saved = localStorage.getItem('clawtrics-theme');
      if (saved) {
        setTheme(saved);
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        setTheme('light');
      }
    };
    
    checkTheme();
    
    // Listen for storage changes (from other tabs)
    window.addEventListener('storage', checkTheme);
    
    // Poll for changes within same tab (simpler than custom events)
    const interval = setInterval(checkTheme, 100);
    
    return () => {
      window.removeEventListener('storage', checkTheme);
      clearInterval(interval);
    };
  }, []);
  
  const isDark = theme === 'dark';
  
  return (
    <html lang="en">
      <head>
        <title>Clawtrics - OpenClaw Metrics</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ 
        margin: 0, 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5',
        color: isDark ? '#fafafa' : '#1a1a1a',
        minHeight: '100vh',
        transition: 'background-color 0.3s, color 0.3s',
      }}>
        {children}
      </body>
    </html>
  );
}
