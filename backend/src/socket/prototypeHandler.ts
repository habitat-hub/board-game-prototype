import { Server, Socket } from 'socket.io';
import PartModel from '../models/Part';
import PartPropertyModel from '../models/PartProperty';
import { UPDATABLE_PROTOTYPE_FIELDS } from '../const';
import PrototypeModel from '../models/Prototype';
import { shuffleDeck, isOverlapping } from '../helpers/prototypeHelper';
import type { CursorInfo } from '../types/cursor';
import ImageModel from '../models/Image';
import {
  MAX_ORDER_VALUE,
  MIN_ORDER_GAP,
} from '../constants/prototypeConstants';

// カーソル情報のマップ
const cursorMap: Record<string, Record<string, CursorInfo>> = {};

// socket.dataの型定義
interface SocketData {
  prototypeId: string;
  userId: string;
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
        socket.emit('INITIAL_PARTS', partsAndProperties);
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
        const parts = await PartModel.findAll({
          where: { prototypeId },
          order: [['order', 'ASC']],
        });

        const maxOrder =
          parts.length > 0 ? parts[parts.length - 1].order : null;

        const newOrder =
          maxOrder === null ? 0.5 : (maxOrder + MAX_ORDER_VALUE) / 2;

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

        io.to(prototypeId).emit('ADD_PART', {
          part: newPart,
          properties: newPropertiesWithImages,
        });

        // 新しいパーツをpartsに追加
        const updatedParts = [...parts, newPart];

        if (isRebalanceNeeded(updatedParts)) {
          await rebalanceOrders(prototypeId, updatedParts, io);
        }

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

        io.to(prototypeId).emit('UPDATE_PARTS', {
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
 * パーツ削除
 * @param socket - Socket
 * @param io - Server
 */
function handleDeletePart(socket: Socket, io: Server) {
  socket.on('DELETE_PART', async ({ partId }: { partId: number }) => {
    const { prototypeId } = socket.data as SocketData;

    // PartPropertyは CASCADE で自動的に削除される
    await PartModel.destroy({ where: { id: partId } });
    io.to(prototypeId).emit('DELETE_PART', { partId });
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
        const [, result] = await PartModel.update(
          { frontSide: nextFrontSide },
          { where: { id: cardId }, returning: true }
        );

        io.to(prototypeId).emit('UPDATE_PARTS', {
          parts: [result[0].dataValues],
          properties: [],
        });

        io.to(prototypeId).emit('FLIP_CARD', {
          cardId,
          nextFrontSide,
        });
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
                  (partsBackToFront[prevPartIndex - 1]?.order ?? 0)) /
                2;
              const [, result] = await PartModel.update(
                { order: newOrder },
                { where: { id: partId }, returning: true }
              );
              io.to(prototypeId).emit('UPDATE_PARTS', {
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
                  (partsBackToFront[nextPartIndex + 1]?.order ?? 1)) /
                2;
              const [, result] = await PartModel.update(
                { order: newOrder },
                { where: { id: partId }, returning: true }
              );
              io.to(prototypeId).emit('UPDATE_PARTS', {
                parts: [result[0].dataValues],
                properties: [],
              });
            }
            break;
          }
          case 'backmost': {
            // 最背面に移動
            const partBackMost = partsBackToFront[0];
            const newOrder = (partBackMost.order + 0) / 2;
            const [, result] = await PartModel.update(
              { order: newOrder },
              { where: { id: partId }, returning: true }
            );
            io.to(prototypeId).emit('UPDATE_PARTS', {
              parts: [result[0].dataValues],
              properties: [],
            });
            break;
          }
          case 'frontmost': {
            // 最前面に移動
            const partFrontMost = partsBackToFront[partsBackToFront.length - 1];
            const newOrder = (partFrontMost.order + MAX_ORDER_VALUE) / 2;

            const [, result] = await PartModel.update(
              { order: newOrder },
              { where: { id: partId }, returning: true }
            );

            io.to(prototypeId).emit('UPDATE_PARTS', {
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
      const updatedCards = await shuffleDeck(cardsOnDeck);
      io.to(prototypeId).emit('UPDATE_PARTS', {
        parts: updatedCards,
        properties: [],
      });
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

  // 0からMAX_ORDER_VALUEの間で等間隔に設定
  // 例えば、3つのパーツがある場合、0.25, 0.5, 0.75のように設定
  const step = MAX_ORDER_VALUE / (totalParts + 1);

  // partsの各要素のorderを直接更新
  parts.forEach((part, i) => {
    part.order = step * (i + 1);
  });

  await Promise.all(
    parts.map((part) =>
      PartModel.update({ order: part.order }, { where: { id: part.id } })
    )
  );

  io.to(prototypeId).emit('UPDATE_PARTS', {
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
