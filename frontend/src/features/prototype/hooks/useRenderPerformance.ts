'use client';

import { useEffect, useState, useRef } from 'react';

interface RenderPerformanceMetrics {
  fps: number;
  renderTime: number;
  frameCount: number;
  avgFrameTime: number;
  worstFrameTime: number;
}

export const useRenderPerformance = () => {
  const [metrics, setMetrics] = useState<RenderPerformanceMetrics>({
    fps: 0,
    renderTime: 0,
    frameCount: 0,
    avgFrameTime: 0,
    worstFrameTime: 0,
  });

  const frameCountRef = useRef(0);
  const lastFpsUpdateTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const frameTimes = useRef<number[]>([]);
  const worstFrameTimeRef = useRef(0);

  useEffect(() => {
    let frameId: number;

    const updateStats = (timestamp: number) => {
      frameCountRef.current++;

      // フレーム間の時間計測
      if (lastFrameTimeRef.current > 0) {
        const frameTime = timestamp - lastFrameTimeRef.current;
        frameTimes.current.push(frameTime);

        // 最悪フレーム時間の更新
        if (frameTime > worstFrameTimeRef.current) {
          worstFrameTimeRef.current = frameTime;
        }

        // フレーム時間の履歴を100フレームに制限
        if (frameTimes.current.length > 100) {
          frameTimes.current.shift();
        }
      }
      lastFrameTimeRef.current = timestamp;

      // FPSの計算 (1秒ごとに更新)
      if (timestamp - lastFpsUpdateTimeRef.current >= 1000) {
        const fps = frameCountRef.current;
        const avgFrameTime =
          frameTimes.current.length > 0
            ? frameTimes.current.reduce((sum, time) => sum + time, 0) /
              frameTimes.current.length
            : 0;

        setMetrics({
          fps,
          renderTime: frameTimes.current[frameTimes.current.length - 1] || 0,
          frameCount: frameCountRef.current,
          avgFrameTime,
          worstFrameTime: worstFrameTimeRef.current,
        });

        lastFpsUpdateTimeRef.current = timestamp;
        frameCountRef.current = 0;
        worstFrameTimeRef.current = 0; // リセット
      }

      frameId = requestAnimationFrame(updateStats);
    };

    frameId = requestAnimationFrame(updateStats);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  return metrics;
};
