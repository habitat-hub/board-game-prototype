import { Server, Socket } from 'socket.io';
import PartModel from '../models/Part';
import PartPropertyModel from '../models/PartProperty';
import { UPDATABLE_PROTOTYPE_FIELDS } from '../const';
import PrototypeModel from '../models/Prototype';
import UserModel from '../models/User';
import { Op } from 'sequelize';
import {
  shuffleDeck,
  persistDeckOrder,
  isOverlapping,
} from '../helpers/prototypeHelper';
import ImageModel from '../models/Image';
import {
  ORDER_MAX_EXCLUSIVE,
  ORDER_MIN_EXCLUSIVE,
  ORDER_RANGE,
  MIN_ORDER_GAP,
} from '../constants/prototype';
import {
  PROTOTYPE_SOCKET_EVENT,
  PROJECT_SOCKET_EVENT,
  COMMON_SOCKET_EVENT,
} from '../constants/socket';

// 接続中ユーザー情報のマップ (prototypeId -> userId -> user info)
export const connectedUsersMap: Record<
  string,
  Record<string, { userId: string; username: string }>
> = {};

// socket.dataの型定義
interface SocketData {
  prototypeId: string;
  userId: string;
  username: string;
}

/**
 * 指定されたパーツIDリストに対応するプロパティを画像データを含めて取得する
 * @param partIds - パーツIDの配列
 * @returns 画像データを含むプロパティの配列
 */
async function fetchPropertiesWithImagesByPartIds(
  partIds: number[]
): Promise<PartPropertyModel[]> {
  if (partIds.length === 0) {
    return [];
  }

  return await PartPropertyModel.findAll({
    where: { partId: partIds }, // IN句として解釈される
    include: [
      {
        model: ImageModel,
        required: false, // LEFT JOIN
        as: 'image',
      },
    ],
  });
}

/**
 * 指定されたプロトタイプバージョンIDに関連する全てのパーツとプロパティを取得する。
 *
 * @param {string} prototypeId - プロトタイプID
 * @returns {Promise<{ parts: PartModel[], properties: PartPropertyModel[] }>} - プロトタイプに関連するパーツとプロパティの配列を含むオブジェクトを返すPromise
 */
export async function fetchPartsAndProperties(prototypeId: string) {
  const [parts, properties] = await Promise.all([
    PartModel.findAll({
      where: { prototypeId },
    }),
    PartPropertyModel.findAll({
      include: [
        {
          model: PartModel,
          required: true, // INNER JOIN
          where: { prototypeId },
          as: 'part',
        },
        {
          model: ImageModel,
          required: false, // LEFT JOIN
          as: 'image',
        },
      ],
    }),
  ]);

  return { parts, properties };
}

/**
 * プロトタイプ参加
 * @param socket - Socket
 * @param io - Server
 */
