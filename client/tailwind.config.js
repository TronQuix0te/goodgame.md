/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        t: {
          bg: '#000000',
          fg: '#E0E0E0',
          dim: '#666666',
          hi: '#FFFFFF',
          mid: '#888888',
          accent: '#FF6B2B',
          red: '#FF4444',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
