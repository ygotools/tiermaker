import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createXShareText,
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

  afterEach(() => {
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

  it('restores all repeated tier query params while ignoring duplicate deck assignments', () => {
    window.history.replaceState({}, '', '/?tier1=blue-eyes&tier1=ryzeal,malice&tier2=blue-eyes&tier2=vsk9');

    const restored = loadTierListSnapshot();

    expect(restored.tiers[0].decks.map((deck) => deck.id)).toEqual(['blue-eyes', 'ryzeal', 'malice']);
    expect(restored.tiers[1].decks.map((deck) => deck.id)).toEqual(['vsk9']);
  });

  it('returns the default snapshot when storage is empty', () => {
    expect(loadTierListSnapshot()).toEqual(createDefaultTierListSnapshot());
  });

  it('falls back to the default snapshot when storage is invalid', () => {
    window.sessionStorage.setItem('tiermaker:tier-list', '{broken json');

    expect(loadTierListSnapshot()).toEqual(createDefaultTierListSnapshot());
  });

  it('falls back to the default snapshot when session storage rejects reads', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage is unavailable');
    });

    expect(loadTierListSnapshot()).toEqual(createDefaultTierListSnapshot());
  });

  it('round-trips a saved snapshot', () => {
    const snapshot = createDefaultTierListSnapshot();

    saveTierListSnapshot(snapshot);

    expect(loadTierListSnapshot()).toEqual(snapshot);
  });

  it('does not throw when session storage quota is exceeded', () => {
    const snapshot = createDefaultTierListSnapshot();

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
    });

    expect(() => saveTierListSnapshot(snapshot)).not.toThrow();
    expect(loadTierListSnapshot()).toEqual(createDefaultTierListSnapshot());
  });

  it('does not throw when session storage rejects writes with a generic error', () => {
    const snapshot = createDefaultTierListSnapshot();

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage is unavailable');
    });

    expect(() => saveTierListSnapshot(snapshot)).not.toThrow();
    expect(loadTierListSnapshot()).toEqual(createDefaultTierListSnapshot());
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

  it('creates share text for X with intro, hashtags, tiers, and url', () => {
    const shareText = createXShareText({
      intro: 'TierMakerでTier表を作成しました',
      hashtags: '#遊戯王マスターデュエル #TIERMAKERFORMD',
      tierText: 'Tier1 青眼\nTier2 ライゼオル\nTier3\nTier4 M∀LICE',
      url: 'https://tier.ygotools.com/?tier1=blue-eyes',
    });

    expect(shareText).toBe(
      'TierMakerでTier表を作成しました\n#遊戯王マスターデュエル #TIERMAKERFORMD\n\nTier1 青眼\nTier2 ライゼオル\nTier3\nTier4 M∀LICE\nhttps://tier.ygotools.com/?tier1=blue-eyes',
    );
  });

  it('creates share text for X without tier details when tier text is omitted', () => {
    const shareText = createXShareText({
      intro: 'TierMaker縺ｧTier陦ｨ繧剃ｽ懈・縺励∪縺励◆',
      hashtags: '#驕頑葦邇九・繧ｹ繧ｿ繝ｼ繝・Η繧ｨ繝ｫ #TIERMAKERFORMD',
      url: 'https://tier.ygotools.com/?tier1=blue-eyes',
    });

    expect(shareText).toBe(
      'TierMaker縺ｧTier陦ｨ繧剃ｽ懈・縺励∪縺励◆\n#驕頑葦邇九・繧ｹ繧ｿ繝ｼ繝・Η繧ｨ繝ｫ #TIERMAKERFORMD\nhttps://tier.ygotools.com/?tier1=blue-eyes',
    );
  });

  it('truncates tier text for X to fit the post length budget', () => {
    const shareText = createXShareText({
      intro: 'TierMakerでTier表を作成しました',
      hashtags: '#遊戯王マスターデュエル #TIERMAKERFORMD',
      tierText: 'A'.repeat(400),
      url: 'https://tier.ygotools.com/?tier1=blue-eyes',
    });

    const [header, hashtags, spacer, tierText, url] = shareText.split('\n');

    expect(header).toBe('TierMakerでTier表を作成しました');
    expect(hashtags).toBe('#遊戯王マスターデュエル #TIERMAKERFORMD');
    expect(spacer).toBe('');
    expect(url).toBe('https://tier.ygotools.com/?tier1=blue-eyes');
    expect(tierText).toHaveLength(203);
  });
});
