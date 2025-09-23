import { Part } from '@/__generated__/api/client';

/**
 * 全パーツの平均センター位置を計算
 */
export const calculateAveragePartsCenter = (parts: Part[]) => {
  if (parts.length === 0) return null;

  const totalCenterX = parts.reduce((sum, part) => {
    return sum + (part.position.x + part.width / 2);
  }, 0);

  const totalCenterY = parts.reduce((sum, part) => {
    return sum + (part.position.y + part.height / 2);
  }, 0);

  return {
    x: totalCenterX / parts.length,
    y: totalCenterY / parts.length,
  };
};
