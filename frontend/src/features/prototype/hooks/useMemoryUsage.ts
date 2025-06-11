'use client';

import { useEffect, useState } from 'react';

interface MemoryInfo {
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
  usedPercentage?: number;
}

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

export const useMemoryUsage = (updateInterval: number = 2000) => {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo>({});
  const [deviceMemory, setDeviceMemory] = useState<number | undefined>();

  useEffect(() => {
    // updateInterval が 0 の場合は監視を無効化
    if (updateInterval === 0) {
      return;
    }

    const updateMemoryInfo = () => {
      if (
        typeof window !== 'undefined' &&
        window.performance &&
        'memory' in window.performance
      ) {
        const memory = (performance as PerformanceWithMemory).memory;
        if (memory) {
          const usedPercentage =
            memory.jsHeapSizeLimit > 0
              ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
              : undefined;

          setMemoryInfo({
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            totalJSHeapSize: memory.totalJSHeapSize,
            usedJSHeapSize: memory.usedJSHeapSize,
            usedPercentage,
          });
        }
      }
    };

    // デバイスメモリ情報の取得
    if (
      'navigator' in window &&
      'deviceMemory' in (navigator as NavigatorWithMemory)
    ) {
      setDeviceMemory((navigator as NavigatorWithMemory).deviceMemory);
    }

    // 最初に一度実行
    updateMemoryInfo();

    // 定期的に更新
    const intervalId = setInterval(updateMemoryInfo, updateInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [updateInterval]);

  // メモリサイズをMBに変換する関数
  const formatMemory = (bytes?: number) => {
    if (bytes === undefined) return 'N/A';
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // メモリサイズをGBに変換する関数
  const formatMemoryGB = (gb?: number) => {
    if (gb === undefined) return 'N/A';
    return `${gb} GB`;
  };

  return {
    memoryInfo,
    deviceMemory,
    formatMemory,
    formatMemoryGB,
  };
};
