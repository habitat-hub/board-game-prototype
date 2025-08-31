import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        kibako: {
          primary: '#5B3A29', // ダークブラウン（ヘッダー、ボタン）
          secondary: '#A98363', // 中間色（ボタン、テキスト）
          accent: '#C9713C', // アクセント
          tertiary: '#EFE8DE', // ベース背景色（明るめ）
          white: '#F5F0E9', // テキスト
        },
      },
      // 木箱のグラデーション
      backgroundImage: {
        'wood-grain':
          'linear-gradient(45deg, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
