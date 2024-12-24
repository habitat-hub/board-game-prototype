'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';

import { AllPart } from '@/features/prototype/type';
import { PART_TYPE } from '@/features/prototype/const';

const socket = io(process.env.NEXT_PUBLIC_API_URL);

const PrototypeComponent: React.FC<{ viewMode: string }> = ({ viewMode }) => {
  const { prototypeId } = useParams();
  const [parts, setParts] = useState<AllPart[]>([]);

  /**
   * パーツの重なりチェック
   * @param partPosition - チェックするパーツの位置
   * @param partSize - チェックするパーツのサイズ
   * @param partOrder - チェックするパーツの順番
   * @param otherPartPosition - 他のパーツの位置
   * @param otherPartSize - 他のパーツのサイズ
   * @param otherPartOrder - 他のパーツの順番
   */
  const isPartOnOtherPart = (
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
   * カードの移動（親の設定を行う）
   * @param partId - 移動するカードのid
   * @param x - 移動するカードのx座標
   * @param y - 移動するカードのy座標
   */
  const handleMoveCard = (partId: number, x: number, y: number) => {
    const card = parts.find(
      (part) => part.id === partId && part.type === PART_TYPE.CARD
    );
    if (!card) return;

    // カードの場合、他の親になりえるパーツとの重なりをチェック
    const cardPosition = { x, y };
    const cardSize = {
      width: card.width,
      height: card.height,
    };

    // ドロップ位置の真下にある親になりえるパーツを探す
    const parentParts = parts.filter((part) =>
      part.configurableTypeAsChild.includes(PART_TYPE.CARD)
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
        cardPosition,
        cardSize,
        card.order,
        parentPartPosition,
        parentPartSize,
        parentPart.order
      );
    });

    // 親が変わっていない場合は何もしない
    if (
      (!card.parentId && !targetParentPart) ||
      card.parentId === targetParentPart?.id
    )
      return;

    // NOTE: カードが親パーツの上にのる/カードが親パーツから離れる時だけ配信
    if (card.parentId || targetParentPart)
      socket.emit('UPDATE_CARD_PARENT', {
        prototypeId: Number(prototypeId),
        cardId: partId,
        nextParentId: targetParentPart?.id,
      });

    const previousParentPart = parts.find((part) => part.id === card.parentId);
    // NOTE: 山札から山札以外、山札以外から山札に変わるときは裏返す
    if (
      (previousParentPart?.type === PART_TYPE.DECK &&
        targetParentPart?.type !== PART_TYPE.DECK) ||
      (previousParentPart?.type !== PART_TYPE.DECK &&
        targetParentPart?.type === PART_TYPE.DECK)
    ) {
      // 山札の上に置くときは裏返す、山札から離れるときは表にする
      socket.emit('FLIP_CARD', {
        prototypeId: Number(prototypeId),
        cardId: card.id,
        isNextFlipped: targetParentPart?.type === PART_TYPE.DECK,
      });
    }
  };

  /**
   * パーツの複製
   * @param part - 複製するパーツ
   */
  const handleDuplicatePart = (part: AllPart) => {
    // NOTE: idは自動生成されるため、partからidを削除
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = part;

    const newPart = {
      ...rest,
      position: {
        x: part.position.x + 10,
        y: part.position.y + 10,
      },
      order: part.order + 0.1, // FIXME: パーツの重なりをチェックして順番をずらす(コレだと他のパーツと重なる可能性がある)
    };
    socket.emit('ADD_PART', {
      prototypeId: Number(prototypeId),
      part: newPart,
    });
  };

  /**
   * プレイヤーのユーザー更新
   * @param playerId - 更新するプレイヤーのid
   * @param userId - 更新するプレイヤーのユーザーid
   */
  const handleUpdatePlayerUser = (playerId: number, userId: number | null) => {
    socket.emit('UPDATE_PLAYER_USER', {
      prototypeId: Number(prototypeId),
      playerId,
      userId,
    });
  };

  return <></>;
};

export default PrototypeComponent;
