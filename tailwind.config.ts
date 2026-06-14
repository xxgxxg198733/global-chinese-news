import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 品牌色系 — 深紅色（傳統中國紅 + 現代感）
        brand: {
          50: '#fef2f2',
          100: '#ffe1e1',
          200: '#ffc8c8',
          300: '#ffa3a3',
          400: '#ff6b6b',
          500: '#f83b3b',
          600: '#e51d1d',
          700: '#c11414',
          800: '#a01515',
          900: '#841818',
          950: '#480707',
        },
      },
      fontFamily: {
        sans: [
          'Noto Sans TC',
          'PingFang TC',
          'Microsoft JhengHei',
          'Heiti TC',
          'system-ui',
          'sans-serif',
        ],
        serif: [
          'Noto Serif TC',
          'PingFang TC',
          'Microsoft JhengHei',
          'Heiti TC',
          'Georgia',
          'serif',
        ],
      },
      typography: (theme: (path: string) => unknown) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: theme('colors.gray.800'),
            a: {
              color: theme('colors.brand.600'),
              '&:hover': {
                color: theme('colors.brand.700'),
              },
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