function handleJoinPrototype(socket: Socket, io: Server): void {
  socket.on(
    PROTOTYPE_SOCKET_EVENT.JOIN_PROTOTYPE,
    async ({
      prototypeId,
      userId,
    }: {
      prototypeId: string;
      userId: string;
    }) => {
      try {
        const prototype = await PrototypeModel.findByPk(prototypeId);
        if (!prototype) return;

        // ユーザー情報を取得
        const user = await UserModel.findByPk(userId);
        if (!user) return;

        // 既存ルームからの離脱・接続中ユーザー更新
        const prevPrototypeId = (socket.data as SocketData)?.prototypeId;
        if (prevPrototypeId && prevPrototypeId !== prototypeId) {
          // 旧ルームの接続中ユーザーから削除
          if (connectedUsersMap[prevPrototypeId]) {
            delete connectedUsersMap[prevPrototypeId][userId];
            // 旧ルームへ更新通知
            io.to(prevPrototypeId).emit(
              PROTOTYPE_SOCKET_EVENT.CONNECTED_USERS,
              {
                users: Object.values(connectedUsersMap[prevPrototypeId] || {}),
              }
            );
            // 旧プロジェクトルームへ更新通知
            try {
              const prevProto = await PrototypeModel.findByPk(prevPrototypeId);
              if (prevProto) {
                io.to(`project:${prevProto.projectId}`).emit(
                  PROJECT_SOCKET_EVENT.ROOM_CONNECTED_USERS_UPDATE,
                  {
                    prototypeId: prevPrototypeId,
                    users: Object.values(
                      connectedUsersMap[prevPrototypeId] || {}
                    ),
                  }
                );
              }
            } catch (e) {
              console.error(
                '以前のプロジェクトルームへの通知に失敗しました:',
                e
              );
            }
            // 空ならマップ片付け
            if (
              connectedUsersMap[prevPrototypeId] &&
              Object.keys(connectedUsersMap[prevPrototypeId]).length === 0
            ) {
              delete connectedUsersMap[prevPrototypeId];
            }
          }
          // ソケットを旧ルームから退出
          try {
            socket.leave(prevPrototypeId);
          } catch (error) {
            console.error('Error while leaving the previous room:', error);
          }
        }

        // socket.dataにprototypeIdとuserIdを設定
        socket.data = {
          ...socket.data,
          prototypeId,
          userId,
          username: user.username,
        } as SocketData;

        socket.join(prototypeId);

        // 接続中ユーザーマップに追加
        if (!connectedUsersMap[prototypeId]) {
          connectedUsersMap[prototypeId] = {};
        }
        connectedUsersMap[prototypeId][userId] = {
          userId: user.id,
          username: user.username,
        };

        const partsAndProperties = await fetchPartsAndProperties(prototypeId);
        socket.emit(PROTOTYPE_SOCKET_EVENT.INITIAL_PARTS, partsAndProperties);

        // 接続中ユーザーリストを全クライアントに送信
        io.to(prototypeId).emit(PROTOTYPE_SOCKET_EVENT.CONNECTED_USERS, {
          users: Object.values(connectedUsersMap[prototypeId] || {}),
        });

        // プロジェクトルーム全体にルーム別接続中ユーザー更新を通知
        const projectId = prototype.projectId;
        io.to(`project:${projectId}`).emit(
          PROJECT_SOCKET_EVENT.ROOM_CONNECTED_USERS_UPDATE,
          {
            prototypeId,
            users: Object.values(connectedUsersMap[prototypeId] || {}),
          }
        );
      } catch (error) {
        console.error('プロトタイプの参加に失敗しました。', error);
      }
    }
  );
}

/**
 * パーツ一括更新
 * 複数のパーツを一度に更新する
 * @param socket - Socket
 * @param io - Server
 */
