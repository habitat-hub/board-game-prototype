import PartModel from '../models/Part';

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
