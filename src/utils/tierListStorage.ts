import { INITIAL_AVAILABLE_DECKS, SAMPLE_DATA } from '../masterdata';
import { Deck, Tier } from '../types';

type TierListSnapshot = {
  tiers: Tier[];
  availableDecks: Deck[];
}

const STORAGE_KEY = 'tiermaker:tier-list';

const isDeck = (value: unknown): value is Deck => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const deck = value as Record<string, unknown>;
  return typeof deck.name === 'string' && typeof deck.image === 'string';
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

const countDecks = (snapshot: TierListSnapshot) => (
  snapshot.availableDecks.length +
  snapshot.tiers.reduce((total, tier) => total + tier.decks.length, 0)
);

export const createDefaultTierListSnapshot = (): TierListSnapshot => ({
  tiers: SAMPLE_DATA,
  availableDecks: INITIAL_AVAILABLE_DECKS,
});

export const loadTierListSnapshot = (): TierListSnapshot => {
  const defaultSnapshot = createDefaultTierListSnapshot();

  if (typeof window === 'undefined') {
    return defaultSnapshot;
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

    return countDecks(parsed) === countDecks(defaultSnapshot)
      ? parsed
      : defaultSnapshot;
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
