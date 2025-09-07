import { useEffect, useState } from 'react';

import { isPCFromNavigator } from '@/utils/device';

/**
 * 現在のデバイスがPCかどうかを判定するフック。
 * SSRのハイドレーション不整合を避けるため `isReady` を提供する。
 */
export function useIsPC(): Readonly<{ isPC: boolean; isReady: boolean }> {
  const [isPC, setIsPC] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const result = isPCFromNavigator();
    if (result === null) {
      // Cannot determine in SSR; keep default and just mark ready
      setIsPC(true);
    } else {
      setIsPC(result);
    }
    setIsReady(true);
  }, []);

  return { isPC, isReady } as const;
}
