import { Transaction } from 'sequelize';

import PrototypeModel from '../models/Prototype';
import { ROLE_TYPE, PROTOTYPE_VERSION, RESOURCE_TYPES } from '../const';
import PrototypeGroupModel from '../models/PrototypeGroup';
import { assignRole } from '../helpers/roleHelper';
import RoleModel from '../models/Role';
import PartModel from '../models/Part';
import PartPropertyModel from '../models/PartProperty';

/**
 * プロトタイプグループを作成する
 *
 * @param userId - ユーザーID
 * @param name - プロトタイプ名
 * @param transaction - トランザクション
 * @returns 作成したプロトタイプグループとそれに含まれるプロトタイプ
 */
export async function createPrototypeGroup({
  userId,
  name,
  transaction,
}: {
  userId: string;
  name: string;
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
      versionNumber: PROTOTYPE_VERSION.INITIAL,
    },
    { transaction }
  );

  // 作成者にadminロールを割り当て
  const adminRole = await RoleModel.findOne({
    where: { name: ROLE_TYPE.ADMIN },
  });

  if (!adminRole) {
    throw new Error('管理者ロールが見つかりません');
  }

  try {
    await assignRole(
      userId,
      adminRole.id,
      RESOURCE_TYPES.PROTOTYPE_GROUP,
      prototypeGroup.id,
      transaction
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`ロール割り当てに失敗しました: ${errorMessage}`);
  }

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
 * @param versionNumber - バージョン番号
 * @param transaction - トランザクション
 * @returns 作成したプロトタイプ
 */
export const createPrototypeVersion = async ({
  prototypeGroupId,
  name,
  versionNumber = PROTOTYPE_VERSION.INITIAL,
  transaction,
}: {
  prototypeGroupId: string;
  name: string;
  versionNumber: number;
  transaction: Transaction;
}) => {
  // バージョンプロトトタイプの作成
  const versionPrototype = await PrototypeModel.create(
    {
      prototypeGroupId,
      name,
      type: 'VERSION',
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
 * プロトタイプインスタンスを作成する
 *
 * @param prototypeGroupId - プロトタイプグループID
 * @param sourceVersionPrototypeId - 紐付くバージョンID
 * @param name - プロトタイプ名
 * @param versionNumber - バージョン番号
 * @param transaction - トランザクション
 * @returns 作成したインスタンスプロトタイプ
 */
export const createPrototypeInstance = async ({
  prototypeGroupId,
  sourceVersionPrototypeId,
  name,
  versionNumber,
  transaction,
}: {
  prototypeGroupId: string;
  sourceVersionPrototypeId: string;
  name: string;
  versionNumber: number;
  transaction: Transaction;
}) => {
  const instancePrototype = await PrototypeModel.create(
    {
      prototypeGroupId,
      name,
      type: 'INSTANCE',
      versionNumber,
      sourceVersionPrototypeId,
    },
    { transaction }
  );

  // バージョンプロトタイプの取得
  const versionPrototype = await PrototypeModel.findByPk(
    sourceVersionPrototypeId
  );
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
