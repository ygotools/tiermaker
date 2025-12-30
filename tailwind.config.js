export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        sm: '640px',
        md: '620px', // 既存の設定を変える場合、ここを変更
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [
    function ({ addVariant, e }) {
      addVariant('export-md', ({ modifySelectors, separator }) => {
        modifySelectors(({ className }) => {
          return `.export .${e(`md${separator}${className}`)}`;
        });
      });
    },
  ],
}
