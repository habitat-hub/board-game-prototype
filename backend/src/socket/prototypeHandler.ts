import { Server, Socket } from 'socket.io';
import PartModel from '../models/Part';
import PartPropertyModel from '../models/PartProperty';
import PlayerModel from '../models/Player';
import { UPDATABLE_PROTOTYPE_FIELDS } from '../const';
import PrototypeVersionModel from '../models/PrototypeVersion';
import {
  getOverLappingPart,
  getUnderLappingPart,
  shuffleDeck,
} from '../helpers/prototypeHelper';
import type { CursorInfo } from '../types/cursor';
import ImageModel from '../models/Image';

// カーソル情報のマップ
const cursorMap: Record<string, Record<string, CursorInfo>> = {};

// socket.dataの型定義
interface SocketData {
  prototypeVersionId: string;
  userId: string;
}

/**
 * 指定されたプロトタイプバージョンIDに関連する全てのパーツとプロパティを取得する。
 *
 * @param {string} prototypeVersionId - プロトタイプバージョンID
 * @returns {Promise<{ parts: PartModel[], properties: PartPropertyModel[] }>} - プロトタイプバージョンに関連するパーツとプロパティの配列を含むオブジェクトを返すPromise
 */
async function fetchPartsAndProperties(prototypeVersionId: string) {
  const [parts, properties] = await Promise.all([
    PartModel.findAll({
      where: { prototypeVersionId },
    }),
    PartPropertyModel.findAll({
      include: [
        {
          model: PartModel,
          required: true, // INNER JOIN
          where: { prototypeVersionId },
        },
        {
          model: ImageModel,
          required: false, // LEFT JOIN
        },
      ],
    }),
  ]);

  return { parts, properties };
}

/**
 * 指定されたプロトタイプバージョンIDに関連する全てのパーツとプロパティを取得し、
 * それらをクライアントにemitする。
 * @param io - Server
 * @param {string} prototypeVersionId - プロトタイプバージョンID
 */
async function emitUpdatedPartsAndProperties(
  io: Server,
  prototypeVersionId: string
) {
  const { parts, properties } =
    await fetchPartsAndProperties(prototypeVersionId);
  io.to(prototypeVersionId).emit('UPDATE_PARTS', { parts, properties });
}

/**
 * プロトタイプ参加
 * @param socket - Socket
 */
function handleJoinPrototype(socket: Socket) {
  socket.on(
    'JOIN_PROTOTYPE',
    async ({
      prototypeVersionId,
      userId,
    }: {
      prototypeVersionId: string;
      userId: string;
    }) => {
      try {
        const prototypeVersion =
          await PrototypeVersionModel.findByPk(prototypeVersionId);
        if (!prototypeVersion) return;

        // socket.dataにprototypeVersionIdとuserIdを設定
        socket.data = {
          ...socket.data,
          prototypeVersionId,
          userId,
        } as SocketData;

        socket.join(prototypeVersionId);

        const promises = [
          PlayerModel.findAll({
            where: { prototypeVersionId },
            order: [['id', 'ASC']],
          }),
          fetchPartsAndProperties(prototypeVersionId),
        ];

        const [players, partsAndProperties] = await Promise.all(promises);
        socket.emit('UPDATE_PLAYERS', players);
        socket.emit('UPDATE_PARTS', partsAndProperties);
        socket.emit('UPDATE_CURSORS', {
          cursors: cursorMap[prototypeVersionId] || {},
        });
      } catch (error) {
        console.error('プロトタイプの参加に失敗しました。', error);
      }
    }
  );
}

/**
 * パーツ追加
 * @param socket - Socket
 * @param io - Server
 */
