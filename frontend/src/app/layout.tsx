import type { Metadata } from 'next';
import './globals.css';
import Layout from '@/components/Layout';
import UserProvider from '@/components/UserProvider';

export const metadata: Metadata = {
  title: {
    template: '%s | BoardCraft',
    default: 'BoardCraft',
  },
  description: '気軽にボードゲームを作ろう',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <Layout>{children}</Layout>
        </UserProvider>
      </body>
    </html>
  );
}
