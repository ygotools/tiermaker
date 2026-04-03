import { describe, expect, it } from 'vitest';
import { Deck, Tier } from '../types';
import {
  moveAvailableDeckState,
  moveDeckFromAvailableDecksState,
  moveDeckToAvailableDecksState,
} from './tierListState';

const sampleDeck: Deck = { name: 'Blue-Eyes', image: '/blue-eyes.png' };
const otherDeck: Deck = { name: 'Dark Magician', image: '/dark-magician.png' };
const thirdDeck: Deck = { name: 'Red-Eyes', image: '/red-eyes.png' };

const sampleTiers: Tier[] = [
  { name: 'Tier1', decks: [sampleDeck] },
  { name: 'Tier2', decks: [otherDeck] },
];

describe('tierListState', () => {
  it('ignores negative source tier indexes', () => {
    const availableDecks = [otherDeck];

    const result = moveDeckToAvailableDecksState(sampleTiers, availableDecks, sampleDeck, -1);

    expect(result.tiers).toBe(sampleTiers);
    expect(result.availableDecks).toBe(availableDecks);
  });

  it('moves a deck from a tier back to the available deck list', () => {
    const availableDecks = [otherDeck];

    const result = moveDeckToAvailableDecksState(sampleTiers, availableDecks, sampleDeck, 0);

    expect(result.tiers[0].decks).toEqual([]);
    expect(result.tiers[1].decks).toEqual([otherDeck]);
    expect(result.availableDecks).toEqual([sampleDeck, otherDeck]);
  });

  it('inserts an available deck at the hovered tier position', () => {
    const availableDecks = [thirdDeck];

    const result = moveDeckFromAvailableDecksState(sampleTiers, availableDecks, thirdDeck, 1, 0);

    expect(result.tiers[1].decks).toEqual([thirdDeck, otherDeck]);
    expect(result.availableDecks).toEqual([]);
  });

  it('reorders available decks by hovered index', () => {
    const availableDecks = [sampleDeck, otherDeck, thirdDeck];

    const result = moveAvailableDeckState(availableDecks, 2, 0);

    expect(result).toEqual([thirdDeck, sampleDeck, otherDeck]);
  });
});
