import { INITIAL_AVAILABLE_DECKS, SAMPLE_DATA } from '../masterdata';
import { Deck, Tier } from '../types';

type TierListSnapshot = {
  tiers: Tier[];
  availableDecks: Deck[];
}

const STORAGE_KEY = 'tiermaker:tier-list';
const TIER_QUERY_KEYS = ['tier1', 'tier2', 'tier3', 'tier4'] as const;

const splitDeckIds = (value: string) => (
  value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
);

const createSnapshotFromQueryParams = (queryString: string, defaultSnapshot: TierListSnapshot): TierListSnapshot | null => {
  const params = new URLSearchParams(queryString);
  const deckById = new Map(
    [...defaultSnapshot.tiers.flatMap((tier) => tier.decks), ...defaultSnapshot.availableDecks]
      .map((deck) => [deck.id, deck]),
  );
  const usedDeckIds = new Set<string>();

  const tiers = defaultSnapshot.tiers.map((tier, index) => {
    const rawValue = params.get(TIER_QUERY_KEYS[index]);

    if (!rawValue) {
      return { ...tier, decks: [] };
    }

    const decks = splitDeckIds(rawValue).flatMap((deckId) => {
      const deck = deckById.get(deckId);

      if (!deck || usedDeckIds.has(deckId)) {
        return [];
      }

      usedDeckIds.add(deckId);
      return [deck];
    });

    return {
      ...tier,
      decks,
    };
  });

  if (usedDeckIds.size === 0) {
    return null;
  }

  return {
    tiers,
    availableDecks: [...deckById.entries()]
      .filter(([deckId]) => !usedDeckIds.has(deckId))
      .map(([, deck]) => deck),
  };
};

const isDeck = (value: unknown): value is Deck => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const deck = value as Record<string, unknown>;
  return typeof deck.id === 'string' && typeof deck.name === 'string' && typeof deck.image === 'string';
};

const isTier = (value: unknown): value is Tier => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const tier = value as Record<string, unknown>;
  return typeof tier.name === 'string' && Array.isArray(tier.decks) && tier.decks.every(isDeck);
};

const isTierListSnapshot = (value: unknown): value is TierListSnapshot => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const snapshot = value as Record<string, unknown>;
  return Array.isArray(snapshot.tiers) &&
    snapshot.tiers.every(isTier) &&
    Array.isArray(snapshot.availableDecks) &&
    snapshot.availableDecks.every(isDeck);
};

export const createDefaultTierListSnapshot = (): TierListSnapshot => ({
  tiers: SAMPLE_DATA,
  availableDecks: INITIAL_AVAILABLE_DECKS,
});

export const loadTierListSnapshot = (): TierListSnapshot => {
  const defaultSnapshot = createDefaultTierListSnapshot();

  if (typeof window === 'undefined') {
    return defaultSnapshot;
  }

  const querySnapshot = createSnapshotFromQueryParams(window.location.search, defaultSnapshot);

  if (querySnapshot) {
    return querySnapshot;
  }

  const rawValue = window.sessionStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return defaultSnapshot;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!isTierListSnapshot(parsed)) {
      return defaultSnapshot;
    }

    return parsed;
  } catch {
    return defaultSnapshot;
  }
};

export const saveTierListSnapshot = (snapshot: TierListSnapshot) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
};
