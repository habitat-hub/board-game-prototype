import { Transaction } from 'sequelize';

import PrototypeModel from '../models/Prototype';
import { ACCESS_TYPE, PROTOTYPE_VERSION } from '../const';
import PlayerModel from '../models/Player';
import PrototypeGroupModel from '../models/PrototypeGroup';
import AccessModel from '../models/Access';
import UserAccessModel from '../models/UserAccess';
import PartModel from '../models/Part';
import PartPropertyModel from '../models/PartProperty';

/**
 * マスタープロトタイプを作成する
 *
 * @param userId - ユーザーID
 * @param name - プロトタイプ名
 * @param minPlayers - 最小プレイヤー数
 * @param maxPlayers - 最大プレイヤー数
 * @param transaction - トランザクション
 * @returns 作成したプロトタイプ
 */
export async function createPrototypeMaster({
  userId,
  name,
  minPlayers,
  maxPlayers,
  transaction,
}: {
  userId: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  transaction: Transaction;
}) {
  // プロトタイプグループの作成
  const prototypeGroup = await PrototypeGroupModel.create(
    {
      userId,
    },
    { transaction }
  );

  // マスタープロトタイプの作成
  const masterPrototype = await PrototypeModel.create(
    {
      prototypeGroupId: prototypeGroup.id,
      name,
      type: 'MASTER',
      minPlayers,
      maxPlayers,
      versionNumber: PROTOTYPE_VERSION.INITIAL,
    },
    { transaction }
  );

  // プレイヤーの作成
  await PlayerModel.bulkCreate(
    Array.from({ length: maxPlayers }).map((_, i) => ({
      prototypeId: masterPrototype.id,
      userId: null,
      playerName: `プレイヤー${i + 1}`,
    })),
    { transaction, returning: true }
  );

  // アクセス権の作成
  const access = await AccessModel.create(
    {
      prototypeGroupId: prototypeGroup.id,
      type: ACCESS_TYPE.MASTER,
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

  return masterPrototype;
}

/**
 * プロトタイプバージョンを作成する
 *
 * @param prototypeGroupId - プロトタイプグループID
 * @param name - プロトタイプ名
 * @param type - プロトタイプタイプ
 * @param minPlayers - 最小プレイヤー数
 * @param maxPlayers - 最大プレイヤー数
 * @param versionNumber - バージョン番号
 * @param transaction - トランザクション
 * @returns 作成したプロトタイプ
 */
export const createPrototypeVersion = async ({
  prototypeGroupId,
  name,
  minPlayers,
  maxPlayers,
  versionNumber = PROTOTYPE_VERSION.INITIAL,
  transaction,
}: {
  prototypeGroupId: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  versionNumber: number;
  transaction: Transaction;
}) => {
  // バージョンプロトトタイプの作成
  const versionPrototype = await PrototypeModel.create(
    {
      prototypeGroupId,
      name,
      type: 'VERSION',
      minPlayers,
      maxPlayers,
      versionNumber,
    },
    { transaction }
  );

  // マスタープロトタイプの取得
  const masterPrototype = await PrototypeModel.findOne({
    where: {
      prototypeGroupId,
      type: 'MASTER',
    },
  });
  if (!masterPrototype) {
    throw new Error('マスタープロトタイプが見つかりません');
  }

  // マスタープロトタイプのプレイヤーの取得
  const masterPlayers = await PlayerModel.findAll({
    where: {
      prototypeId: masterPrototype.id,
    },
  });

  // プレイヤーの作成
  const versionPlayers = await PlayerModel.bulkCreate(
    masterPlayers.map(({ userId, playerName, id }) => ({
      prototypeId: versionPrototype.id,
      userId,
      playerName,
      originalPlayerId: id,
    })),
    { transaction, returning: true }
  );

  // マスタープロトタイプのパーツの取得
  const masterParts = await PartModel.findAll({
    where: {
      prototypeId: masterPrototype.id,
    },
  });

  // マスタープロトタイプのパーツのプロパティの取得
  const masterPartProperties = await PartPropertyModel.findAll({
    where: {
      partId: masterParts.map((part) => part.id),
    },
  });

  // パーツの作成
  masterParts.map(
    async ({
      id,
      type,
      parentId,
      position,
      width,
      height,
      configurableTypeAsChild,
      isReversible,
      isFlipped,
      canReverseCardOnDeck,
      ownerId,
    }) => {
      const newOwnerId = versionPlayers.find(
        (player) => player.originalPlayerId === ownerId
      )?.id;

      const versionPart = await PartModel.create(
        {
          type,
          prototypeId: versionPrototype.id,
          parentId,
          position,
          width,
          height,
          configurableTypeAsChild,
          originalPartId: id,
          isReversible,
          isFlipped,
          ownerId: newOwnerId,
          canReverseCardOnDeck,
        },
        { transaction, returning: true }
      );

      const partProperties = masterPartProperties.filter(
        ({ partId }) => partId === id
      );
      partProperties.map(
        async ({ side, name, description, color, textColor, imageId }) => {
          await PartPropertyModel.create(
            {
              partId: versionPart.id,
              side,
              name,
              description,
              color,
              textColor,
              imageId,
            },
            { transaction }
          );
        }
      );
    }
  );

  return versionPrototype;
};

/**
 * インスタンスプロトタイプを作成する
 *
 * @param prototypeGroupId - プロトタイプグループID
 * @param name - プロトタイプ名
 * @param transaction - トランザクション
 */
export const createPrototypeInstance = async ({
  prototypeGroupId,
  prototypeVersionId,
  name,
  minPlayers,
  maxPlayers,
  versionNumber = PROTOTYPE_VERSION.INITIAL,
  transaction,
}: {
  prototypeGroupId: string;
  prototypeVersionId: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  versionNumber: number;
  transaction: Transaction;
}) => {
  // インスタンスプロトタイプの作成
  const instancePrototype = await PrototypeModel.create(
    {
      prototypeGroupId,
      name,
      type: 'INSTANCE',
      minPlayers,
      maxPlayers,
      versionNumber,
    },
    { transaction }
  );

  // バージョンプロトタイプの取得
  const versionPrototype = await PrototypeModel.findByPk(prototypeVersionId);
  if (!versionPrototype) {
    throw new Error('バージョンプロトタイプが見つかりません');
  }

  // バージョンプロトタイプのプレイヤーの取得
  const versionPlayers = await PlayerModel.findAll({
    where: {
      prototypeId: versionPrototype.id,
    },
  });

  // プレイヤーの作成
  const instancePlayers = await PlayerModel.bulkCreate(
    versionPlayers.map(({ userId, playerName, id }) => ({
      prototypeId: instancePrototype.id,
      userId,
      playerName,
      originalPlayerId: id,
    })),
    { transaction, returning: true }
  );

  // バージョンプロトタイプのパーツの取得
  const versionParts = await PartModel.findAll({
    where: {
      prototypeId: versionPrototype.id,
    },
  });

  // バージョンプロトタイプのパーツのプロパティの取得
  const versionPartProperties = await PartPropertyModel.findAll({
    where: {
      partId: versionParts.map((part) => part.id),
    },
  });

  // パーツの作成
  versionParts.map(
    async ({
      id,
      type,
      parentId,
      position,
      width,
      height,
      configurableTypeAsChild,
      isReversible,
      isFlipped,
      canReverseCardOnDeck,
      ownerId,
    }) => {
      const newOwnerId = instancePlayers.find(
        (player) => player.originalPlayerId === ownerId
      )?.id;

      const instancePart = await PartModel.create(
        {
          type,
          prototypeId: instancePrototype.id,
          parentId,
          position,
          width,
          height,
          configurableTypeAsChild,
          originalPartId: id,
          isReversible,
          isFlipped,
          ownerId: newOwnerId,
          canReverseCardOnDeck,
        },
        { transaction, returning: true }
      );

      const partProperties = versionPartProperties.filter(
        ({ partId }) => partId === id
      );
      partProperties.map(
        async ({ side, name, description, color, textColor, imageId }) => {
          await PartPropertyModel.create(
            {
              partId: instancePart.id,
              side,
              name,
              description,
              color,
              textColor,
              imageId,
            },
            { transaction }
          );
        }
      );
    }
  );

  return instancePrototype;
};
