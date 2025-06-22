module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        noto: ['"Noto Sans"', 'sans-serif'],
        mono: ['"Noto Sans Mono"', 'monospace'],
        ipa: ['"Noto Sans IPA"', 'sans-serif'],
      },
      animation: {
        'star-movement-bottom': 'star-movement-bottom 6s linear infinite alternate',
        'star-movement-top': 'star-movement-top 6s linear infinite alternate',
      },
      keyframes: {
        'star-movement-bottom': {
          '0%': { transform: 'translateX(0%)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0.2' },
        },
        'star-movement-top': {
          '0%': { transform: 'translateX(0%)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0.2' },
        },
      },
    },
  },
  plugins: [],
};
