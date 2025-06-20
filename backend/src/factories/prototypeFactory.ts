import { Transaction } from 'sequelize';

import PrototypeModel from '../models/Prototype';
import { ACCESS_TYPE, PROTOTYPE_VERSION } from '../const';
import PrototypeGroupModel from '../models/PrototypeGroup';
import AccessModel from '../models/Access';
import UserAccessModel from '../models/UserAccess';
import PartModel from '../models/Part';
import PartPropertyModel from '../models/PartProperty';

/**
 * プロトタイプグループを作成する
 *
 * @param userId - ユーザーID
 * @param name - プロトタイプ名
 * @param minPlayers - 最小プレイヤー数
 * @param maxPlayers - 最大プレイヤー数
 * @param transaction - トランザクション
 * @returns 作成したプロトタイプグループとそれに含まれるプロトタイプ
 */
export async function createPrototypeGroup({
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

  // アクセス権の作成
  const access = await AccessModel.create(
    {
      prototypeGroupId: prototypeGroup.id,
      name: ACCESS_TYPE.MASTER,
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

  return {
    prototypeGroup,
    prototypes: [masterPrototype],
  };
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
    }) => {
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
    }) => {
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
