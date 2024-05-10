/** @type {import("prettier").Config} */

const config = {
  plugins: [
    'prettier-plugin-tailwindcss' // MUST come last
  ],

  singleQuote: true,
  semi: true,
  printWidth: 100,
  trailingComma: 'none',
  endOfLine: 'crlf'
};

module.exports = config;