function handleUpdateParts(socket: Socket, io: Server): void {
  socket.on(
    PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS,
    async ({
      updates,
    }: {
      updates: {
        partId: number;
        updatePart?: Partial<PartModel>;
        updateProperties?: Partial<PartPropertyModel>[];
      }[];
    }) => {
      const { prototypeId } = socket.data as SocketData;

      try {
        if (!updates || updates.length === 0) return;

        const updatedParts: PartModel[] = [];
        const propertyPartIds = new Set<number>();

        // 入力IDの正規化とルーム制約
        const normalizedIds = Array.from(
          new Set(
            updates.map((u) => u.partId).filter((v) => Number.isInteger(v))
          )
        ) as number[];

        const t = await PartModel.sequelize!.transaction();
        try {
          // 同じ prototype のパーツID のみ有効とする
          const partsInRoom = await PartModel.findAll({
            attributes: ['id'],
            where: { prototypeId, id: { [Op.in]: normalizedIds } },
            transaction: t,
          });
          const validIds = new Set(partsInRoom.map((p) => p.id));

          for (const { partId, updatePart, updateProperties } of updates) {
            if (!validIds.has(partId)) continue;

            // 更新対象フィールドはホワイトリストから選択
            if (updatePart && Object.keys(updatePart).length > 0) {
              const updateData = Object.entries(updatePart).reduce(
                (acc, [key, value]) => {
                  if (
                    value !== undefined &&
                    UPDATABLE_PROTOTYPE_FIELDS.PART.includes(key)
                  ) {
                    // @ts-expect-error 動的キー
                    acc[key] = value;
                  }
                  return acc;
                },
                {} as Partial<PartModel>
              );

              if (Object.keys(updateData).length > 0) {
                const [, result] = await PartModel.update(updateData, {
                  where: { id: partId, prototypeId },
                  returning: true,
                  transaction: t,
                });
                if (result[0]) {
                  updatedParts.push(result[0].dataValues);
                }
              }
            }

            // プロパティ更新：side が必須（WHERE句のキー）
            if (updateProperties && updateProperties.length > 0) {
              const updatePromises = updateProperties
                .filter((property) => property.side !== undefined)
                .map((property) => {
                  // mass-assignment防止: id / partId / side は更新しない
                  const propertyUpdateData = Object.entries(property).reduce(
                    (acc, [key, value]) => {
                      if (value === undefined) return acc;
                      if (key === 'id' || key === 'partId' || key === 'side')
                        return acc;
                      // @ts-expect-error 動的キーの代入
                      acc[key] = value;
                      return acc;
                    },
                    {} as Partial<PartPropertyModel>
                  );
                  if (Object.keys(propertyUpdateData).length === 0) {
                    return Promise.resolve();
                  }
                  return PartPropertyModel.update(propertyUpdateData, {
                    where: { partId, side: property.side },
                    transaction: t,
                  });
                });
              await Promise.all(updatePromises);
              propertyPartIds.add(partId);
            }
          }

          await t.commit();
        } catch (e) {
          await t.rollback();
          throw e;
        }

        const updatedPropertiesWithImages =
          propertyPartIds.size > 0
            ? await fetchPropertiesWithImagesByPartIds([...propertyPartIds])
            : [];

        io.to(prototypeId).emit(PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS, {
          parts: updatedParts.map((part) => part),
          properties: updatedPropertiesWithImages,
        });
      } catch (error) {
        console.error('パーツの一括更新に失敗しました。', error);
      }
    }
  );
}

/**
 * パーツ追加
 * @param socket - Socket
 * @param io - Server
 */
function handleAddPart(socket: Socket, io: Server): void {
  socket.on(
    PROTOTYPE_SOCKET_EVENT.ADD_PART,
    async ({
      part,
      properties,
    }: {
      part: Omit<PartModel, 'id'>;
      properties: Omit<PartPropertyModel, 'id' | 'partId'>[];
    }) => {
      const { prototypeId } = socket.data as SocketData;

      /**
       * 新しいパーツのorder値を計算する
       * @param parts - 既存のパーツ配列（orderの昇順でソート済み）
       * @param partType - パーツのタイプ
       * @returns 新しいパーツのorder値
       */
      const calculateNewPartOrder = (
        parts: PartModel[],
        partType: string
      ): number => {
        if (parts.length === 0) {
          // パーツが存在しない場合は中央値
          return (ORDER_MAX_EXCLUSIVE + ORDER_MIN_EXCLUSIVE) / 2;
        } else if (partType === 'card' || partType === 'token') {
          // カード・トークンは最前面に追加
          const maxOrder = parts[parts.length - 1].order;
          return (maxOrder + ORDER_MAX_EXCLUSIVE) / 2;
        } else {
          // それ以外のパーツは最背面に追加
          const minOrder = parts[0].order;
          return (minOrder + ORDER_MIN_EXCLUSIVE) / 2;
        }
      };

      try {
        const parts = await PartModel.findAll({
          where: { prototypeId },
          order: [['order', 'ASC']],
        });

        const newOrder = calculateNewPartOrder(parts, part.type);

        const newPart = await PartModel.create({
          ...part,
          prototypeId,
          order: newOrder,
        });

        const propertyCreationPromises = properties.map((property) => {
          return PartPropertyModel.create({
            ...property,
            partId: newPart.id,
          });
        });

        await Promise.all(propertyCreationPromises);

        const newPropertiesWithImages =
          await fetchPropertiesWithImagesByPartIds([newPart.id]);

        io.to(prototypeId).emit(PROTOTYPE_SOCKET_EVENT.ADD_PART, {
          part: newPart,
          properties: newPropertiesWithImages,
        });

        // 新しいパーツを正しい位置に挿入してソート順を維持
        const updatedParts = [...parts, newPart].sort(
          (a, b) => a.order - b.order
        );

        if (isRebalanceNeeded(updatedParts)) {
          await rebalanceOrders(prototypeId, updatedParts, io);
        }

        // 新しいパーツのIDをクライアントに送信
        // これによりクライアント側で新パーツをすぐ参照できるようになる
        // emitUpdatedPartsAndPropertiesの後にemitしないと
        // パーツを正しく参照できず機能しない
        socket.emit(PROTOTYPE_SOCKET_EVENT.ADD_PART_RESPONSE, {
          partId: newPart.id,
        });
      } catch (error) {
        console.error('パーツの追加に失敗しました。', error);
      }
    }
  );
}

