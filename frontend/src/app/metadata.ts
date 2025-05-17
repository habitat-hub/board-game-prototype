import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | KIBAKO',
    default: 'KIBAKO',
  },
  description: '気軽にボードゲームを作ろう',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};
