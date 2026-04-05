import { beforeEach, describe, expect, it } from 'vitest';
import {
  createTierListShareUrl,
  createTierListShareText,
  createDefaultTierListSnapshot,
  loadTierListSnapshot,
  saveTierListSnapshot,
} from './tierListStorage';

describe('tierListStorage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('restores tiers from query params with higher priority than session storage', () => {
    const storedSnapshot = createDefaultTierListSnapshot();

    saveTierListSnapshot(storedSnapshot);
    window.history.replaceState({}, '', '/?tier1=blue-eyes&tier2=ryzeal&tier3=vsk9&tier4=malice');

    const restored = loadTierListSnapshot();

    expect(restored.tiers[0].decks.map((deck) => deck.name)).toEqual(['青眼']);
    expect(restored.tiers[1].decks.map((deck) => deck.name)).toEqual(['ライゼオル']);
    expect(restored.tiers[2].decks.map((deck) => deck.name)).toEqual(['VSK9']);
    expect(restored.tiers[3].decks.map((deck) => deck.name)).toEqual(['M∀LICE']);
  });

  it('ignores invalid deck ids in query params', () => {
    const defaultSnapshot = createDefaultTierListSnapshot();

    window.history.replaceState({}, '', '/?tier1=not-found,blue-eyes,blue-eyes&tier2=unknown');

    const restored = loadTierListSnapshot();

    expect(restored.tiers[0].decks.map((deck) => deck.name)).toEqual(['青眼']);
    expect(restored.tiers[1].decks).toEqual([]);
    expect(restored.availableDecks).toHaveLength(defaultSnapshot.availableDecks.length + defaultSnapshot.tiers.flatMap((tier) => tier.decks).length - 1);
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
        { name: 'Tier1', decks: [{ id: 'blue-eyes', name: 'Blue-Eyes', image: '/blue-eyes.png' }] },
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

  it('creates a share url from the current tier assignments', () => {
    const shareUrl = createTierListShareUrl([
      { name: 'Tier1', decks: [{ id: 'blue-eyes', name: 'Blue-Eyes', image: '/blue-eyes.png' }] },
      { name: 'Tier2', decks: [{ id: 'ryzeal', name: 'Ryzeal', image: '/ryzeal.png' }] },
      { name: 'Tier3', decks: [] },
      { name: 'Tier4', decks: [{ id: 'malice', name: 'M∀LICE', image: '/malice.png' }] },
    ]);

    expect(shareUrl).toBe('http://localhost:3000/?tier1=blue-eyes&tier2=ryzeal&tier4=malice');
  });

  it('creates share text from current tier assignments', () => {
    const shareText = createTierListShareText([
      { name: 'Tier1', decks: [{ id: 'killer-tune', name: 'キラーチューン', image: '/killer-tune.png' }, { id: 'yummy', name: 'ヤミー', image: '/yummy.png' }] },
      { name: 'Tier2', decks: [{ id: 'ryzeal', name: 'ライゼオル', image: '/ryzeal.png' }] },
      { name: 'Tier3', decks: [] },
      { name: 'Tier4', decks: [{ id: 'malice', name: 'M∀LICE', image: '/malice.png' }] },
    ]);

    expect(shareText).toBe('Tier1 キラーチューン ヤミー\nTier2 ライゼオル\nTier3\nTier4 M∀LICE');
  });

  it('creates localized share text when a deck name getter is provided', () => {
    const shareText = createTierListShareText([
      { name: 'Tier1', decks: [{ id: 'moonlight', name: '月光', nameEn: 'Lunalight', image: '/moonlight.png' }] },
      { name: 'Tier2', decks: [{ id: 'r-ace', name: 'R-ACE', nameEn: 'Rescue-ACE', image: '/r-ace.png' }] },
      { name: 'Tier3', decks: [] },
      { name: 'Tier4', decks: [{ id: 'malice', name: 'M∀LICE', nameEn: 'Maliss', image: '/malice.png' }] },
    ], (deck) => deck.nameEn ?? deck.name);

    expect(shareText).toBe('Tier1 Lunalight\nTier2 Rescue-ACE\nTier3\nTier4 Maliss');
  });
});
