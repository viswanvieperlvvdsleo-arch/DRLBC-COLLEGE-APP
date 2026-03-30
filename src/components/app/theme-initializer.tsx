"use client";

import React from "react";

export function ThemeInitializer() {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'white' || savedTheme === 'black') {
      document.documentElement.classList.add(savedTheme);
    } else if (!savedTheme) {
      document.documentElement.classList.add('white');
      localStorage.setItem('theme', 'white');
    }
  }, []);
  return null;
}
