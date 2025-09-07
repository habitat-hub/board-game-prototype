import { useEffect, useState } from 'react';
import { isPCFromNavigator } from '@/utils/device';

/**
 * React hook to detect if the current device is a PC (desktop).
 * Provides an `isReady` flag to avoid SSR hydration mismatches.
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