/**
 * パーツ更新
 * @param socket - Socket
 * @param io - Server
 */
function handleUpdatePart(socket: Socket, io: Server): void {
  socket.on(
    PROTOTYPE_SOCKET_EVENT.UPDATE_PART,
    async ({
      partId,
      updatePart,
      updateProperties,
    }: {
      partId: number;
      updatePart: Partial<PartModel>;
      updateProperties?: Omit<PartPropertyModel, 'id' | 'partId'>[];
    }) => {
      const { prototypeId } = socket.data as SocketData;

      let updatedPart: PartModel | null = null;
      let updatedPropertiesWithImages: PartPropertyModel[] | null = null;

      try {
        // Partの更新
        if (updatePart && Object.keys(updatePart).length > 0) {
          const updateData = Object.entries(updatePart).reduce(
            (acc, [key, value]) => {
              if (
                value !== undefined &&
                UPDATABLE_PROTOTYPE_FIELDS.PART.includes(key)
              ) {
                return { ...acc, [key]: value };
              }
              return acc;
            },
            {} as Partial<PartModel>
          );
          const [, result] = await PartModel.update(updateData, {
            where: { id: partId },
            returning: true,
          });
          updatedPart = result[0].dataValues;
        }

        // PartPropertiesの更新
        if (updateProperties) {
          const updatePromises = updateProperties.map((property) => {
            return PartPropertyModel.update(
              { ...property, partId },
              {
                where: { partId, side: property.side },
                returning: true,
              }
            );
          });

          // 更新処理の実行
          await Promise.all(updatePromises);

          // 更新したPartProperty及び紐づく画像を取得
          updatedPropertiesWithImages =
            await fetchPropertiesWithImagesByPartIds([partId]);
        }

        io.to(prototypeId).emit(PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS, {
          parts: updatedPart ? [updatedPart] : [],
          properties: updatedPropertiesWithImages
            ? updatedPropertiesWithImages
            : [],
        });
      } catch (error) {
        console.error('パーツの更新に失敗しました。', error);
      }
    }
  );
}

/**
 * パーツ一括削除
 * 複数のパーツを一度に削除する
 * @socket - Socket
 * @io - Server
 */
function handleDeleteParts(socket: Socket, io: Server): void {
  socket.on(
    PROTOTYPE_SOCKET_EVENT.DELETE_PARTS,
    async ({ partIds }: { partIds: number[] }) => {
      const { prototypeId } = socket.data as SocketData;

      try {
        // 空の配列を防ぐためのガード
        if (!partIds || partIds.length === 0) return;

        // 入力の正規化・重複排除
        const normalizedIds = Array.from(
          new Set(partIds.filter((v) => Number.isInteger(v)))
        ) as number[];

        // 現在のプロトタイプに属するIDのみに限定
        const partsInRoom = await PartModel.findAll({
          attributes: ['id'],
          where: {
            prototypeId,
            id: { [Op.in]: normalizedIds },
          },
        });
        const targetIds = partsInRoom.map((p) => p.id);
        if (targetIds.length === 0) return;

        await PartModel.destroy({
          where: { prototypeId, id: { [Op.in]: targetIds } },
        });

        io.to(prototypeId).emit(PROTOTYPE_SOCKET_EVENT.DELETE_PARTS, {
          partIds: targetIds,
        });
      } catch (error) {
        console.error(
          'パーツの一括削除に失敗しました。partIds:',
          partIds,
          error
        );
      }
    }
  );
}

