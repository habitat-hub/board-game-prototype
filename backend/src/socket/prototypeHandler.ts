import { Server, Socket } from 'socket.io';
import PartModel from '../models/Part';
import PlayerModel from '../models/Player';
import { PART_TYPE } from '../const';
import PrototypeVersionModel from '../models/PrototypeVersion';

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
      if (!prototypeVersion) {
        return;
      }

      const parts = await PartModel.findAll({
        where: { prototypeVersionId: prototypeVersionId },
      });
      const players = await PlayerModel.findAll({
        where: { prototypeVersionId: prototypeVersionId },
      });

      socket.join(prototypeVersionId);
      socket.emit('UPDATE_PARTS', parts);
      socket.emit('UPDATE_PLAYERS', players);
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
    }: {
      prototypeVersionId: string;
      part: PartModel;
    }) => {
      const maxOrder = await PartModel.max('order', {
        where: { prototypeVersionId },
      });

      await PartModel.create({
        ...part,
        prototypeVersionId,
        order: (maxOrder as number) + 0.1,
      });
      const parts = await PartModel.findAll({
        where: { prototypeVersionId },
      });

      io.to(prototypeVersionId).emit('UPDATE_PARTS', parts);
    }
  );
}

/**
 * カードを反転させる
 * @param socket - Socket
 * @param io - Server
 */
function handleFlipCard(socket: Socket, io: Server) {
  socket.on(
    'FLIP_CARD',
    async ({
      prototypeId,
      cardId,
      isNextFlipped,
    }: {
      prototypeId: number;
      cardId: number;
      isNextFlipped: boolean;
    }) => {
      await PartModel.update(
        { isFlipped: isNextFlipped },
        { where: { id: cardId } }
      );

      io.to(prototypeId.toString()).emit('FLIP_CARD', {
        cardId,
        isNextFlipped,
      });
    }
  );
}

/**
 * パーツ移動
 * @param socket - Socket
 * @param io - Server
 */
function handleMovePart(socket: Socket, io: Server) {
  socket.on(
    'MOVE_PART',
    async ({
      prototypeId,
      id,
      position,
    }: {
      prototypeId: number;
      id: number;
      position: { x: number; y: number };
    }) => {
      await PartModel.update({ position }, { where: { id, prototypeId } });
      const parts = await PartModel.findAll({ where: { prototypeId } });

      io.to(prototypeId.toString()).emit('UPDATE_PARTS', parts);
    }
  );
}

/**
 * カードの親を更新
 * @param socket - Socket
 * @param io - Server
 */
function handleUpdateCardParent(socket: Socket, io: Server) {
  socket.on(
    'UPDATE_CARD_PARENT',
    async ({
      prototypeId,
      cardId,
      nextParentId,
    }: {
      prototypeId: number;
      cardId: number;
      nextParentId?: number | null;
    }) => {
      await PartModel.update(
        { parentId: nextParentId || null },
        { where: { id: cardId, prototypeId } }
      );
      const parts = await PartModel.findAll({ where: { prototypeId } });

      io.to(prototypeId.toString()).emit('UPDATE_PARTS', parts);
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
      prototypeId,
      deckId,
    }: {
      prototypeId: number;
      deckId: number;
    }) => {
      const cardsOnDeck = await PartModel.findAll({
        where: { prototypeId, type: PART_TYPE.CARD, parentId: deckId },
      });
      // await shuffleDeck(cardsOnDeck);
      const parts = await PartModel.findAll({ where: { prototypeId } });

      io.to(prototypeId.toString()).emit('UPDATE_PARTS', parts);
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
      prototypeId,
      updatedPart,
    }: {
      prototypeId: number;
      updatedPart: PartModel;
    }) => {
      await PartModel.update(updatedPart, {
        where: { id: updatedPart.id, prototypeId },
      });
      const parts = await PartModel.findAll({ where: { prototypeId } });

      io.to(prototypeId.toString()).emit('UPDATE_PARTS', parts);
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
      prototypeId,
      playerId,
      userId,
    }: {
      prototypeId: number;
      playerId: number;
      userId: number | null;
    }) => {
      await PlayerModel.update({ userId }, { where: { id: playerId } });
      const players = await PlayerModel.findAll({
        where: { prototypeId },
      });

      io.to(prototypeId.toString()).emit('UPDATE_PLAYERS', players);
    }
  );
}

export default function handlePrototype(socket: Socket, io: Server) {
  handleJoinPrototype(socket);
  handleAddPart(socket, io);
  handleFlipCard(socket, io);
  handleMovePart(socket, io);
  handleUpdateCardParent(socket, io);
  handleShuffleDeck(socket, io);
  handleUpdatePart(socket, io);
  handleUpdatePlayerUser(socket, io);
}
