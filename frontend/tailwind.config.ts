import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // 木箱の色
        wood: {
          lightest: '#E6CCB2', // 最も明るい木目色
          light: '#C8A887', // 明るい木目色
          DEFAULT: '#B08968', // 標準的な木目色
          dark: '#946B4D', // 濃い木目色
          darkest: '#7D4B33', // 最も濃い木目色
        },
        // ヘッダーの色
        header: {
          DEFAULT: '#2C1810', // 深い茶色の背景
          light: '#3D261C', // ホバー時などに使用する少し明るい色
        },
        // メインコンテンツの色
        content: {
          DEFAULT: '#FDF8F3', // 明るいベージュ（メイン背景）
          secondary: '#F5E6D3', // やや暗いベージュ（セカンダリ背景）
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
