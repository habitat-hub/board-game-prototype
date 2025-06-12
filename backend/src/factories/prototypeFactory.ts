import { Transaction } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import PrototypeModel from '../models/Prototype';
import { PROTOTYPE_VERSION } from '../const';
import PrototypeVersionModel from '../models/PrototypeVersion';
import PlayerModel from '../models/Player';
import PrototypeGroupModel from '../models/PrototypeGroup';
import AccessModel from '../models/Access';
import UserAccessModel from '../models/UserAccess';
import PartModel from '../models/Part';
import PartPropertyModel from '../models/PartProperty';

/**
 * プロトタイプを作成する(プロトタイプバージョン、プレイヤーも作成する)
 *
 * @param userId - ユーザーID
 * @param name - プロトタイプ名
 * @param type - プロトタイプタイプ
 * @param groupId - グループID
 * @param masterPrototypeId - マスタープロトタイプID
 * @param minPlayers - 最小プレイヤー数
 * @param maxPlayers - 最大プレイヤー数
 * @param transaction - トランザクション
 * @returns 作成したプロトタイプ
 */
export async function createPrototype({
  userId,
  name,
  type,
  editPrototypeDefaultVersionId,
  groupId,
  minPlayers,
  maxPlayers,
  transaction,
  needsPartDuplicate = false,
}: {
  userId: string;
  name: string;
  type: 'EDIT' | 'PREVIEW';
  editPrototypeDefaultVersionId: string | null;
  groupId: string | null;
  minPlayers: number;
  maxPlayers: number;
  transaction: Transaction;
  needsPartDuplicate?: boolean;
}) {
  const prototypeGroupId = groupId ?? uuidv4();

  // プロトタイプ作成
  const newPrototype = await PrototypeModel.create(
    {
      userId,
      name,
      type,
      groupId: prototypeGroupId,
      masterPrototypeId: null,
      minPlayers,
      maxPlayers,
    },
    { transaction }
  );

  // 初期バージョン作成
  const newPrototypeVersion = await PrototypeVersionModel.create(
    {
      prototypeId: newPrototype.id,
      versionNumber: PROTOTYPE_VERSION.INITIAL,
      description: '初期バージョン',
    },
    { transaction }
  );

  // 初期バージョンのプレイヤー作成
  const players = await PlayerModel.findAll({
    where: {
      prototypeVersionId: editPrototypeDefaultVersionId,
    },
    order: [['id', 'ASC']],
  });
  let newPlayers = null;
  if (players.length === 0) {
    // 編集版の場合は、プレイヤーを新規作成
    newPlayers = await PlayerModel.bulkCreate(
      Array.from({ length: maxPlayers }).map((_, i) => ({
        prototypeVersionId: newPrototypeVersion.id,
        userId: null,
        playerName: `プレイヤー${i + 1}`,
      })),
      { transaction, returning: true }
    );
  } else {
    // プレビュー版の場合は、プレイヤーを複製
    newPlayers = await PlayerModel.bulkCreate(
      players.map((player) => ({
        prototypeVersionId: newPrototypeVersion.id,
        userId: null,
        playerName: player.playerName,
        originalPlayerId: player.id,
      })),
      { transaction, returning: true }
    );
  }

  // プロトタイプグループの追加
  await PrototypeGroupModel.create(
    {
      id: prototypeGroupId,
      prototypeId: newPrototype.id,
    },
    { transaction }
  );

  // 編集用の場合は、アクセス権を作成する
  if (type === 'EDIT') {
    const access = await AccessModel.create(
      {
        prototypeGroupId: prototypeGroupId,
        name: `グループ#${prototypeGroupId}のアクセス権`,
      },
      { transaction }
    );
    await UserAccessModel.create(
      {
        userId,
        accessId: access.id,
      },
      { transaction }
    );
  }

  if (needsPartDuplicate) {
    // パーツの複製
    const editParts = await PartModel.findAll({
      where: {
        prototypeVersionId: editPrototypeDefaultVersionId,
      },
    });

    const newParts = await PartModel.bulkCreate(
      editParts.map((part) => ({
        type: part.type,
        prototypeVersionId: newPrototypeVersion.id,
        parentId: null,
        position: part.position,
        width: part.width,
        height: part.height,
        order: part.order,
        configurableTypeAsChild: part.configurableTypeAsChild,
        isReversible: part.isReversible,
        isFlipped: part.isFlipped,
        ownerId: null,
        canReverseCardOnDeck: part.canReverseCardOnDeck,
        originalPartId: part.id,
      })),
      { transaction, returning: true }
    );

    // パーツのプロパティを複製
    const editPartProperties = await PartPropertyModel.findAll({
      where: {
        partId: editParts.map((part) => part.id),
      },
    });

    // partIdごとにプロパティをグループ化
    const groupedProperties = editPartProperties.reduce(
      (acc, property) => {
        if (!acc[property.partId]) {
          acc[property.partId] = [];
        }
        acc[property.partId].push(property);
        return acc;
      },
      {} as { [key: number]: PartPropertyModel[] }
    );

    // 各パーツの全プロパティ（front/back）を複製
    const newPartProperties = Object.entries(groupedProperties).flatMap(
      ([oldPartId, properties]) => {
        const newPart = newParts.find(
          (part) => part.originalPartId === Number(oldPartId)
        );
        if (!newPart) return [];

        return properties.map((property) => ({
          partId: newPart.id,
          side: property.side,
          name: property.name,
          description: property.description,
          color: property.color,
          textColor: property.textColor,
          imageId: property.imageId,
        }));
      }
    );

    await PartPropertyModel.bulkCreate(newPartProperties, { transaction });

    // 親パーツがあるパーツを更新する
    const editPartsWithParent = editParts.filter(
      (part) => part.parentId !== null
    );
    await Promise.all(
      editPartsWithParent.map(async (part) => {
        const newParentPart = newParts.find(
          (newPart) => newPart.originalPartId === part.parentId
        );

        if (!newParentPart) return null;
        return PartModel.update(
          { parentId: newParentPart.id },
          { where: { originalPartId: part.id }, transaction }
        );
      })
    );

    // オーナーを設定する
    const editPartsWithOwner = editParts.filter(
      (part) => part.ownerId !== null
    );
    await Promise.all(
      editPartsWithOwner.map(async (part) => {
        const newOwner = newPlayers.find(
          (player) => player.originalPlayerId === part.ownerId
        );

        if (!newOwner) return null;
        return PartModel.update(
          { ownerId: newOwner.id },
          { where: { originalPartId: part.id }, transaction }
        );
      })
    );
  }

  return newPrototype;
}

