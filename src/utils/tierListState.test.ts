import { describe, expect, it } from 'vitest';
import { Deck, Tier } from '../types';
import {
  moveDeckState,
  moveAvailableDeckState,
  moveDeckFromAvailableDecksState,
  moveDeckToAvailableDecksState,
} from './tierListState';

const sampleDeck: Deck = { id: 'blue-eyes', name: 'Blue-Eyes', image: '/blue-eyes.png' };
const otherDeck: Deck = { id: 'dark-magician', name: 'Dark Magician', image: '/dark-magician.png' };
const thirdDeck: Deck = { id: 'red-eyes', name: 'Red-Eyes', image: '/red-eyes.png' };

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

  it('moves a deck between tiers without mutating the original tier data', () => {
    const tiers: Tier[] = [
      { name: 'Tier1', decks: [sampleDeck, otherDeck] },
      { name: 'Tier2', decks: [thirdDeck] },
    ];

    const result = moveDeckState(tiers, 0, 1, 0, 1);

    expect(result[0].decks).toEqual([otherDeck]);
    expect(result[1].decks).toEqual([thirdDeck, sampleDeck]);
    expect(tiers[0].decks).toEqual([sampleDeck, otherDeck]);
  });

  it('moves only the matching deck id when names are duplicated', () => {
    const duplicateNameDeck: Deck = { id: 'blue-eyes-alt', name: 'Blue-Eyes', image: '/blue-eyes-alt.png' };
    const tiers: Tier[] = [
      { name: 'Tier1', decks: [sampleDeck, duplicateNameDeck] },
      { name: 'Tier2', decks: [] },
    ];

    const result = moveDeckToAvailableDecksState(tiers, [], sampleDeck, 0);

    expect(result.tiers[0].decks).toEqual([duplicateNameDeck]);
    expect(result.availableDecks).toEqual([sampleDeck]);
  });
});
