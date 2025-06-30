/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00514A",  // Darker green from the UI
          light: "#007166",
          dark: "#003C36",
          50: "#E6F0EF",
          100: "#CCE1DF",
          200: "#99C3BF",
          300: "#66A59F",
          400: "#33877F",
          500: "#00695F",
          600: "#00514A",  // DEFAULT value
          700: "#003C36",
          800: "#002824",
          900: "#001412"
        },
        secondary: {
          DEFAULT: "#F0F0F0",
          dark: "#E0E0E0"
        }
      },
      scale: {
        '102': '1.02',
      },
    },
  },
  plugins: [],
}
