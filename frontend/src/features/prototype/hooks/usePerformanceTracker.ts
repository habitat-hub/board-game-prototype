'use client';

import { useState, useEffect } from 'react';

import {
  performanceTracker,
  OperationMetrics,
} from '../utils/performanceTracker';

export const usePerformanceTracker = () => {
  const [metrics, setMetrics] = useState<Record<string, OperationMetrics>>(
    performanceTracker.getMetrics()
  );

  useEffect(() => {
    const unsubscribe = performanceTracker.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    return unsubscribe;
  }, []);

  const resetMetrics = () => {
    performanceTracker.reset();
  };

  const resetMetric = (operationName: string) => {
    performanceTracker.resetMetric(operationName);
  };

  const measureOperation = <T>(operationName: string, fn: () => T): T => {
    return performanceTracker.measure(operationName, fn);
  };

  const measureAsyncOperation = async <T>(
    operationName: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return performanceTracker.measureAsync(operationName, fn);
  };

  return {
    metrics,
    resetMetrics,
    resetMetric,
    measureOperation,
    measureAsyncOperation,
  };
};
