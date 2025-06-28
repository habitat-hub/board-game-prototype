import { Server, Socket } from 'socket.io';
import PartModel from '../models/Part';
import PartPropertyModel from '../models/PartProperty';
import { UPDATABLE_PROTOTYPE_FIELDS } from '../const';
import PrototypeModel from '../models/Prototype';
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
  prototypeId: string;
  userId: string;
}

/**
 * 指定されたプロトタイプバージョンIDに関連する全てのパーツとプロパティを取得する。
 *
 * @param {string} prototypeId - プロトタイプID
 * @returns {Promise<{ parts: PartModel[], properties: PartPropertyModel[] }>} - プロトタイプに関連するパーツとプロパティの配列を含むオブジェクトを返すPromise
 */
async function fetchPartsAndProperties(prototypeId: string) {
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
 * 指定されたプロトタイプバージョンIDに関連する全てのパーツとプロパティを取得し、
 * それらをクライアントにemitする。
 * @param io - Server
 * @param {string} prototypeId- プロトタイプバージョンID
 */
export async function emitUpdatedPartsAndProperties(
  io: Server,
  prototypeId: string
) {
  const { parts, properties } = await fetchPartsAndProperties(prototypeId);
  io.to(prototypeId).emit('UPDATE_PARTS', { parts, properties });
}

/**
 * プロトタイプ参加
 * @param socket - Socket
 */
function handleJoinPrototype(socket: Socket) {
  socket.on(
    'JOIN_PROTOTYPE',
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

        // socket.dataにprototypeIdとuserIdを設定
        socket.data = {
          ...socket.data,
          prototypeId,
          userId,
        } as SocketData;

        socket.join(prototypeId);

        const partsAndProperties = await fetchPartsAndProperties(prototypeId);
        socket.emit('UPDATE_PARTS', partsAndProperties);
        socket.emit('UPDATE_CURSORS', {
          cursors: cursorMap[prototypeId] || {},
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
      const { prototypeId } = socket.data as SocketData;

      try {
        const maxOrder: number | null = await PartModel.max('order', {
          where: { prototypeId },
        });

        // maxOrderがnullの場合（まだパーツが存在しない場合）は1、
        // そうでなければmaxOrder + 1を使用
        const newOrder = maxOrder === null ? 1 : maxOrder + 1;

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

        await emitUpdatedPartsAndProperties(io, prototypeId);

        // 新しいパーツのIDをクライアントに送信
        // これによりクライアント側で新パーツをすぐ参照できるようになる
        // emitUpdatedPartsAndPropertiesの後にemitしないと
        // パーツを正しく参照できず機能しない
        socket.emit('ADD_PART_RESPONSE', { partId: newPart.id });
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
      const { prototypeId } = socket.data as SocketData;

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
        await emitUpdatedPartsAndProperties(io, prototypeId);
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
    const { prototypeId } = socket.data as SocketData;

    // PartPropertyは CASCADE で自動的に削除される
    await PartModel.destroy({ where: { id: partId } });
    await emitUpdatedPartsAndProperties(io, prototypeId);
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
      nextFrontSide,
    }: {
      cardId: number;
      nextFrontSide: 'front' | 'back';
    }) => {
      const { prototypeId } = socket.data as SocketData;

      try {
        await PartModel.update(
          { frontSide: nextFrontSide },
          { where: { id: cardId } }
        );

        io.to(prototypeId).emit('FLIP_CARD', {
          cardId,
          nextFrontSide,
        });

        await emitUpdatedPartsAndProperties(io, prototypeId);
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
      const { prototypeId } = socket.data as SocketData;

      try {
        const sortedParts = await PartModel.findAll({
          where: { prototypeId },
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
              await emitUpdatedPartsAndProperties(io, prototypeId);
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
              await emitUpdatedPartsAndProperties(io, prototypeId);
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
            await emitUpdatedPartsAndProperties(io, prototypeId);
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
            await emitUpdatedPartsAndProperties(io, prototypeId);
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
      await shuffleDeck(cardsOnDeck);
      await emitUpdatedPartsAndProperties(io, prototypeId);
    } catch (error) {
      console.error('カードのシャッフルに失敗しました。', error);
    }
  });
}

/**
 * カーソル情報の更新
 * @param socket - Socket
 * @param io - Server
 */
function handleUpdateCursor(socket: Socket, io: Server) {
  socket.on('UPDATE_CURSOR', (cursorInfo: CursorInfo) => {
    const { prototypeId } = socket.data as SocketData;

    if (!prototypeId || !cursorInfo.userId) return;

    // プロトタイプごとのカーソル情報を初期化
    if (!cursorMap[prototypeId]) {
      cursorMap[prototypeId] = {};
    }

    cursorMap[prototypeId][cursorInfo.userId] = cursorInfo;

    io.to(prototypeId).emit('UPDATE_CURSORS', {
      cursors: cursorMap[prototypeId],
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
  handleUpdateCursor(socket, io);

  socket.on('disconnect', () => {
    const { prototypeId, userId } = socket.data as SocketData;
    if (prototypeId && userId) {
      delete cursorMap[prototypeId]?.[userId];
      io.to(prototypeId).emit('UPDATE_CURSORS', {
        cursors: cursorMap[prototypeId] || {},
      });
    }
  });
}
