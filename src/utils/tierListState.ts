import { Deck, Tier } from '../types';

type TierListState = {
  tiers: Tier[];
  availableDecks: Deck[];
}

const clampIndex = (index: number, length: number) => Math.max(0, Math.min(index, length));

const insertDeckAt = (decks: Deck[], deck: Deck, index: number) => {
  const nextDecks = [...decks];
  nextDecks.splice(clampIndex(index, decks.length), 0, deck);
  return nextDecks;
};

export const moveAvailableDeckState = (
  availableDecks: Deck[],
  dragIndex: number,
  hoverIndex: number,
) => {
  if (
    dragIndex < 0 ||
    hoverIndex < 0 ||
    dragIndex >= availableDecks.length ||
    hoverIndex >= availableDecks.length ||
    dragIndex === hoverIndex
  ) {
    return availableDecks;
  }

  const nextAvailableDecks = [...availableDecks];
  const [movedDeck] = nextAvailableDecks.splice(dragIndex, 1);
  nextAvailableDecks.splice(hoverIndex, 0, movedDeck);
  return nextAvailableDecks;
};

export const moveDeckFromAvailableDecksState = (
  tiers: Tier[],
  availableDecks: Deck[],
  deck: Deck,
  hoverTierIndex: number,
  hoverIndex?: number,
): TierListState => {
  if (hoverTierIndex < 0 || hoverTierIndex >= tiers.length) {
    return { tiers, availableDecks };
  }

  const availableDeckIndex = availableDecks.findIndex((candidate) => candidate.name === deck.name);

  if (availableDeckIndex === -1) {
    return { tiers, availableDecks };
  }

  const nextAvailableDecks = availableDecks.filter((candidate) => candidate.name !== deck.name);
  const nextTiers = tiers.map((tier, index) => (
    index === hoverTierIndex
      ? {
          ...tier,
          decks: insertDeckAt(tier.decks, deck, hoverIndex ?? tier.decks.length),
        }
      : tier
  ));

  return {
    tiers: nextTiers,
    availableDecks: nextAvailableDecks,
  };
};

export const moveDeckToAvailableDecksState = (
  tiers: Tier[],
  availableDecks: Deck[],
  deck: Deck,
  sourceTierIndex: number,
  hoverIndex = 0,
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
    availableDecks: insertDeckAt(availableDecks, deck, hoverIndex),
  };
};
