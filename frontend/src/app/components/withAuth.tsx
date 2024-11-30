'use client';

import React, { ComponentType, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function withAuth<P>(WrappedComponent: ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const [user, setUser] = useState<{ username: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      fetch(`${apiUrl}/auth/user`, {
        credentials: 'include',
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.username) {
            setUser(data);
          } else {
            router.replace('/');
          }
        })
        .catch(() => {
          router.replace('/');
        })
        .finally(() => {
          setLoading(false);
        });
    }, [router]);

    if (loading) {
      return null; // ローディング中は何も表示しない
    }

    return <WrappedComponent {...props} user={user} />;
  };
}
