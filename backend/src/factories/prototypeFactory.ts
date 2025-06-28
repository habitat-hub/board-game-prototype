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
 * プロトタイプバージョンを作成する（MASTERをコピーし、INSTANCEも同時に作成）
 *
 * @param prototypeGroupId - プロトタイプグループID
 * @param name - プロトタイプ名
 * @param versionNumber - バージョン番号
 * @param transaction - トランザクション
 * @returns 作成したバージョンプロトタイプとインスタンスプロトタイプ
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

  // バージョンプロトタイプの作成
  const versionPrototype = await PrototypeModel.create(
    {
      prototypeGroupId,
      name,
      type: 'VERSION',
      versionNumber,
    },
    { transaction }
  );

  // マスタープロトタイプのパーツの取得
  const masterParts = await PartModel.findAll({
    where: {
      prototypeId: masterPrototype.id,
    },
    transaction,
  });

  // マスタープロトタイプのパーツのプロパティの取得
  const masterPartProperties = await PartPropertyModel.findAll({
    where: {
      partId: masterParts.map((part) => part.id),
    },
    transaction,
  });

  // VERSION用パーツとプロパティのコピー
  const versionPartIdMap: Record<string, string> = {};
  for (const masterPart of masterParts) {
    const versionPart = await PartModel.create(
      {
        type: masterPart.type,
        prototypeId: versionPrototype.id,
        position: masterPart.position,
        width: masterPart.width,
        height: masterPart.height,
        order: masterPart.order,
        frontSide: masterPart.frontSide,
      },
      { transaction, returning: true }
    );
    versionPartIdMap[String(masterPart.id)] = String(versionPart.id);

    const partProperties = masterPartProperties.filter(
      ({ partId }) => partId === masterPart.id
    );
    for (const prop of partProperties) {
      await PartPropertyModel.create(
        {
          partId: versionPart.id,
          side: prop.side,
          name: prop.name,
          description: prop.description,
          color: prop.color,
          textColor: prop.textColor,
          imageId: prop.imageId,
        },
        { transaction }
      );
    }
  }

  const instancePrototype = await PrototypeModel.create(
    {
      prototypeGroupId,
      name: `${name}（ルーム）`,
      type: 'INSTANCE',
      versionNumber,
      sourceVersionPrototypeId: versionPrototype.id,
    },
    { transaction }
  );

  // バージョンプロトタイプのパーツを取得
  const versionParts = await PartModel.findAll({
    where: {
      prototypeId: versionPrototype.id,
    },
    transaction,
  });

  for (const versionPart of versionParts) {
    const instancePart = await PartModel.create(
      {
        type: versionPart.type,
        prototypeId: instancePrototype.id,
        position: versionPart.position,
        width: versionPart.width,
        height: versionPart.height,
        order: versionPart.order,
        frontSide: versionPart.frontSide,
      },
      { transaction, returning: true }
    );

    // バージョンパーツのプロパティを取得
    const versionPartProperties = await PartPropertyModel.findAll({
      where: {
        partId: versionPart.id,
      },
      transaction,
    });
    for (const prop of versionPartProperties) {
      await PartPropertyModel.create(
        {
          partId: instancePart.id,
          side: prop.side,
          name: prop.name,
          description: prop.description,
          color: prop.color,
          textColor: prop.textColor,
          imageId: prop.imageId,
        },
        { transaction }
      );
    }
  }

  return { versionPrototype, instancePrototype };
};
