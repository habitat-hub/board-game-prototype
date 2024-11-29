import { Card } from '../type';

export function shuffleDeck(cards: Card[]) {
  const originalOrders = cards.map((card) => card.order);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  cards.forEach((card, index) => {
    card.order = originalOrders[index];
  });
}
