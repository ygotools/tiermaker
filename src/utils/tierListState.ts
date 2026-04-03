import { Deck, Tier } from '../types';

type TierListState = {
  tiers: Tier[];
  availableDecks: Deck[];
}

export const moveDeckToAvailableDecksState = (
  tiers: Tier[],
  availableDecks: Deck[],
  deck: Deck,
  sourceTierIndex: number,
): TierListState => {
  if (sourceTierIndex < 0 || sourceTierIndex >= tiers.length) {
    return { tiers, availableDecks };
  }

  const sourceTier = tiers[sourceTierIndex];
  const hasDeck = sourceTier.decks.some((candidate) => candidate.name === deck.name);

  if (!hasDeck) {
    return { tiers, availableDecks };
  }

  return {
    tiers: tiers.map((tier, index) => (
      index === sourceTierIndex
        ? { ...tier, decks: tier.decks.filter((candidate) => candidate.name !== deck.name) }
        : tier
    )),
    availableDecks: [deck, ...availableDecks],
  };
};
