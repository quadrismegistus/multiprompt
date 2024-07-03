module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'nav-bg': {
          light: '#ffffff',
          dark: '#1a202c',
        },
        'nav-text': {
          light: '#4a5568',
          dark: '#e2e8f0',
        },
        'dropdown-bg': {
          light: '#f7fafc',
          dark: '#2d3748',
        },
        'dropdown-text': {
          light: '#2d3748',
          dark: '#e2e8f0',
        },
        // Add more custom color definitions as needed
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['dark'],
      textColor: ['dark'],
    },
  },
  plugins: [],
}