/**
 * パーツの順番を変更
 * @param socket - Socket
 * @param io - Server
 */
function handleChangeOrder(socket: Socket, io: Server): void {
  socket.on(
    PROTOTYPE_SOCKET_EVENT.CHANGE_ORDER,
    async ({
      partId,
      type,
    }: {
      partId: number;
      type: 'back' | 'front' | 'backmost' | 'frontmost';
    }) => {
      const { prototypeId } = socket.data as SocketData;

      try {
        const getPartsWithRebalanceIfNeeded = async () => {
          const parts = await PartModel.findAll({
            where: { prototypeId },
            order: [['order', 'ASC']],
          });

          // リバランスが必要なら実行し、リバランス済みパーツを取得
          if (isRebalanceNeeded(parts)) {
            return await rebalanceOrders(prototypeId, parts, io);
          }

          return parts;
        };

        const partsBackToFront = await getPartsWithRebalanceIfNeeded();

        const selfPartIndex = partsBackToFront.findIndex(
          (part) => part.id === partId
        );
        if (selfPartIndex === -1) return;

        // 最背面、かつ背面に移動しようとした場合は何もしない
        if (selfPartIndex === 0 && (type === 'back' || type === 'backmost')) {
          return;
        }

        // 最前面、かつ前面に移動しようとした場合は何もしない
        if (
          selfPartIndex === partsBackToFront.length - 1 &&
          (type === 'front' || type === 'frontmost')
        ) {
          return;
        }

        switch (type) {
          case 'back': {
            // 一つ後ろに移動
            const selfPart = partsBackToFront[selfPartIndex];
            const underLappingPart = partsBackToFront
              .filter(
                (part) =>
                  part.order < selfPart.order && isOverlapping(selfPart, part)
              )
              .sort((a, b) => b.order - a.order)[0]; // orderの降順でソートして最初を取得

            if (underLappingPart) {
              const prevPartIndex = partsBackToFront.findIndex(
                (part) => part.id === underLappingPart.id
              );
              const newOrder =
                (underLappingPart.order +
                  (partsBackToFront[prevPartIndex - 1]?.order ??
                    ORDER_MIN_EXCLUSIVE)) /
                2;
              const [, result] = await PartModel.update(
                { order: newOrder },
                { where: { id: partId }, returning: true }
              );
              io.to(prototypeId).emit(PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS, {
                parts: [result[0].dataValues],
                properties: [],
              });
            }
            break;
          }
          case 'front': {
            // 一つ前に移動
            const selfPart = partsBackToFront[selfPartIndex];
            const overLappingPart = partsBackToFront.find(
              (part) =>
                part.order > selfPart.order && isOverlapping(selfPart, part)
            );

            if (overLappingPart) {
              const nextPartIndex = partsBackToFront.findIndex(
                (part) => part.id === overLappingPart.id
              );
              const newOrder =
                (overLappingPart.order +
                  (partsBackToFront[nextPartIndex + 1]?.order ??
                    ORDER_MAX_EXCLUSIVE)) /
                2;
              const [, result] = await PartModel.update(
                { order: newOrder },
                { where: { id: partId }, returning: true }
              );
              io.to(prototypeId).emit(PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS, {
                parts: [result[0].dataValues],
                properties: [],
              });
            }
            break;
          }
          case 'backmost': {
            // 最背面に移動
            const partBackMost = partsBackToFront[0];
            const newOrder = (partBackMost.order + ORDER_MIN_EXCLUSIVE) / 2;
            const [, result] = await PartModel.update(
              { order: newOrder },
              { where: { id: partId }, returning: true }
            );
            io.to(prototypeId).emit(PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS, {
              parts: [result[0].dataValues],
              properties: [],
            });
            break;
          }
          case 'frontmost': {
            // 最前面に移動
            const partFrontMost = partsBackToFront[partsBackToFront.length - 1];
            const newOrder = (partFrontMost.order + ORDER_MAX_EXCLUSIVE) / 2;

            const [, result] = await PartModel.update(
              { order: newOrder },
              { where: { id: partId }, returning: true }
            );

            io.to(prototypeId).emit(PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS, {
              parts: [result[0].dataValues],
              properties: [],
            });
            break;
          }
          default:
            return;
        }
      } catch (error) {
        console.error('パーツの順番変更に失敗しました。', error);
      }
    }
  );
}

