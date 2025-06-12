type OperationMetrics = {
  count: number;
  totalTime: number;
  minTime: number;
  maxTime: number;
  lastTime: number;
  avgTime: number;
};

class PerformanceTracker {
  private metrics: Record<string, OperationMetrics> = {};
  private listeners: Array<
    (metrics: Record<string, OperationMetrics>) => void
  > = [];

  measure<T>(operationName: string, fn: () => T): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(operationName, duration);
    }
  }

  async measureAsync<T>(
    operationName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(operationName, duration);
    }
  }

  private recordMetric(operationName: string, duration: number) {
    if (!this.metrics[operationName]) {
      this.metrics[operationName] = {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        lastTime: 0,
        avgTime: 0,
      };
    }

    const metric = this.metrics[operationName];
    metric.count++;
    metric.totalTime += duration;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.lastTime = duration;
    metric.avgTime = metric.totalTime / metric.count;

    this.notifyListeners();
  }

  subscribe(listener: (metrics: Record<string, OperationMetrics>) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener({ ...this.metrics });
      } catch (error) {
        console.warn('Performance tracker listener error:', error);
      }
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {};
    this.notifyListeners();
  }

  resetMetric(operationName: string) {
    delete this.metrics[operationName];
    this.notifyListeners();
  }
}

export const performanceTracker = new PerformanceTracker();
export type { OperationMetrics };
