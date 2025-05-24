// クライアントサイドレンダリングを有効化
'use client';

import React, { useMemo } from 'react';
import { Line } from 'react-konva';

interface GridLinesProps {
  camera: {
    x: number;
    y: number;
    scale: number;
  };
  viewportSize: {
    width: number;
    height: number;
  };
  gridSize: number;
}

const GridLines: React.FC<GridLinesProps> = ({
  camera,
  viewportSize,
  gridSize,
}) => {
  // ビューポート内に表示されるグリッドラインのみを計算
  const { verticalLines, horizontalLines } = useMemo(() => {
    // カメラ位置からビューポートの境界を計算
    const startX = Math.floor(camera.x / camera.scale / gridSize) * gridSize;
    const endX =
      Math.ceil(
        (camera.x / camera.scale + viewportSize.width / camera.scale) / gridSize
      ) * gridSize;
    const startY = Math.floor(camera.y / camera.scale / gridSize) * gridSize;
    const endY =
      Math.ceil(
        (camera.y / camera.scale + viewportSize.height / camera.scale) /
          gridSize
      ) * gridSize;

    // 表示範囲を少し広げて、スクロール時にグリッドが突然現れるのを防ぐ
    const verticalLines = [];
    const horizontalLines = [];

    // 可視範囲内の垂直線のみを生成
    for (let x = startX; x <= endX; x += gridSize) {
      verticalLines.push(
        <Line
          key={`v${x}`}
          points={[x, startY, x, endY]}
          stroke="#ccc"
          strokeWidth={1}
          perfectDrawEnabled={false} // パフォーマンス向上のため
        />
      );
    }

    // 可視範囲内の水平線のみを生成
    for (let y = startY; y <= endY; y += gridSize) {
      horizontalLines.push(
        <Line
          key={`h${y}`}
          points={[startX, y, endX, y]}
          stroke="#ccc"
          strokeWidth={1}
          perfectDrawEnabled={false} // パフォーマンス向上のため
        />
      );
    }

    return { verticalLines, horizontalLines };
  }, [
    camera.x,
    camera.y,
    camera.scale,
    viewportSize.width,
    viewportSize.height,
    gridSize,
  ]);

  return (
    <>
      {verticalLines}
      {horizontalLines}
    </>
  );
};

export default React.memo(GridLines); // React.memoでさらに最適化
