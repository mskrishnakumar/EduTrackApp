/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          DEFAULT: '#10B981',
          dark: '#059669',
          light: '#D1FAE5',
        },
        // Secondary colors (blue)
        secondary: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
        },
        // Success colors
        success: {
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        // Warning colors
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        // Info colors
        info: {
          DEFAULT: '#06B6D4',
        },
        // Sidebar colors
        sidebar: {
          DEFAULT: '#FFFFFF',
          hover: '#F9FAFB',
          active: '#FEF3C7',
        },
        // Gray background
        'gray-bg': '#F7F8FA',
        'gray-border': '#E5E7EB',
        // Text colors
        'text-primary': '#1F2937',
        'text-secondary': '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'nav': ['0.8125rem', { lineHeight: '1.5' }],
        'body': ['0.875rem', { lineHeight: '1.6' }],
      },
      spacing: {
        'sidebar': '240px',
        'sidebar-collapsed': '64px',
        'topbar': '72px',
      },
      borderRadius: {
        'card': '14px',
        'input': '10px',
        'badge': '6px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
