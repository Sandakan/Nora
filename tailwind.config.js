/** @type {import("tailwindcss").Config} */

// import * as colors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';

export const content = ['./src/renderer/index.html', './src/renderer/src/**/*.{js,jsx,ts,tsx,ejs}'];
export const darkMode = 'selector';
export const theme = {
  screens: {
    // '3xl': { max: '2000px' },
    // // => @media (max-width: 2000px) { ... }
    // '2xl': { max: '1535px' },
    // // => @media (max-width: 1535px) { ... }
    xl: { max: '1279px' },
    // => @media (max-width: 1279px) { ... }
    lg: { max: '1023px' },
    // => @media (max-width: 1023px) { ... }
    md: { max: '900px' },
    // => @media (max-width: 850px) { ... }
    sm: { max: '800px' }
    // => @media (max-width: 639px) { ... }
  },
  extend: {
    colors: {
      'background-color-1': 'hsl(var(--background-color-1) / <alpha-value>)',
      'background-color-2': 'hsl(var(--background-color-2) / <alpha-value>)',
      'background-color-3': 'hsl(var(--background-color-3) / <alpha-value>)',
      'background-color-dimmed': 'hsl(var(--background-color-dimmed) / <alpha-value>)',
      'side-bar-background': 'hsl(var(--side-bar-background) / <alpha-value>)',
      'song-background-color': 'var(--background-color-1)', // not
      'font-color': 'hsl(var(--text-color) / <alpha-value>)',
      'font-color-dimmed': 'hsl(var(--text-color-dimmed) / <alpha-value>)',
      'font-color-black': 'hsl(var(--text-color-black) / <alpha-value>)',
      'font-color-white': 'hsl(var(--text-color-white) / <alpha-value>)',
      'font-color-highlight': 'hsl(var(--text-color-highlight) / <alpha-value>)',
      'font-color-crimson': 'hsl(var(--text-color-crimson) / <alpha-value>)',
      'seekbar-background-color': 'hsl(var(--seekbar-background-color) / <alpha-value>)',
      'seekbar-track-background-color':
        'hsl(var(--seekbar-track-background-color) / <alpha-value>)',
      'dark-font-color-highlight': 'hsl(var(--dark-text-color-highlight) / <alpha-value>)',
      'font-color-highlight-2': 'hsl(var(--text-color-highlight-2) / <alpha-value>)',
      'dark-font-color-highlight-2': 'hsl(var(--dark-text-color-highlight-2) / <alpha-value>)',
      'context-menu-background': 'hsl(var(--context-menu-background) / <alpha-value>)',
      'context-menu-list-hover': 'hsl(var(--context-menu-list-hover) / <alpha-value>)',
      'foreground-color-1': 'hsl(var(--foreground-color-1) / <alpha-value>)',
      'dark-background-color-1': 'hsl(var(--dark-background-color-1) / <alpha-value>)',
      'dark-background-color-2': 'hsl(var(--dark-background-color-2) / <alpha-value>)',
      'dark-background-color-3': 'hsl(var(--dark-background-color-3) / <alpha-value>)',
      'dark-song-background-color': 'hsl(var(--background-color-2) / <alpha-value>)',
      'dark-seekbar-background-color': 'hsl(var(--dark-seekbar-background-color) / <alpha-value>)',
      'dark-seekbar-track-background-color':
        'hsl(var(--dark-seekbar-track-background-color) / <alpha-value>)',
      'dark-side-bar-background': 'hsl(var(--dark-side-bar-background) / <alpha-value>)',
      'dark-font-color': 'hsl(var(--dark-text-color) / <alpha-value>)',
      'dark-font-color-dimmed': 'hsl(var(--dark-text-color-dimmed) / <alpha-value>)',
      'dark-font-color-variant': 'hsl(var(--dark-text-color-variant) / <alpha-value>)',
      'dark-context-menu-background': 'hsl(var(--dark-context-menu-background) / <alpha-value>)',
      'dark-context-menu-list-hover': 'hsl(var(--dark-context-menu-list-hover) / <alpha-value>)'
      // 'background-color-1': 'hsl(0, 0%, 100%)',
      // 'background-color-2': 'hsl(212, 48%, 94%)',
      // 'background-color-3': 'hsl(213, 80%, 88%)',
      // 'background-color-dimmed': 'hsla(0,0%,80%,50%)',
      // 'side-bar-background': 'hsl(212, 50%, 94%)',
      // 'song-background-color': 'var(background-color-1)',
      // 'font-color': 'hsl(0,0%,0%)',
      // 'font-color-dimmed': 'hsl(0,0%,50%)',
      // 'font-color-black': 'hsl(0,0%,0%)',
      // 'font-color-white': 'hsl(0,0%,100%)',
      // 'font-color-highlight': 'hsl(203,39%,44%)',
      // 'font-color-crimson': 'hsl(348, 83%, 47%)',
      // 'seekbar-background-color': 'hsla(210, 17%, 58%, 1)',
      // 'dark-font-color-highlight': 'hsl(213, 80%, 88%)',
      // 'font-color-highlight-2': 'hsl(247,74%,63%)',
      // 'dark-font-color-highlight-2': 'hsl(244,98%,80%)',
      // 'context-menu-background': ' hsla(0, 0%, 100%, 90%)',
      // 'context-menu-list-hover': ' hsl(198, 18%, 89%)',
      // 'foreground-color-1': 'hsl(247,74%,65%)',
      // 'dark-background-color-1': 'hsla(228, 7%, 14%, 100%)',
      // 'dark-background-color-2': 'hsla(225, 8%, 20%, 100%)',
      // 'dark-background-color-3': 'hsla(213, 80%, 88%, 100%)',
      // 'dark-song-background-color': "var('background-color-2')",
      // 'dark-seekbar-background-color': 'hsla(210, 17%, 58%, 1)',
      // 'dark-side-bar-background': 'hsla(228, 7%, 20%, 100%)',
      // 'dark-font-color:': 'hsl(0, 0%, 100%)',
      // 'dark-font-color-dimmed': 'hsl(0,0%,40%)',
      // 'dark-font-color-variant': 'hsl(0, 0%, 0%)',
      // 'dark-context-menu-background': 'hsla(228, 7%, 16%, 90%)',
      // 'dark-context-menu-list-hover': 'hsl(224, 8%, 28%)',
      // sky: colors.sky,
      // cyan: colors.cyan
    },
    animation: {
      'spin-ease': 'spin 1000ms ease-in-out infinite'
    },
    boxShadow: {
      'inner-sm': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
      'inner-md': 'inset 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      'inner-lg': 'inset 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      'inner-xl': 'inset 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      'inner-2xl': 'inset 0 25px 50px -12px rgb(0 0 0 / 0.25)'
    }
  }
};
export const plugins = [
  plugin(({ matchVariant }) => {
    matchVariant(
      'nth',
      (value) => {
        return `&:nth-child(${value})`;
      },
      {
        values: {
          1: '1',
          2: '2',
          3: '3'
        }
      }
    );
  }),
  plugin(({ matchVariant }) => {
    matchVariant(
      'nth-last',
      (value) => {
        return `&:nth-last-child(${value})`;
      },
      {
        values: {
          1: '1',
          2: '2',
          3: '3'
        }
      }
    );
  }),
  plugin(({ matchUtilities, theme }) => {
    matchUtilities(
      {
        'animate-duration': (value) => ({
          animationDuration: value
        })
      },
      { values: theme('transitionDuration') }
    );
    matchUtilities(
      {
        'animate-delay': (value) => ({
          animationDelay: value
        })
      },
      { values: theme('transitionDelay') }
    );
  })
];
