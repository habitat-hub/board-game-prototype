import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | KIBAKO',
    default: 'KIBAKO',
  },
  description:
    '気軽にボードゲームを作ろう - オンラインでボードゲームの試作品を作成、テストプレイ、共同編集できるアプリケーション',
  keywords: [
    'ボードゲーム',
    '試作品',
    'テストプレイ',
    'プロトタイプ',
    'ゲーム作成',
    '共同編集',
    'オンラインテスト',
  ],
  authors: [{ name: 'habitat-hub' }],
  creator: 'habitat-hub',
  publisher: 'habitat-hub',

  // カノニカルURL
  metadataBase: new URL('https://kibako.habitat-hub.com'),
  alternates: {
    canonical: '/about',
  },

  // Open Graph
  openGraph: {
    type: 'website',
    siteName: 'KIBAKO',
    title: 'KIBAKO - ボードゲーム試作品作成アプリ',
    description:
      '気軽にボードゲームを作ろう - アイデアを素早く試作品に。ボードゲームをオンライン上で作成し、繰り返しテストプレイできます。',
    url: 'https://kibako.habitat-hub.com/about',
    images: [
      {
        url: '/og-image.jpg', // 必要に応じて実際の画像パスに更新してください
        width: 1200,
        height: 630,
        alt: 'KIBAKO - ボードゲーム試作品作成アプリ',
      },
    ],
    locale: 'ja_JP',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'KIBAKO - ボードゲーム試作品作成アプリ',
    description:
      '気軽にボードゲームを作ろう - アイデアを素早く試作品に。ボードゲームをオンライン上で作成し、繰り返しテストプレイできます。',
    images: ['/og-image.jpg'], // 必要に応じて実際の画像パスに更新してください
  },

  // アイコン設定
  icons: [{ rel: 'icon', url: '/favicon.ico' }],

  // ロボット設定
  robots: {
    index: true,
    follow: true,
  },

  // アプリケーション情報
  applicationName: 'KIBAKO',
  category: 'ボードゲーム',

  // その他のメタデータ
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};
