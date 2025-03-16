import { Server, Socket } from 'socket.io';
import PartModel from '../models/Part';
import PartPropertyModel from '../models/PartProperty';
import PlayerModel from '../models/Player';
import { MoveOrderType, PART_TYPE, UPDATABLE_PROTOTYPE_FIELDS } from '../const';
import PrototypeVersionModel from '../models/PrototypeVersion';
import {
  getOverLappingPart,
  getUnderLappingPart,
  shuffleDeck,
} from '../helpers/prototypeHelper';

/**
 * プロトタイプ参加
 * @param socket - Socket
 */
function handleJoinPrototype(socket: Socket) {
  socket.on(
    'JOIN_PROTOTYPE',
    async ({ prototypeVersionId }: { prototypeVersionId: string }) => {
      const prototypeVersion =
        await PrototypeVersionModel.findByPk(prototypeVersionId);
      if (!prototypeVersion) return;

      socket.join(prototypeVersionId);

      const promises = [
        PartModel.findAll({ where: { prototypeVersionId } }),
        fetchPartsAndProperties(prototypeVersionId),
      ];

      const [players, partsAndProperties] = await Promise.all(promises);
      socket.emit('UPDATE_PLAYERS', players);
      socket.emit('UPDATE_PARTS', partsAndProperties);
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
      prototypeVersionId,
      part,
      properties,
    }: {
      prototypeVersionId: string;
      part: Omit<PartModel, 'id'>;
      properties: Omit<PartPropertyModel, 'id' | 'partId'>[];
    }) => {
      const maxOrder = await PartModel.max('order', {
        where: { prototypeVersionId },
      });

      const newPart = await PartModel.create({
        ...part,
        prototypeVersionId,
        order: ((maxOrder as number) + 1) / 2,
      });

      const propertyCreationPromises = properties.map((property) => {
        return PartPropertyModel.create({
          ...property,
          partId: newPart.id,
        });
      });

      await Promise.all(propertyCreationPromises);
      await emitUpdatedPartsAndProperties(io, prototypeVersionId);
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
      prototypeVersionId,
      partId,
      updatePart,
      updateProperties,
    }: {
      prototypeVersionId: string;
      partId: number;
      updatePart: Partial<PartModel>;
      updateProperties?: Omit<PartPropertyModel, 'id' | 'partId'>[];
    }) => {
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
    }
  );
}

/**
 * パーツ削除
 * @param socket - Socket
 * @param io - Server
 */
function handleDeletePart(socket: Socket, io: Server) {
  socket.on(
    'DELETE_PART',
    async ({
      prototypeVersionId,
      partId,
    }: {
      prototypeVersionId: string;
      partId: number;
    }) => {
      // PartPropertyは CASCADE で自動的に削除される
      await PartModel.destroy({ where: { id: partId } });
      await emitUpdatedPartsAndProperties(io, prototypeVersionId);
    }
  );
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
      prototypeVersionId,
      cardId,
      isNextFlipped,
    }: {
      prototypeVersionId: string;
      cardId: number;
      isNextFlipped: boolean;
    }) => {
      await PartModel.update(
        { isFlipped: isNextFlipped },
        { where: { id: cardId } }
      );

      io.to(prototypeVersionId).emit('FLIP_CARD', {
        cardId,
        isNextFlipped,
      });

      await emitUpdatedPartsAndProperties(io, prototypeVersionId);
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
      prototypeVersionId,
      partId,
      type,
    }: {
      prototypeVersionId: string;
      partId: number;
      type: string;
    }) => {
      const sortedParts = await PartModel.findAll({
        where: { prototypeVersionId },
        order: [['order', 'ASC']],
      });

      const selfPartIndex = sortedParts.findIndex((part) => part.id === partId);
      if (selfPartIndex === -1) return;

      // 最背面、かつ背面に移動しようとした場合は何もしない
      if (
        selfPartIndex === 0 &&
        (type === MoveOrderType.BACK || type === MoveOrderType.BACKMOST)
      ) {
        return;
      }

      // 最前面、かつ前面に移動しようとした場合は何もしない
      if (
        selfPartIndex === sortedParts.length - 1 &&
        (type === MoveOrderType.FRONT || type === MoveOrderType.FRONTMOST)
      ) {
        return;
      }

      switch (type) {
        case MoveOrderType.BACK: {
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
        case MoveOrderType.FRONT: {
          // 一つ前に移動
          const overLappingPart = await getOverLappingPart(partId, sortedParts);
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
        case MoveOrderType.BACKMOST: {
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
        case MoveOrderType.FRONTMOST: {
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
    }
  );
}

/**
 * カードをシャッフル
 * @param socket - Socket
 * @param io - Server
 */
function handleShuffleDeck(socket: Socket, io: Server) {
  socket.on(
    'SHUFFLE_DECK',
    async ({
      prototypeVersionId,
      deckId,
    }: {
      prototypeVersionId: string;
      deckId: number;
    }) => {
      const cardsOnDeck = await PartModel.findAll({
        where: { prototypeVersionId, type: PART_TYPE.CARD, parentId: deckId },
      });
      await shuffleDeck(cardsOnDeck);
      await emitUpdatedPartsAndProperties(io, prototypeVersionId);
    }
  );
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
      prototypeVersionId,
      playerId,
      userId,
    }: {
      prototypeVersionId: string;
      playerId: number;
      userId: string | null;
    }) => {
      await PlayerModel.update({ userId }, { where: { id: playerId } });
      const players = await PlayerModel.findAll({
        where: { prototypeVersionId },
      });

      io.to(prototypeVersionId).emit('UPDATE_PLAYERS', players);
    }
  );
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
 * 指定されたプロトタイプバージョンIDに関連する全てのパーツとプロパティを取得する。
 *
 * @param {string} prototypeVersionId - プロトタイプバージョンID
 * @returns {Promise<{ parts: PartModel[], properties: PartPropertyModel[] }>} -
 *          プロトタイプバージョンに関連するパーツとプロパティの配列を含むオブジェクトを返すPromise
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
      ],
    }),
  ]);

  return { parts, properties };
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
}
