import { Transaction } from 'sequelize';

import PrototypeModel from '../models/Prototype';
import { ROLE_TYPE, RESOURCE_TYPES } from '../const';
import ProjectModel from '../models/Project';
import { assignRole } from '../helpers/roleHelper';
import RoleModel from '../models/Role';
import PartModel from '../models/Part';
import PartPropertyModel from '../models/PartProperty';

/**
 * プロジェクトを作成する
 *
 * @param userId - ユーザーID
 * @param name - プロトタイプ名
 * @param transaction - トランザクション
 * @returns 作成したプロジェクトとそれに含まれるプロトタイプ
 */
export async function createProject({
  userId,
  name,
  transaction,
}: {
  userId: string;
  name: string;
  transaction: Transaction;
}) {
  // プロジェクトの作成
  const project = await ProjectModel.create(
    {
      userId,
    },
    { transaction }
  );

  // マスタープロトタイプの作成
  const masterPrototype = await PrototypeModel.create(
    {
      projectId: project.id,
      name,
      type: 'MASTER',
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
      RESOURCE_TYPES.PROJECT,
      project.id,
      transaction
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`ロール割り当てに失敗しました: ${errorMessage}`);
  }

  return {
    project,
    prototypes: [masterPrototype],
  };
}

/**
 * 既存プロジェクトを複製する
 *
 * @param projectId - 複製元のプロジェクトID
 * @param userId - 新しいプロジェクトの所有者となるユーザーID
 * @param transaction - トランザクション
 * @returns 作成したプロジェクトとマスタープロトタイプ
 */
export async function duplicateProject({
  projectId,
  userId,
  transaction,
}: {
  projectId: string;
  userId: string;
  transaction: Transaction;
}) {
  // 元のマスタープロトタイプを取得
  const originalMaster = await PrototypeModel.findOne({
    where: { projectId, type: 'MASTER' },
    transaction,
  });
  if (!originalMaster) {
    throw new Error('マスタープロトタイプが見つかりません');
  }

  // 新しいプロジェクトを作成
  const project = await ProjectModel.create(
    {
      userId,
    },
    { transaction }
  );

  // 新しいマスタープロトタイプを作成（名前は元と同じ）
  const masterPrototype = await PrototypeModel.create(
    {
      projectId: project.id,
      name: `${originalMaster.name}-copy`,
      type: 'MASTER',
    },
    { transaction }
  );

  // 元のマスタープロトタイプのパーツを取得
  const masterParts = await PartModel.findAll({
    where: {
      prototypeId: originalMaster.id,
    },
    transaction,
  });

  // パーツのプロパティを取得
  const masterPartProperties = await PartPropertyModel.findAll({
    where: {
      partId: masterParts.map((part) => part.id),
    },
    transaction,
  });

  // 新しいパーツを作成し、IDマッピングを保持
  const partIdMap: Record<string, number> = {};
  for (const part of masterParts) {
    const newPart = await PartModel.create(
      {
        type: part.type,
        prototypeId: masterPrototype.id,
        position: part.position,
        width: part.width,
        height: part.height,
        order: part.order,
        frontSide: part.frontSide,
        ownerId: part.ownerId ?? null,
      },
      { transaction, returning: true }
    );
    partIdMap[String(part.id)] = newPart.id;
  }

  // 各パーツのプロパティを複製
  for (const prop of masterPartProperties) {
    const newPartId = partIdMap[String(prop.partId)];
    if (!newPartId) continue;
    await PartPropertyModel.create(
      {
        partId: newPartId,
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

  // 新しいプロジェクトの作成者にadminロールを付与
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
      RESOURCE_TYPES.PROJECT,
      project.id,
      transaction
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`ロール割り当てに失敗しました: ${errorMessage}`);
  }

  return {
    project,
    prototypes: [masterPrototype],
  };
}

/**
 * プロトタイプバージョンを作成する（MASTERをコピーし、INSTANCEも同時に作成）
 *
 * @param projectId - プロジェクトID
 * @param name - プロトタイプ名
 * @param transaction - トランザクション
 * @returns 作成したバージョンプロトタイプとインスタンスプロトタイプ
 */
export const createPrototypeVersion = async ({
  projectId,
  name,
  transaction,
}: {
  projectId: string;
  name: string;
  transaction: Transaction;
}) => {
  // マスタープロトタイプの取得
  const masterPrototype = await PrototypeModel.findOne({
    where: {
      projectId,
      type: 'MASTER',
    },
  });
  if (!masterPrototype) {
    throw new Error('マスタープロトタイプが見つかりません');
  }

  // バージョンプロトタイプの作成
  const versionPrototype = await PrototypeModel.create(
    {
      projectId,
      name,
      type: 'VERSION',
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
      projectId,
      name,
      type: 'INSTANCE',
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
