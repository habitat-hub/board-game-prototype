import PartModel from '../models/Part';
import PlayerModel from '../models/Player';
import PrototypeModel from '../models/Prototype';

export async function shuffleDeck(cards: PartModel[]) {
  const originalOrders = cards.map((card) => card.order);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  await Promise.all(
    cards.map(async (card, index) => {
      await PartModel.update(
        { order: originalOrders[index] },
        { where: { id: card.id } }
      );
    })
  );
}

export async function clonePlayersAndParts(
  editPrototypePlayers: PlayerModel[],
  editPrototypeParts: PartModel[],
  prototype: PrototypeModel
) {
  // パーツとプレイヤーをコピー
  const clonedPlayers = await Promise.all(
    editPrototypePlayers.map((player) =>
      player.clone({
        newPrototypeId: prototype.id,
        originalPlayerId: player.id,
      })
    )
  );
  const clonedParts = await Promise.all(
    editPrototypeParts.map((part) => {
      const newOwnerPlayerId = clonedPlayers.find(
        (player) => player.originalPlayerId === part.ownerId
      )?.id;

      return part.clone({
        newPrototypeId: prototype.id,
        parentId: null,
        ownerId: newOwnerPlayerId ?? null,
        originalPartId: part.id,
      });
    })
  );
  // 親IDを更新
  await Promise.all(
    // NOTE: コピー元→コピー元の親→新しい親という順に探す
    clonedParts.map((part) => {
      const originalPart = editPrototypeParts.find(
        (p) => p.id === part.originalPartId
      );
      const newParentPart = clonedParts.find(
        (p) => p.originalPartId === originalPart?.parentId
      );

      PartModel.update(
        { parentId: newParentPart?.id ?? null },
        { where: { id: part.id } }
      );
    })
  );
}