export const createPrototypeVersion = async (
  originalPrototypeVersion: PrototypeVersionModel,
  description: string,
  transaction: Transaction
) => {
  const existingVersions = await PrototypeVersionModel.findAll({
    where: {
      prototypeId: originalPrototypeVersion.prototypeId,
    },
    attributes: ['versionNumber'],
  });
  const majorVersions = existingVersions.map((version) => {
    const parts = version.versionNumber.split('.');
    return parseInt(parts[0], 10);
  });
  const maxMajorVersion = Math.max(...majorVersions);
  const newVersionNumber = `${maxMajorVersion + 1}.0.0`;

  const newPrototypeVersion = await PrototypeVersionModel.create(
    {
      prototypeId: originalPrototypeVersion.prototypeId,
      versionNumber: newVersionNumber,
      description,
    },
    { transaction }
  );

  const prototype = await PrototypeModel.findByPk(
    originalPrototypeVersion.prototypeId
  );
  if (!prototype) {
    throw new Error('プロトタイプが見つかりません');
  }

  // プレイヤー作成
  const players = await PlayerModel.findAll({
    where: {
      prototypeVersionId: originalPrototypeVersion.id,
    },
    order: [['id', 'ASC']],
  });
  const newPlayers = await PlayerModel.bulkCreate(
    players.map((player) => ({
      prototypeVersionId: newPrototypeVersion.id,
      userId: null,
      playerName: player.playerName,
      originalPlayerId: player.id,
    })),
    { transaction, returning: true }
  );

  // パーツの複製
  const originalParts = await PartModel.findAll({
    where: {
      prototypeVersionId: originalPrototypeVersion.id,
    },
  });
  const newParts = await PartModel.bulkCreate(
    originalParts.map((part) => ({
      type: part.type,
      prototypeVersionId: newPrototypeVersion.id,
      parentId: null,
      position: part.position,
      width: part.width,
      height: part.height,
      order: part.order,
      configurableTypeAsChild: part.configurableTypeAsChild,
      isReversible: part.isReversible,
      isFlipped: part.isFlipped,
      ownerId: null,
      canReverseCardOnDeck: part.canReverseCardOnDeck,
      originalPartId: part.id,
    })),
    { transaction, returning: true }
  );

  // パーツのプロパティを複製
  const originalPartProperties = await PartPropertyModel.findAll({
    where: {
      partId: originalParts.map((part) => part.id),
    },
  });

  // partIdごとにプロパティをグループ化
  const groupedProperties = originalPartProperties.reduce(
    (acc, property) => {
      if (!acc[property.partId]) {
        acc[property.partId] = [];
      }
      acc[property.partId].push(property);
      return acc;
    },
    {} as { [key: number]: PartPropertyModel[] }
  );

  // 各パーツの全プロパティ（front/back）を複製
  const newPartProperties = Object.entries(groupedProperties).flatMap(
    ([oldPartId, properties]) => {
      const newPart = newParts.find(
        (part) => part.originalPartId === Number(oldPartId)
      );
      if (!newPart) return [];

      return properties.map((property) => ({
        partId: newPart.id,
        side: property.side,
        name: property.name,
        description: property.description,
        color: property.color,
        textColor: property.textColor,
        imageId: property.imageId,
      }));
    }
  );

  await PartPropertyModel.bulkCreate(newPartProperties, { transaction });

  // 親パーツがあるパーツを更新する
  const originalPartsWithParent = originalParts.filter(
    (part) => part.parentId !== null
  );
  await Promise.all(
    originalPartsWithParent.map(async (part) => {
      const newParentPart = newParts.find(
        (newPart) => newPart.originalPartId === part.parentId
      );

      if (!newParentPart) return null;
      return PartModel.update(
        { parentId: newParentPart.id },
        { where: { originalPartId: part.id }, transaction }
      );
    })
  );

  // オーナーを設定する
  const originalPartsWithOwner = originalParts.filter(
    (part) => part.ownerId !== null
  );
  await Promise.all(
    originalPartsWithOwner.map(async (part) => {
      const newOwner = newPlayers.find(
        (player) => player.originalPlayerId === part.ownerId
      );

      if (!newOwner) return null;
      return PartModel.update(
        { ownerId: newOwner.id },
        { where: { originalPartId: part.id }, transaction }
      );
    })
  );
};

/**
 * プロトタイプバージョンを削除する
 *
 * @param prototypeVersionId - 削除するプロトタイプバージョンID
 * @param prototypeId - プロトタイプID (検証用)
 * @param transaction - トランザクション (オプション)
 * @returns - 削除が成功したかどうかと、エラーメッセージ
 */
export const deletePrototypeVersion = async (
  prototypeVersionId: string,
  prototypeId: string,
  transaction?: Transaction
): Promise<{ success: boolean; message?: string }> => {
  // バージョンを取得
  const prototypeVersion =
    await PrototypeVersionModel.findByPk(prototypeVersionId);

  // 存在しないかIDが一致しない場合
  if (!prototypeVersion || prototypeVersion.prototypeId !== prototypeId) {
    return { success: false, message: 'バージョンが見つかりません' };
  }

  // マスターバージョン（0.0.0）は削除できない
  if (prototypeVersion.versionNumber === '0.0.0') {
    return { success: false, message: 'マスターバージョンは削除できません' };
  }

  await PrototypeVersionModel.destroy({
    where: { id: prototypeVersionId },
    transaction,
  });

  return { success: true, message: 'バージョンを削除しました' };
};
