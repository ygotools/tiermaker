import { describe, expect, it } from 'vitest';
import { Deck, Tier } from '../types';
import { moveDeckToAvailableDecksState } from './tierListState';

const sampleDeck: Deck = { name: 'Blue-Eyes', image: '/blue-eyes.png' };
const otherDeck: Deck = { name: 'Dark Magician', image: '/dark-magician.png' };

const sampleTiers: Tier[] = [
  { name: 'Tier1', decks: [sampleDeck] },
  { name: 'Tier2', decks: [otherDeck] },
];

describe('moveDeckToAvailableDecksState', () => {
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
});
