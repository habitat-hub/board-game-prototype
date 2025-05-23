import React from 'react';

import ClientLayout from '@/components/layouts/ClientLayout';
import { UserProvider } from '@/contexts/UserContext';

import './globals.css';
import { metadata } from './metadata';

export { metadata };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <UserProvider>
          <ClientLayout>{children}</ClientLayout>
        </UserProvider>
      </body>
    </html>
  );
}
