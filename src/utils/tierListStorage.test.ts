import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearTierListShareQuery,
  createXShareText,
  createTierListShareUrl,
  createTierListShareText,
  createDefaultTierListSnapshot,
  hasTierListShareQuery,
  loadTierListSnapshot,
  normalizeCustomDeckImage,
  saveTierListSnapshot,
} from './tierListStorage';

describe('tierListStorage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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

  it('does not fall back to stale session storage when tier query params restore no decks', () => {
    const defaultSnapshot = createDefaultTierListSnapshot();
    const storedSnapshot = {
      tiers: [
        { name: 'Stored', decks: [{ id: 'stored-custom', name: 'Stored Custom', image: '/stored-custom.png' }] },
      ],
      availableDecks: [],
    };

    window.sessionStorage.setItem('tiermaker:tier-list', JSON.stringify(storedSnapshot));
    window.history.replaceState({}, '', '/?tier1=not-found');

    const restored = loadTierListSnapshot();

    expect(restored.tiers.map((tier) => tier.decks)).toEqual(defaultSnapshot.tiers.map(() => []));
    expect(restored.tiers.flatMap((tier) => tier.decks.map((deck) => deck.id))).not.toContain('stored-custom');
    expect(restored.availableDecks).toHaveLength(defaultSnapshot.availableDecks.length + defaultSnapshot.tiers.flatMap((tier) => tier.decks).length);
  });

  it('keeps session storage when only custom deck query params are present', () => {
    const storedSnapshot = {
      tiers: [
        { name: 'Stored', decks: [{ id: 'stored-custom', name: 'Stored Custom', image: '/stored-custom.png' }] },
      ],
      availableDecks: [],
    };
    const params = new URLSearchParams({
      customDecks: JSON.stringify([
        { id: 'custom-theme', name: 'Custom Theme', imageUrl: 'https://example.com/custom-theme.png' },
      ]),
    });

    window.sessionStorage.setItem('tiermaker:tier-list', JSON.stringify(storedSnapshot));
    window.history.replaceState({}, '', `/?${params.toString()}`);

    const restored = loadTierListSnapshot();

    expect(restored).toEqual(storedSnapshot);
    expect(hasTierListShareQuery()).toBe(false);
  });

  it('marks tier query params as share queries so the initial save can be skipped', () => {
    const defaultSnapshot = createDefaultTierListSnapshot();
    const storedSnapshot = {
      tiers: [
        { name: 'Stored', decks: [{ id: 'stored-custom', name: 'Stored Custom', image: '/stored-custom.png' }] },
      ],
      availableDecks: [],
    };

    window.sessionStorage.setItem('tiermaker:tier-list', JSON.stringify(storedSnapshot));
    window.history.replaceState({}, '', '/?tier1=unknown');

    const restored = loadTierListSnapshot();

    if (!hasTierListShareQuery()) {
      saveTierListSnapshot(restored);
    }

    expect(restored.tiers.map((tier) => tier.decks)).toEqual(defaultSnapshot.tiers.map(() => []));
    expect(restored.tiers.flatMap((tier) => tier.decks.map((deck) => deck.id))).not.toContain('stored-custom');
    expect(JSON.parse(window.sessionStorage.getItem('tiermaker:tier-list') ?? '')).toEqual(storedSnapshot);
  });

  it('does not throw from share query detection when query parsing fails', () => {
    const originalURLSearchParams = globalThis.URLSearchParams;

    globalThis.URLSearchParams = class {
      constructor() {
        throw new Error('query parsing failed');
      }
    } as typeof URLSearchParams;

    try {
      expect(hasTierListShareQuery('?tier1=blue-eyes')).toBe(false);
    } finally {
      globalThis.URLSearchParams = originalURLSearchParams;
    }
  });

  it('clears consumed tier share query params while preserving unrelated URL state', () => {
    const params = new URLSearchParams({
      source: 'test',
      tier1: 'blue-eyes',
      tier2: 'ryzeal',
      customDecks: JSON.stringify([
        { id: 'custom-theme', name: 'Custom Theme', imageUrl: 'https://example.com/custom-theme.png' },
      ]),
    });

    window.history.replaceState({ from: 'test' }, '', `/?${params.toString()}#deck-list`);

    clearTierListShareQuery();

    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('?source=test');
    expect(window.location.hash).toBe('#deck-list');
    expect(window.history.state).toEqual({ from: 'test' });
    expect(hasTierListShareQuery()).toBe(false);
  });

  it('keeps custom deck metadata query params when no tier share params are present', () => {
    const params = new URLSearchParams({
      customDecks: JSON.stringify([
        { id: 'custom-theme', name: 'Custom Theme', imageUrl: 'https://example.com/custom-theme.png' },
      ]),
    });

    window.history.replaceState({}, '', `/?${params.toString()}`);

    clearTierListShareQuery();

    expect(window.location.search).toBe(`?${params.toString()}`);
  });

  it('restores custom themes from query params', () => {
    const defaultSnapshot = createDefaultTierListSnapshot();
    const params = new URLSearchParams({
      tier1: 'blue-eyes,custom-theme',
      tier2: 'custom-theme,ryzeal',
      customDecks: JSON.stringify([
        { id: 'custom-theme', name: 'Custom Theme', imageUrl: 'https://example.com/custom-theme.png' },
      ]),
    });

    window.history.replaceState({}, '', `/?${params.toString()}`);

    const restored = loadTierListSnapshot();

    expect(restored.tiers[0].decks).toEqual([
      expect.objectContaining({ id: 'blue-eyes', name: '青眼' }),
      { id: 'custom-theme', name: 'Custom Theme', image: 'https://example.com/custom-theme.png' },
    ]);
    expect(restored.tiers[1].decks).toEqual([
      expect.objectContaining({ id: 'ryzeal', name: 'ライゼオル' }),
    ]);
    expect(restored.availableDecks).toHaveLength(defaultSnapshot.availableDecks.length + defaultSnapshot.tiers.flatMap((tier) => tier.decks).length - 2);
  });

  it('restores a single custom theme object from query params', () => {
    const params = new URLSearchParams({
      tier1: 'custom-theme',
      customDecks: JSON.stringify({ id: 'custom-theme', name: 'Custom Theme', imageUrl: 'https://example.com/custom-theme.png' }),
    });

    window.history.replaceState({}, '', `/?${params.toString()}`);

    expect(loadTierListSnapshot().tiers[0].decks).toEqual([
      { id: 'custom-theme', name: 'Custom Theme', image: 'https://example.com/custom-theme.png' },
    ]);
  });

  it('restores custom themes from repeated custom deck query params', () => {
    const params = new URLSearchParams({
      tier1: 'custom-theme-a,custom-theme-b',
    });

    params.append('customDecks', JSON.stringify([
      { id: 'custom-theme-a', name: 'Custom Theme A', imageUrl: 'https://example.com/custom-theme-a.png' },
    ]));
    params.append('customDecks', JSON.stringify([
      { id: 'custom-theme-b', name: 'Custom Theme B', imageUrl: 'https://example.com/custom-theme-b.png' },
    ]));

    window.history.replaceState({}, '', `/?${params.toString()}`);

    expect(loadTierListSnapshot().tiers[0].decks).toEqual([
      { id: 'custom-theme-a', name: 'Custom Theme A', image: 'https://example.com/custom-theme-a.png' },
      { id: 'custom-theme-b', name: 'Custom Theme B', image: 'https://example.com/custom-theme-b.png' },
    ]);
  });

  it('normalizes custom theme query ids and names and defaults blank images', () => {
    const params = new URLSearchParams({
      tier1: 'custom-theme',
      customDecks: JSON.stringify([
        { id: ' custom-theme ', name: ' Custom Theme ', imageUrl: '   ' },
      ]),
    });

    window.history.replaceState({}, '', `/?${params.toString()}`);

    expect(loadTierListSnapshot().tiers[0].decks).toEqual([
      { id: 'custom-theme', name: 'Custom Theme', image: '/static/deckimages/others_01.png' },
    ]);
  });

  it('ignores custom themes with empty or extremely long ids and names', () => {
    const longText = 'x'.repeat(500);
    const params = new URLSearchParams({
      tier1: `empty-id,empty-name,long-id,long-name,${longText}`,
      customDecks: JSON.stringify([
        { id: '   ', name: 'Empty ID', imageUrl: 'https://example.com/empty-id.png' },
        { id: 'empty-name', name: '   ', imageUrl: 'https://example.com/empty-name.png' },
        { id: longText, name: 'Long ID', imageUrl: 'https://example.com/long-id.png' },
        { id: 'long-name', name: longText, imageUrl: 'https://example.com/long-name.png' },
      ]),
    });

    window.history.replaceState({}, '', `/?${params.toString()}`);

    expect(loadTierListSnapshot().tiers[0].decks).toEqual([]);
  });

  it('allows custom theme query ids and names at their maximum lengths', () => {
    const maxLengthId = 'i'.repeat(128);
    const maxLengthName = 'n'.repeat(120);
    const params = new URLSearchParams({
      tier1: maxLengthId,
      customDecks: JSON.stringify([
        { id: maxLengthId, name: maxLengthName, imageUrl: 'https://example.com/custom-theme.png' },
      ]),
    });

    window.history.replaceState({}, '', `/?${params.toString()}`);

    expect(loadTierListSnapshot().tiers[0].decks).toEqual([
      { id: maxLengthId, name: maxLengthName, image: 'https://example.com/custom-theme.png' },
    ]);
  });

  it('ignores custom themes with control characters in query ids', () => {
    const unsafeId = 'custom\ntheme';
    const params = new URLSearchParams({
      tier1: unsafeId,
      customDecks: JSON.stringify([
        { id: unsafeId, name: 'Custom Theme', imageUrl: 'https://example.com/custom-theme.png' },
      ]),
    });

    window.history.replaceState({}, '', `/?${params.toString()}`);

    expect(loadTierListSnapshot().tiers[0].decks).toEqual([]);
  });

  it('defaults dangerous custom theme image urls', () => {
    const params = new URLSearchParams({
      tier1: 'custom-theme',
      customDecks: JSON.stringify([
        { id: 'custom-theme', name: 'Custom Theme', imageUrl: 'javascript:alert(1)' },
      ]),
    });

    window.history.replaceState({}, '', `/?${params.toString()}`);

    expect(loadTierListSnapshot().tiers[0].decks).toEqual([
      { id: 'custom-theme', name: 'Custom Theme', image: '/static/deckimages/others_01.png' },
    ]);
  });

  it('defaults relative custom theme image urls in query params', () => {
    const params = new URLSearchParams({
      tier1: 'custom-theme',
      customDecks: JSON.stringify([
        { id: 'custom-theme', name: 'Custom Theme', imageUrl: '/custom-theme.png' },
      ]),
    });

    window.history.replaceState({}, '', `/?${params.toString()}`);

    expect(loadTierListSnapshot().tiers[0].decks).toEqual([
      { id: 'custom-theme', name: 'Custom Theme', image: '/static/deckimages/others_01.png' },
    ]);
  });

  it('keeps absolute http and https custom theme image urls without window', () => {
    vi.stubGlobal('window', undefined);

    expect(normalizeCustomDeckImage('http://example.com/custom-theme.png')).toBe('http://example.com/custom-theme.png');
    expect(normalizeCustomDeckImage('https://example.com/custom-theme.png')).toBe('https://example.com/custom-theme.png');
  });

  it('falls back for relative custom theme image paths without window', () => {
    vi.stubGlobal('window', undefined);

    expect(normalizeCustomDeckImage('/custom-theme.png')).toBe('/static/deckimages/others_01.png');
  });

  it('defaults dangerous custom theme image urls without window', () => {
    vi.stubGlobal('window', undefined);

    expect(normalizeCustomDeckImage('javascript:alert(1)')).toBe('/static/deckimages/others_01.png');
  });

  it('round-trips custom themes through share urls', () => {
    const shareUrl = createTierListShareUrl([
      { name: 'Tier1', decks: [
        { id: 'blue-eyes', name: 'Blue-Eyes', image: '/blue-eyes.png' },
        { id: 'custom-theme', name: 'Custom Theme', image: 'https://example.com/custom-theme.png' },
      ] },
      { name: 'Tier2', decks: [] },
      { name: 'Tier3', decks: [] },
      { name: 'Tier4', decks: [] },
    ]);

    window.history.replaceState({}, '', new URL(shareUrl).pathname + new URL(shareUrl).search);

    const restored = loadTierListSnapshot();

    expect(restored.tiers[0].decks).toEqual([
      expect.objectContaining({ id: 'blue-eyes', name: '青眼' }),
      { id: 'custom-theme', name: 'Custom Theme', image: 'https://example.com/custom-theme.png' },
    ]);
  });

  it('omits data url custom images from share urls and restores the default image', () => {
    const shareUrl = createTierListShareUrl([
      { name: 'Tier1', decks: [
        { id: 'custom-theme', name: 'Custom Theme', image: 'data:image/png;base64,abc123' },
      ] },
      { name: 'Tier2', decks: [] },
      { name: 'Tier3', decks: [] },
      { name: 'Tier4', decks: [] },
    ]);
    const params = new URL(shareUrl).searchParams;

    expect(params.toString()).not.toContain('data%3A');
    expect(JSON.parse(params.get('customDecks') ?? '')).toEqual([
      { id: 'custom-theme', name: 'Custom Theme' },
    ]);

    window.history.replaceState({}, '', new URL(shareUrl).pathname + new URL(shareUrl).search);

    expect(loadTierListSnapshot().tiers[0].decks).toEqual([
      { id: 'custom-theme', name: 'Custom Theme', image: '/static/deckimages/others_01.png' },
    ]);
  });

  it('keeps restorable known decks when custom theme query data is broken', () => {
    const storedSnapshot = {
      tiers: [
        { name: 'Stored', decks: [{ id: 'stored-custom', name: 'Stored Custom', image: '/stored-custom.png' }] },
      ],
      availableDecks: [],
    };

    window.sessionStorage.setItem('tiermaker:tier-list', JSON.stringify(storedSnapshot));
    window.history.replaceState({}, '', '/?tier1=blue-eyes,custom-theme&customDecks=%7Bbroken');

    const restored = loadTierListSnapshot();

    expect(restored.tiers[0].decks).toEqual([
      expect.objectContaining({ id: 'blue-eyes', name: '青眼' }),
    ]);
    expect(restored.tiers[0].decks).not.toEqual(storedSnapshot.tiers[0].decks);
  });

  it('prefers master decks when custom deck ids collide with master ids', () => {
    const params = new URLSearchParams({
      tier1: 'blue-eyes',
      customDecks: JSON.stringify([
        { id: 'blue-eyes', name: 'Fake Blue-Eyes', imageUrl: 'https://example.com/fake.png' },
      ]),
    });

    window.history.replaceState({}, '', `/?${params.toString()}`);

    expect(loadTierListSnapshot().tiers[0].decks).toEqual([
      expect.objectContaining({
        id: 'blue-eyes',
        name: '青眼',
        image: '/static/deckimages/blue-eyes.png',
      }),
    ]);
  });

  it('restores repeated tier query params in order while suppressing duplicate decks', () => {
    const defaultSnapshot = createDefaultTierListSnapshot();

    window.history.replaceState({}, '', '/?tier1=blue-eyes&tier1=ryzeal,blue-eyes&tier2=ryzeal&tier2=malice');

    const restored = loadTierListSnapshot();

    expect(restored.tiers[0].decks.map((deck) => deck.name)).toEqual(['青眼', 'ライゼオル']);
    expect(restored.tiers[1].decks.map((deck) => deck.name)).toEqual(['M∀LICE']);
    expect(restored.availableDecks).toHaveLength(defaultSnapshot.availableDecks.length + defaultSnapshot.tiers.flatMap((tier) => tier.decks).length - 3);
  });

  it('falls back to session storage when query param restore fails', () => {
    const storedSnapshot = {
      tiers: [
        { name: 'Stored', decks: [{ id: 'custom-theme', name: 'Custom Theme', image: '/custom-theme.png' }] },
      ],
      availableDecks: [],
    };
    const originalURLSearchParams = globalThis.URLSearchParams;

    window.sessionStorage.setItem('tiermaker:tier-list', JSON.stringify(storedSnapshot));
    window.history.replaceState({}, '', '/?tier1=blue-eyes');
    globalThis.URLSearchParams = class {
      constructor() {
        throw new Error('query restore failed');
      }
    } as typeof URLSearchParams;

    try {
      expect(loadTierListSnapshot()).toEqual(storedSnapshot);
    } finally {
      globalThis.URLSearchParams = originalURLSearchParams;
    }
  });

  it('returns the default snapshot when storage is empty', () => {
    expect(loadTierListSnapshot()).toEqual(createDefaultTierListSnapshot());
  });

  it('falls back to the default snapshot when session storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('session storage unavailable');
    });

    expect(loadTierListSnapshot()).toEqual(createDefaultTierListSnapshot());
  });

  it('falls back to the default snapshot when storage is invalid', () => {
    window.sessionStorage.setItem('tiermaker:tier-list', '{broken json');

    expect(loadTierListSnapshot()).toEqual(createDefaultTierListSnapshot());
  });

  it('ignores session storage write failures', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('session storage full');
    });

    expect(() => saveTierListSnapshot(createDefaultTierListSnapshot())).not.toThrow();
  });

  it('round-trips a saved snapshot', () => {
    const snapshot = createDefaultTierListSnapshot();

    saveTierListSnapshot(snapshot);

    expect(loadTierListSnapshot()).toEqual(snapshot);
  });

  it('keeps stored snapshots even when deck count differs from master data', () => {
    const snapshot = {
      tiers: [
        { name: 'Tier1', decks: [{ id: 'custom-theme', name: 'Blue-Eyes', image: '/blue-eyes.png' }] },
      ],
      availableDecks: [],
    };

    window.sessionStorage.setItem('tiermaker:tier-list', JSON.stringify(snapshot));

    expect(loadTierListSnapshot()).toEqual(snapshot);
  });

  it('hydrates missing English names for known decks from master data', () => {
    const snapshot = {
      tiers: [
        { name: 'Tier1', decks: [{ id: 'blue-eyes', name: '青眼', image: '/blue-eyes.png' }] },
      ],
      availableDecks: [{ id: 'ryzeal', name: 'ライゼオル', image: '/ryzeal.png' }],
    };

    window.sessionStorage.setItem('tiermaker:tier-list', JSON.stringify(snapshot));

    const restored = loadTierListSnapshot();

    expect(restored.tiers[0].decks[0].nameEn).toBe('Blue-Eyes');
    expect(restored.availableDecks[0].nameEn).toBe('Ryzeal');
  });

  it('deduplicates stored deck ids across tiers and available decks', () => {
    const snapshot = {
      tiers: [
        {
          name: 'Tier1',
          decks: [
            { id: 'blue-eyes', name: '青眼', image: '/blue-eyes.png' },
            { id: 'ryzeal', name: 'ライゼオル', image: '/ryzeal.png' },
            { id: 'blue-eyes', name: 'Duplicate Blue-Eyes', image: '/duplicate-blue-eyes.png' },
          ],
        },
        {
          name: 'Tier2',
          decks: [
            { id: 'ryzeal', name: 'Duplicate Ryzeal', image: '/duplicate-ryzeal.png' },
            { id: 'custom-theme', name: 'Custom Theme', image: '/custom-theme.png' },
          ],
        },
      ],
      availableDecks: [
        { id: 'custom-theme', name: 'Duplicate Custom Theme', image: '/duplicate-custom-theme.png' },
        { id: 'malice', name: 'M∀LICE', image: '/malice.png' },
      ],
    };

    window.sessionStorage.setItem('tiermaker:tier-list', JSON.stringify(snapshot));

    const restored = loadTierListSnapshot();

    expect(restored.tiers[0].decks.map((deck) => deck.id)).toEqual(['blue-eyes', 'ryzeal']);
    expect(restored.tiers[1].decks.map((deck) => deck.id)).toEqual(['custom-theme']);
    expect(restored.availableDecks.map((deck) => deck.id)).toEqual(['malice']);
    expect(restored.tiers[0].decks[0].name).toBe('青眼');
    expect(restored.tiers[1].decks[0].name).toBe('Custom Theme');
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

  it('adds custom theme metadata to share urls', () => {
    const shareUrl = createTierListShareUrl([
      { name: 'Tier1', decks: [
        { id: 'blue-eyes', name: 'Blue-Eyes', image: '/blue-eyes.png' },
        { id: 'custom-theme', name: 'Custom Theme', image: 'https://example.com/custom-theme.png' },
      ] },
      { name: 'Tier2', decks: [{ id: 'custom-theme', name: 'Custom Theme', image: 'https://example.com/custom-theme.png' }] },
      { name: 'Tier3', decks: [] },
      { name: 'Tier4', decks: [] },
    ]);
    const params = new URL(shareUrl).searchParams;

    expect(params.get('tier1')).toBe('blue-eyes,custom-theme');
    expect(params.get('tier2')).toBe('custom-theme');
    expect(JSON.parse(params.get('customDecks') ?? '')).toEqual([
      { id: 'custom-theme', name: 'Custom Theme', imageUrl: 'https://example.com/custom-theme.png' },
    ]);
  });

  it('trims and filters custom theme metadata in share urls', () => {
    const longText = 'x'.repeat(500);
    const shareUrl = createTierListShareUrl([
      { name: 'Tier1', decks: [
        { id: ' custom-theme ', name: ' Custom Theme ', image: ' https://example.com/custom-theme.png ' },
        { id: '   ', name: 'Blank ID', image: 'https://example.com/blank-id.png' },
        { id: 'empty-name', name: '   ', image: 'https://example.com/empty-name.png' },
        { id: longText, name: 'Long ID', image: 'https://example.com/long-id.png' },
        { id: 'long-name', name: longText, image: 'https://example.com/long-name.png' },
      ] },
      { name: 'Tier2', decks: [] },
      { name: 'Tier3', decks: [] },
      { name: 'Tier4', decks: [] },
    ]);
    const params = new URL(shareUrl).searchParams;

    expect(params.get('tier1')).toBe('custom-theme');
    expect(params.toString()).not.toContain(longText);
    expect(JSON.parse(params.get('customDecks') ?? '')).toEqual([
      { id: 'custom-theme', name: 'Custom Theme', imageUrl: 'https://example.com/custom-theme.png' },
    ]);
  });

  it('omits custom themes with comma ids from tier and custom deck share queries', () => {
    const shareUrl = createTierListShareUrl([
      { name: 'Tier1', decks: [
        { id: 'blue-eyes', name: 'Blue-Eyes', image: '/blue-eyes.png' },
        { id: 'custom,theme', name: 'Custom Theme', image: 'https://example.com/custom-theme.png' },
      ] },
      { name: 'Tier2', decks: [] },
      { name: 'Tier3', decks: [] },
      { name: 'Tier4', decks: [] },
    ]);
    const params = new URL(shareUrl).searchParams;

    expect(params.get('tier1')).toBe('blue-eyes');
    expect(params.has('customDecks')).toBe(false);
    expect(params.toString()).not.toContain('custom%2Ctheme');
  });

  it('omits dangerous custom theme image urls from share urls', () => {
    const shareUrl = createTierListShareUrl([
      { name: 'Tier1', decks: [
        { id: 'custom-theme', name: 'Custom Theme', image: 'javascript:alert(1)' },
      ] },
      { name: 'Tier2', decks: [] },
      { name: 'Tier3', decks: [] },
      { name: 'Tier4', decks: [] },
    ]);
    const params = new URL(shareUrl).searchParams;

    expect(shareUrl).not.toContain('javascript');
    expect(JSON.parse(params.get('customDecks') ?? '')).toEqual([
      { id: 'custom-theme', name: 'Custom Theme' },
    ]);
  });

  it('omits relative custom theme image urls from share urls', () => {
    const shareUrl = createTierListShareUrl([
      { name: 'Tier1', decks: [
        { id: 'custom-theme', name: 'Custom Theme', image: '/custom-theme.png' },
      ] },
      { name: 'Tier2', decks: [] },
      { name: 'Tier3', decks: [] },
      { name: 'Tier4', decks: [] },
    ]);
    const params = new URL(shareUrl).searchParams;

    expect(JSON.parse(params.get('customDecks') ?? '')).toEqual([
      { id: 'custom-theme', name: 'Custom Theme' },
    ]);
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

  it('creates share text for X from intro, hashtags, and url only', () => {
    const shareText = createXShareText({
      intro: 'TierMakerでTier表を作成しました',
      hashtags: '#遊戯王マスターデュエル #TIERMAKERFORMD',
      url: 'https://tier.ygotools.com/?tier1=blue-eyes',
    });

    expect(shareText).toBe(
      'TierMakerでTier表を作成しました\n#遊戯王マスターデュエル #TIERMAKERFORMD\nhttps://tier.ygotools.com/?tier1=blue-eyes',
    );
  });

  it('does not add tier details to X share text', () => {
    const shareText = createXShareText({
      intro: 'TierMaker縺ｧTier陦ｨ繧剃ｽ懈・縺励∪縺励◆',
      hashtags: '#驕頑葦邇九・繧ｹ繧ｿ繝ｼ繝・Η繧ｨ繝ｫ #TIERMAKERFORMD',
      url: 'https://tier.ygotools.com/?tier1=blue-eyes',
    });

    expect(shareText).toBe(
      'TierMaker縺ｧTier陦ｨ繧剃ｽ懈・縺励∪縺励◆\n#驕頑葦邇九・繧ｹ繧ｿ繝ｼ繝・Η繧ｨ繝ｫ #TIERMAKERFORMD\nhttps://tier.ygotools.com/?tier1=blue-eyes',
    );
    expect(shareText).not.toContain('Tier1');
  });
});
