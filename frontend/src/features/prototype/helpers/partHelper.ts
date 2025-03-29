import { Part } from '@/types/models';

/**
 * パーツが他のパーツの上にあるかどうかを判定
 * @param partPosition - パーツの位置
 * @param partSize - パーツのサイズ
 * @param partOrder - パーツの順番
 * @param otherPartPosition - 他のパーツの位置
 * @param otherPartSize - 他のパーツのサイズ
 * @param otherPartOrder - 他のパーツの順番
 * @returns パーツが他のパーツの上にあるかどうか
 */
export const isPartOnOtherPart = (
  partPosition: { x: number; y: number },
  partSize: { width: number; height: number },
  partOrder: number,
  otherPartPosition: { x: number; y: number },
  otherPartSize: { width: number; height: number },
  otherPartOrder: number
) => {
  const partCenterX = partPosition.x + partSize.width / 2;
  const partCenterY = partPosition.y + partSize.height / 2;

  return (
    partCenterX >= otherPartPosition.x &&
    partCenterX <= otherPartPosition.x + otherPartSize.width &&
    partCenterY >= otherPartPosition.y &&
    partCenterY <= otherPartPosition.y + otherPartSize.height &&
    partOrder > otherPartOrder
  );
};

/**
 * 親の更新が必要かどうかを判定
 * @param parts - パーツの配列
 * @param draggingPart - ドラッグ中のパーツ
 * @param newPosition - 新しい位置
 * @returns 親の更新が必要かどうか
 */
export const needsParentUpdate = (
  parts: Part[],
  draggingPart: Part,
  newPosition: { x: number; y: number }
) => {
  // ドロップ位置の真下にある親になりえるパーツを探す
  const parentParts = parts.filter((part) =>
    part.configurableTypeAsChild.includes(draggingPart.type)
  );
  const targetParentPart = parentParts.find((parentPart) => {
    const parentPartPosition = {
      x: parentPart.position.x,
      y: parentPart.position.y,
    };
    const parentPartSize = {
      width: parentPart.width,
      height: parentPart.height,
    };
    return isPartOnOtherPart(
      newPosition,
      {
        width: draggingPart.width,
        height: draggingPart.height,
      },
      draggingPart.order,
      parentPartPosition,
      parentPartSize,
      parentPart.order
    );
  });

  if (
    (draggingPart.parentId === null && targetParentPart === undefined) ||
    draggingPart.parentId === targetParentPart?.id
  ) {
    return {
      needsUpdate: false,
      parentPart: targetParentPart,
    };
  }

  return {
    needsUpdate: true,
    parentPart: targetParentPart,
  };
};
