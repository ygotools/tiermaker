import { Deck, Tier } from '../types';

type TierListState = {
  tiers: Tier[];
  availableDecks: Deck[];
}

const clampIndex = (index: number, length: number) => Math.max(0, Math.min(index, length));
const findDeckIndexById = (decks: Deck[], deckId: string) => decks.findIndex((candidate) => candidate.id === deckId);
const removeDeckAt = (decks: Deck[], index: number) => decks.filter((_, deckIndex) => deckIndex !== index);

const insertDeckAt = (decks: Deck[], deck: Deck, index: number) => {
  const nextDecks = [...decks];
  nextDecks.splice(clampIndex(index, decks.length), 0, deck);
  return nextDecks;
};

export const moveDeckState = (
  tiers: Tier[],
  dragIndex: number,
  hoverIndex: number,
  dragTierIndex: number,
  hoverTierIndex: number,
) => {
  if (
    dragTierIndex < 0 ||
    dragTierIndex >= tiers.length ||
    hoverTierIndex < 0 ||
    hoverTierIndex >= tiers.length
  ) {
    return tiers;
  }

  const dragTier = tiers[dragTierIndex];
  const hoverTier = tiers[hoverTierIndex];

  if (
    dragIndex < 0 ||
    dragIndex >= dragTier.decks.length ||
    (dragTierIndex === hoverTierIndex && dragIndex === hoverIndex)
  ) {
    return tiers;
  }

  const movedDeck = dragTier.decks[dragIndex];

  if (!movedDeck) {
    return tiers;
  }

  if (dragTierIndex === hoverTierIndex) {
    const nextDecks = [...dragTier.decks];
    nextDecks.splice(dragIndex, 1);
    nextDecks.splice(clampIndex(hoverIndex, nextDecks.length), 0, movedDeck);

    return tiers.map((tier, index) => (
      index === dragTierIndex
        ? { ...tier, decks: nextDecks }
        : tier
    ));
  }

  const nextDragDecks = removeDeckAt(dragTier.decks, dragIndex);
  const nextHoverDecks = insertDeckAt(hoverTier.decks, movedDeck, hoverIndex);

  return tiers.map((tier, index) => {
    if (index === dragTierIndex) {
      return { ...tier, decks: nextDragDecks };
    }

    if (index === hoverTierIndex) {
      return { ...tier, decks: nextHoverDecks };
    }

    return tier;
  });
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

  const availableDeckIndex = findDeckIndexById(availableDecks, deck.id);

  if (availableDeckIndex === -1) {
    return { tiers, availableDecks };
  }

  const nextAvailableDecks = removeDeckAt(availableDecks, availableDeckIndex);
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
  const sourceDeckIndex = findDeckIndexById(sourceTier.decks, deck.id);

  if (sourceDeckIndex === -1) {
    return { tiers, availableDecks };
  }

  return {
    tiers: tiers.map((tier, index) => (
      index === sourceTierIndex
        ? { ...tier, decks: removeDeckAt(tier.decks, sourceDeckIndex) }
        : tier
    )),
    availableDecks: insertDeckAt(availableDecks, deck, hoverIndex),
  };
};
