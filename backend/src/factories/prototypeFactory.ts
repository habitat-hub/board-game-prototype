import { Transaction } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import PrototypeModel from '../models/Prototype';
import { PROTOTYPE_TYPE, PROTOTYPE_VERSION } from '../const';
import PrototypeVersionModel from '../models/PrototypeVersion';
import PlayerModel from '../models/Player';
import PrototypeGroupModel from '../models/PrototypeGroup';
import AccessModel from '../models/Access';
import UserAccessModel from '../models/UserAccess';

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
  masterPrototypeId,
  groupId,
  minPlayers,
  maxPlayers,
  transaction,
}: {
  userId: string;
  name: string;
  type: typeof PROTOTYPE_TYPE.EDIT | typeof PROTOTYPE_TYPE.PREVIEW;
  masterPrototypeId: string | null;
  groupId: string | null;
  minPlayers: number;
  maxPlayers: number;
  transaction: Transaction;
}) {
  const prototypeGroupId = groupId ?? uuidv4();

  // プロトタイプ作成
  const prototype = await PrototypeModel.create(
    {
      userId,
      name,
      type,
      groupId: prototypeGroupId,
      masterPrototypeId,
      minPlayers,
      maxPlayers,
    },
    { transaction }
  );

  // 初期バージョン作成
  const prototypeVersion = await PrototypeVersionModel.create(
    {
      prototypeId: prototype.id,
      versionNumber: PROTOTYPE_VERSION.INITIAL,
      description: '初期バージョン',
    },
    { transaction }
  );

  // 初期バージョンのプレイヤー作成
  await PlayerModel.bulkCreate(
    Array.from({ length: maxPlayers }).map((_, i) => ({
      prototypeVersionId: prototypeVersion.id,
      playerName: `プレイヤー${i + 1}`,
      order: i,
    })),
    { transaction }
  );

  // プロトタイプグループの追加
  PrototypeGroupModel.create(
    {
      id: prototypeGroupId,
      prototypeId: prototype.id,
    },
    { transaction }
  );

  // 編集用の場合は、アクセス権を作成する
  if (type === PROTOTYPE_TYPE.EDIT) {
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

  return prototype;
}