/**
 * カードをシャッフル
 * @param socket - Socket
 * @param io - Server
 */
function handleShuffleDeck(socket: Socket, io: Server): void {
  socket.on(
    PROTOTYPE_SOCKET_EVENT.SHUFFLE_DECK,
    async ({ deckId }: { deckId: number }) => {
      const { prototypeId } = socket.data as SocketData;

      try {
        const deck = await PartModel.findByPk(deckId);
        if (!deck || deck.type !== 'deck') return;

        const cards = await PartModel.findAll({
          where: { prototypeId, type: 'card' },
        });
        // カードの中心がデッキパーツ内にあるカードを取得
        const cardsOnDeck = cards.filter((card) => {
          const cardCenter = {
            x: card.position.x + card.width / 2,
            y: card.position.y + card.height / 2,
          };
          return (
            deck.position.x <= cardCenter.x &&
            cardCenter.x <= deck.position.x + deck.width &&
            deck.position.y <= cardCenter.y &&
            cardCenter.y <= deck.position.y + deck.height
          );
        });
        const shuffledCards = shuffleDeck(cardsOnDeck);
        const updatedCards = await persistDeckOrder(shuffledCards);
        io.to(prototypeId).emit(PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS, {
          parts: updatedCards,
          properties: [],
        });
      } catch (error) {
        console.error('カードのシャッフルに失敗しました。', error);
      }
    }
  );
}

/**
 * パーツ選択情報の共有を処理する
 * @param socket - Socket
 */
function handleSelectedParts(socket: Socket): void {
  socket.on(
    PROTOTYPE_SOCKET_EVENT.SELECTED_PARTS,
    ({ selectedPartIds }: { selectedPartIds: number[] }) => {
      const { prototypeId, userId, username } = socket.data as SocketData;
      socket.to(prototypeId).emit(PROTOTYPE_SOCKET_EVENT.SELECTED_PARTS, {
        userId,
        username,
        selectedPartIds,
      });
    }
  );
}

/**
 * カーソル情報の更新
 * @param socket - Socket
 * @param io - Server
 */

/**
 * Ordersのリバランス
 * パーツのorder値を等間隔に再配置する
 * @param prototypeId - プロトタイプID
 * @param parts - パーツの配列
 * @param io - Server
 * @returns Promise<PartModel[]> - リバランス済みのパーツ配列を返すPromise
 */
async function rebalanceOrders(
  prototypeId: string,
  parts: PartModel[],
  io: Server
): Promise<PartModel[]> {
  console.log('Rebalancing orders for parts in prototype:', prototypeId);
  const totalParts = parts.length;

  // ORDER_RANGEを基に等間隔のステップを計算
  const step = ORDER_RANGE / (totalParts + 1);

  // partsの各要素のorderを直接更新
  parts.forEach((part, i) => {
    part.order = ORDER_MIN_EXCLUSIVE + step * (i + 1);
  });

  await Promise.all(
    parts.map((part) =>
      PartModel.update({ order: part.order }, { where: { id: part.id } })
    )
  );

  io.to(prototypeId).emit(PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS, {
    parts: parts.map((part) => part.dataValues),
    properties: [],
  });

  console.log('Rebalancing completed for prototype:', prototypeId);

  // リバランス済みのパーツ配列を返す
  return parts;
}

/**
 * 最小限のOrder間隔チェック
 * パーツのorder値間隔が最小値を下回っているかチェックする
 * @param parts - パーツの配列
 * @returns boolean - リバランスが必要な場合はtrue、不要な場合はfalse
 */