function handleAddPart(socket: Socket, io: Server) {
  socket.on(
    'ADD_PART',
    async ({
      part,
      properties,
    }: {
      part: Omit<PartModel, 'id'>;
      properties: Omit<PartPropertyModel, 'id' | 'partId'>[];
    }) => {
      const { prototypeVersionId } = socket.data as SocketData;

      try {
        const maxOrder: number = await PartModel.max('order', {
          where: { prototypeVersionId },
        });

        const newPart = await PartModel.create({
          ...part,
          prototypeVersionId,
          order: (maxOrder + 1) / 2,
        });

        const propertyCreationPromises = properties.map((property) => {
          return PartPropertyModel.create({
            ...property,
            partId: newPart.id,
          });
        });

        await Promise.all(propertyCreationPromises);
        await emitUpdatedPartsAndProperties(io, prototypeVersionId);
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
function handleUpdatePart(socket: Socket, io: Server) {
  socket.on(
    'UPDATE_PART',
    async ({
      partId,
      updatePart,
      updateProperties,
    }: {
      partId: number;
      updatePart: Partial<PartModel>;
      updateProperties?: Omit<PartPropertyModel, 'id' | 'partId'>[];
    }) => {
      const { prototypeVersionId } = socket.data as SocketData;

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
          await PartModel.update(updateData, { where: { id: partId } });
        }

        // PartPropertiesの更新
        if (updateProperties) {
          const updatePromises = updateProperties.map((property) => {
            return PartPropertyModel.update(property, {
              where: { partId, side: property.side },
            });
          });

          // 更新処理の実行
          await Promise.all(updatePromises);
        }
        await emitUpdatedPartsAndProperties(io, prototypeVersionId);
      } catch (error) {
        console.error('パーツの更新に失敗しました。', error);
      }
    }
  );
}

/**
 * パーツ削除
 * @param socket - Socket
 * @param io - Server
 */
function handleDeletePart(socket: Socket, io: Server) {
  socket.on('DELETE_PART', async ({ partId }: { partId: number }) => {
    const { prototypeVersionId } = socket.data as SocketData;

    // PartPropertyは CASCADE で自動的に削除される
    await PartModel.destroy({ where: { id: partId } });
    await emitUpdatedPartsAndProperties(io, prototypeVersionId);
  });
}

// TODO: ReverseCardという名前に変える
/**
 * カードを反転させる
 * @param socket - Socket
 * @param io - Server
 */
function handleFlipCard(socket: Socket, io: Server) {
  socket.on(
    'FLIP_CARD',
    async ({
      cardId,
      isNextFlipped,
    }: {
      cardId: number;
      isNextFlipped: boolean;
    }) => {
      const { prototypeVersionId } = socket.data as SocketData;

      try {
        await PartModel.update(
          { isFlipped: isNextFlipped },
          { where: { id: cardId } }
        );

        io.to(prototypeVersionId).emit('FLIP_CARD', {
          cardId,
          isNextFlipped,
        });

        await emitUpdatedPartsAndProperties(io, prototypeVersionId);
      } catch (error) {
        console.error('カードの反転に失敗しました。', error);
      }
    }
  );
}

/**
 * パーツの順番を変更
 * @param socket - Socket
 * @param io - Server
 */
function handleChangeOrder(socket: Socket, io: Server) {
  socket.on(
    'CHANGE_ORDER',
    async ({
      partId,
      type,
    }: {
      partId: number;
      type: 'back' | 'front' | 'backmost' | 'frontmost';
    }) => {
      const { prototypeVersionId } = socket.data as SocketData;

      try {
        const sortedParts = await PartModel.findAll({
          where: { prototypeVersionId },
          order: [['order', 'ASC']],
        });

        const selfPartIndex = sortedParts.findIndex(
          (part) => part.id === partId
        );
        if (selfPartIndex === -1) return;

        // 最背面、かつ背面に移動しようとした場合は何もしない
        if (selfPartIndex === 0 && (type === 'back' || type === 'backmost')) {
          return;
        }

        // 最前面、かつ前面に移動しようとした場合は何もしない
        if (
          selfPartIndex === sortedParts.length - 1 &&
          (type === 'front' || type === 'frontmost')
        ) {
          return;
        }

        switch (type) {
          case 'back': {
            // 一つ後ろに移動
            const underLappingPart = await getUnderLappingPart(
              partId,
              sortedParts
            );
            if (underLappingPart) {
              const prevPartIndex = sortedParts.findIndex(
                (part) => part.id === underLappingPart.id
              );
              const newOrder =
                (underLappingPart.order +
                  (sortedParts[prevPartIndex - 1]?.order ?? 0)) /
                2;
              await PartModel.update(
                { order: newOrder },
                { where: { id: partId } }
              );
              await emitUpdatedPartsAndProperties(io, prototypeVersionId);
            }
            break;
          }
          case 'front': {
            // 一つ前に移動
            const overLappingPart = await getOverLappingPart(
              partId,
              sortedParts
            );
            if (overLappingPart) {
              const nextPartIndex = sortedParts.findIndex(
                (part) => part.id === overLappingPart.id
              );
              const newOrder =
                (overLappingPart.order +
                  (sortedParts[nextPartIndex + 1]?.order ?? 1)) /
                2;
              await PartModel.update(
                { order: newOrder },
                { where: { id: partId } }
              );
              await emitUpdatedPartsAndProperties(io, prototypeVersionId);
            }
            break;
          }
          case 'backmost': {
            // 最背面に移動
            const firstPart = sortedParts[0];
            const newOrder = (firstPart.order + 0) / 2;
            await PartModel.update(
              { order: newOrder },
              { where: { id: partId } }
            );
            await emitUpdatedPartsAndProperties(io, prototypeVersionId);
            break;
          }
          case 'frontmost': {
            // 最前面に移動
            const lastPart = sortedParts[sortedParts.length - 1];
            const newOrder = (lastPart.order + 1) / 2;
            await PartModel.update(
              { order: newOrder },
              { where: { id: partId } }
            );
            await emitUpdatedPartsAndProperties(io, prototypeVersionId);
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
function handleShuffleDeck(socket: Socket, io: Server) {
  socket.on('SHUFFLE_DECK', async ({ deckId }: { deckId: number }) => {
    const { prototypeVersionId } = socket.data as SocketData;

    try {
      const cardsOnDeck = await PartModel.findAll({
        where: { prototypeVersionId, type: 'card', parentId: deckId },
      });
      await shuffleDeck(cardsOnDeck);
      await emitUpdatedPartsAndProperties(io, prototypeVersionId);
    } catch (error) {
      console.error('カードのシャッフルに失敗しました。', error);
    }
  });
}

/**
 * プレイヤーに紐づけるユーザーを更新
 * @param socket - Socket
 * @param io - Server
 */
function handleUpdatePlayerUser(socket: Socket, io: Server) {
  socket.on(
    'UPDATE_PLAYER_USER',
    async ({
      playerId,
      userId,
    }: {
      playerId: number;
      userId: string | null;
    }) => {
      const { prototypeVersionId } = socket.data as SocketData;

      try {
        await PlayerModel.update({ userId }, { where: { id: playerId } });
        const players = await PlayerModel.findAll({
          where: { prototypeVersionId },
          order: [['id', 'ASC']],
        });

        io.to(prototypeVersionId).emit('UPDATE_PLAYERS', players);
      } catch (error) {
        console.error('プレイヤーのユーザー更新に失敗しました。', error);
      }
    }
  );
}

/**
 * カーソル情報の更新
 * @param socket - Socket
 * @param io - Server
 */
function handleUpdateCursor(socket: Socket, io: Server) {
  socket.on('UPDATE_CURSOR', (cursorInfo: CursorInfo) => {
    const { prototypeVersionId } = socket.data as SocketData;

    if (!prototypeVersionId || !cursorInfo.userId) return;

    // プロトタイプごとのカーソル情報を初期化
    if (!cursorMap[prototypeVersionId]) {
      cursorMap[prototypeVersionId] = {};
    }

    cursorMap[prototypeVersionId][cursorInfo.userId] = cursorInfo;

    io.to(prototypeVersionId).emit('UPDATE_CURSORS', {
      cursors: cursorMap[prototypeVersionId],
    });
  });
}

export default function handlePrototype(socket: Socket, io: Server) {
  handleJoinPrototype(socket);
  handleAddPart(socket, io);
  handleUpdatePart(socket, io);
  handleDeletePart(socket, io);
  handleFlipCard(socket, io);
  handleChangeOrder(socket, io);
  handleShuffleDeck(socket, io);
  handleUpdatePlayerUser(socket, io);
  handleUpdateCursor(socket, io);

  socket.on('disconnect', () => {
    const { prototypeVersionId, userId } = socket.data as SocketData;
    if (prototypeVersionId && userId) {
      delete cursorMap[prototypeVersionId]?.[userId];
      io.to(prototypeVersionId).emit('UPDATE_CURSORS', {
        cursors: cursorMap[prototypeVersionId] || {},
      });
    }
  });
}
