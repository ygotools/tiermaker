import { beforeEach, describe, expect, it } from 'vitest';
import {
  createDefaultTierListSnapshot,
  loadTierListSnapshot,
  saveTierListSnapshot,
} from './tierListStorage';

describe('tierListStorage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('returns the default snapshot when storage is empty', () => {
    expect(loadTierListSnapshot()).toEqual(createDefaultTierListSnapshot());
  });

  it('falls back to the default snapshot when storage is invalid', () => {
    window.sessionStorage.setItem('tiermaker:tier-list', '{broken json');

    expect(loadTierListSnapshot()).toEqual(createDefaultTierListSnapshot());
  });

  it('round-trips a saved snapshot', () => {
    const snapshot = createDefaultTierListSnapshot();

    saveTierListSnapshot(snapshot);

    expect(loadTierListSnapshot()).toEqual(snapshot);
  });

  it('keeps stored snapshots even when deck count differs from master data', () => {
    const snapshot = {
      tiers: [
        { name: 'Tier1', decks: [{ name: 'Blue-Eyes', image: '/blue-eyes.png' }] },
      ],
      availableDecks: [],
    };

    window.sessionStorage.setItem('tiermaker:tier-list', JSON.stringify(snapshot));

    expect(loadTierListSnapshot()).toEqual(snapshot);
  });

  it('falls back when the stored shape does not match the snapshot schema', () => {
    window.sessionStorage.setItem('tiermaker:tier-list', JSON.stringify({
      tiers: [{ name: 'Tier1', decks: [{ name: 'Blue-Eyes' }] }],
      availableDecks: [],
    }));

    expect(loadTierListSnapshot()).toEqual(createDefaultTierListSnapshot());
  });
});