function isRebalanceNeeded(parts: PartModel[]): boolean {
  return parts.some((part, index) => {
    // 最初のパーツの場合はチェック不要
    if (index === 0) return false;
    return part.order - parts[index - 1].order < MIN_ORDER_GAP;
  });
}

export default function handlePrototype(socket: Socket, io: Server): void {
  handleJoinPrototype(socket, io);
  handleAddPart(socket, io);
  handleUpdateParts(socket, io);
  handleUpdatePart(socket, io);
  handleDeleteParts(socket, io);
  handleChangeOrder(socket, io);
  handleShuffleDeck(socket, io);
  handleSelectedParts(socket);

  socket.on(COMMON_SOCKET_EVENT.DISCONNECTING, async () => {
    // ソケットが切断される直前に呼び出される
    for (const room of socket.rooms) {
      // プロトタイプルームの場合（自身の socket.id 以外 かつ 管理対象のルーム）
      if (room !== socket.id && connectedUsersMap[room]) {
        const prototypeId = room;
        const { userId } = socket.data as SocketData;
        if (!userId) continue;

        if (connectedUsersMap[prototypeId]) {
          // 接続中ユーザー情報から削除
          delete connectedUsersMap[prototypeId][userId];

          // 残りのユーザーに更新を通知
          io.to(prototypeId).emit(PROTOTYPE_SOCKET_EVENT.CONNECTED_USERS, {
            users: Object.values(connectedUsersMap[prototypeId] || {}),
          });

          // プロジェクトルームに更新を通知
          try {
            const prototype = await PrototypeModel.findByPk(prototypeId);
            if (prototype) {
              io.to(`project:${prototype.projectId}`).emit(
                PROJECT_SOCKET_EVENT.ROOM_CONNECTED_USERS_UPDATE,
                {
                  prototypeId,
                  users: Object.values(connectedUsersMap[prototypeId] || {}),
                }
              );
            }
          } catch (e) {
            console.error('プロジェクトルームへの通知に失敗しました:', e);
          }

          // ルームが空の場合、エントリを削除
          if (
            connectedUsersMap[prototypeId] &&
            Object.keys(connectedUsersMap[prototypeId]).length === 0
          ) {
            delete connectedUsersMap[prototypeId];
          }

          // 選択中パーツ情報をリセット
          io.to(prototypeId).emit(PROTOTYPE_SOCKET_EVENT.SELECTED_PARTS, {
            userId,
            username: (socket.data as SocketData).username,
            selectedPartIds: [],
          });
        }
      }
    }
  });

  socket.on(COMMON_SOCKET_EVENT.DISCONNECT, async () => {
    // ソケットが完全に切断されたときに呼び出される
    const { prototypeId, userId } = socket.data as SocketData;
    if (prototypeId && userId) {
      // 接続中ユーザー情報から削除
      if (connectedUsersMap[prototypeId]) {
        delete connectedUsersMap[prototypeId][userId];
      }

      // 更新された接続中ユーザーリストを通知
      io.to(prototypeId).emit(PROTOTYPE_SOCKET_EVENT.CONNECTED_USERS, {
        users: Object.values(connectedUsersMap[prototypeId] || {}),
      });

      // プロジェクトルームにユーザー切断を通知
      try {
        const prototype = await PrototypeModel.findByPk(prototypeId);
        if (prototype) {
          const projectId = prototype.projectId;
          io.to(`project:${projectId}`).emit(
            PROJECT_SOCKET_EVENT.ROOM_CONNECTED_USERS_UPDATE,
            {
              prototypeId,
              users: Object.values(connectedUsersMap[prototypeId] || {}),
            }
          );
        }
      } catch (error) {
        console.error(
          'プロジェクトルームへのユーザー切断通知に失敗しました:',
          error
        );
      }

      // ルームが空の場合、エントリを削除
      if (
        connectedUsersMap[prototypeId] &&
        Object.keys(connectedUsersMap[prototypeId]).length === 0
      ) {
        delete connectedUsersMap[prototypeId];
      }
    }
  });
}
