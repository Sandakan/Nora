/** @type {import("tailwindcss").Config} */

const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx,ejs}'],
  darkMode: 'class',
  theme: {
    colors: {
      'background-color-1': 'hsl(0, 0%, 100%)',
      'background-color-2': 'hsl(212, 48%, 94%)',
      'background-color-3': 'hsl(213, 80%, 88%)',
      'background-color-dimmed': 'hsla(0,0%,80%,50%)',
      'side-bar-background': 'hsl(212, 50%, 94%)',
      'song-background-color': 'var(background-color-1)',
      'font-color': 'hsl(0,0%,0%)',
      'font-color-dimmed': 'hsl(0,0%,50%)',
      'font-color-black': 'hsl(0,0%,0%)',
      'font-color-white': 'hsl(0,0%,100%)',
      'font-color-highlight': 'hsl(203,39%,44%)',
      'font-color-crimson': 'hsl(348, 83%, 47%)',
      'dark-font-color-highlight': 'hsl(213, 80%, 88%)',
      'font-color-highlight-2': 'hsl(247,74%,63%)',
      'dark-font-color-highlight-2': 'hsl(244,98%,80%)',
      'context-menu-background': ' hsla(0, 0%, 100%, 90%)',
      'context-menu-list-hover': ' hsl(198, 18%, 89%)',
      'foreground-color-1': 'hsl(247,74%,65%)',
      'dark-background-color-1': 'hsla(228, 7%, 14%, 100%)',
      'dark-background-color-2': 'hsla(225, 8%, 20%, 100%)',
      'dark-background-color-3': 'hsla(213, 80%, 88%, 100%)',
      'dark-song-background-color': "var('background-color-2')",
      'dark-side-bar-background': 'hsla(228, 7%, 20%, 100%)',
      'dark-font-color:': 'hsl(0, 0%, 100%)',
      'dark-font-color-dimmed': 'hsl(0,0%,40%)',
      'dark-font-color-variant': 'hsl(0, 0%, 0%)',
      'dark-context-menu-background': 'hsla(228, 7%, 16%, 90%)',
      'dark-context-menu-list-hover': 'hsl(224, 8%, 28%)',
    },
    screens: {
      '2xl': { max: '1535px' },
      // => @media (max-width: 1535px) { ... }

      xl: { max: '1279px' },
      // => @media (max-width: 1279px) { ... }

      lg: { max: '1023px' },
      // => @media (max-width: 1023px) { ... }

      md: { max: '900px' },
      // => @media (max-width: 850px) { ... }

      sm: { max: '639px' },
      // => @media (max-width: 639px) { ... }
    },
    extend: {
      animation: {
        'spin-ease': 'spin 1000ms ease-in-out infinite',
        'dialog-appear-ease-in-out': 'dialogAppear 200ms ease',
        'dialog-dissappear-ease-in-out': 'dialogDisappear 200ms ease',
        'bg-image-appear': 'appearBackgroundImage 500ms ease forwards',
      },
      colors: {
        sky: colors.sky,
        cyan: colors.cyan,
      },
    },
  },
  plugins: [],
};
