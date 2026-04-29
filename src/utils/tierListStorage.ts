import { INITIAL_AVAILABLE_DECKS, SAMPLE_DATA } from '../masterdata';
import { Deck, Tier } from '../types';

type TierListSnapshot = {
  tiers: Tier[];
  availableDecks: Deck[];
}

const STORAGE_KEY = 'tiermaker:tier-list';
const TIER_QUERY_KEYS = ['tier1', 'tier2', 'tier3', 'tier4'] as const;
const X_POST_MAX_LENGTH = 280;
const X_SHORT_URL_LENGTH = 23;

const splitDeckIds = (value: string) => (
  value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
);

const getTierQueryDeckIds = (params: URLSearchParams, queryKey: string) => (
  params.getAll(queryKey).flatMap(splitDeckIds)
);

const createSnapshotFromQueryParams = (queryString: string, defaultSnapshot: TierListSnapshot): TierListSnapshot | null => {
  const params = new URLSearchParams(queryString);
  const deckById = new Map(
    [...defaultSnapshot.tiers.flatMap((tier) => tier.decks), ...defaultSnapshot.availableDecks]
      .map((deck) => [deck.id, deck]),
  );
  const usedDeckIds = new Set<string>();

  const tiers = defaultSnapshot.tiers.map((tier, index) => {
    const deckIds = getTierQueryDeckIds(params, TIER_QUERY_KEYS[index]);

    if (deckIds.length === 0) {
      return { ...tier, decks: [] };
    }

    const decks = deckIds.flatMap((deckId) => {
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

const cloneDeck = (deck: Deck): Deck => ({ ...deck });
const cloneTier = (tier: Tier): Tier => ({ ...tier, decks: tier.decks.map(cloneDeck) });
const createDeckDefaultsMap = (snapshot: TierListSnapshot) => new Map(
  [...snapshot.tiers.flatMap((tier) => tier.decks), ...snapshot.availableDecks]
    .map((deck) => [deck.id, deck]),
);

const mergeDeckWithDefault = (deck: Deck, deckDefaultsById: Map<string, Deck>): Deck => {
  const defaultDeck = deckDefaultsById.get(deck.id);

  if (!defaultDeck) {
    return deck;
  }

  return {
    ...deck,
    nameEn: deck.nameEn ?? defaultDeck.nameEn,
  };
};

const hydrateSnapshotDeckNames = (snapshot: TierListSnapshot, defaultSnapshot: TierListSnapshot): TierListSnapshot => {
  const deckDefaultsById = createDeckDefaultsMap(defaultSnapshot);

  return {
    tiers: snapshot.tiers.map((tier) => ({
      ...tier,
      decks: tier.decks.map((deck) => mergeDeckWithDefault(deck, deckDefaultsById)),
    })),
    availableDecks: snapshot.availableDecks.map((deck) => mergeDeckWithDefault(deck, deckDefaultsById)),
  };
};

export const createDefaultTierListSnapshot = (): TierListSnapshot => ({
  tiers: SAMPLE_DATA.map(cloneTier),
  availableDecks: INITIAL_AVAILABLE_DECKS.map(cloneDeck),
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

  try {
    const rawValue = window.sessionStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return defaultSnapshot;
    }

    const parsed = JSON.parse(rawValue) as unknown;

    if (!isTierListSnapshot(parsed)) {
      return defaultSnapshot;
    }

    return hydrateSnapshotDeckNames(parsed, defaultSnapshot);
  } catch {
    return defaultSnapshot;
  }
};

export const saveTierListSnapshot = (snapshot: TierListSnapshot) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage can fail in private browsing, quota exhaustion, or restricted iframes.
  }
};

export const createTierListShareUrl = (tiers: Tier[]) => {
  const params = new URLSearchParams();

  tiers.forEach((tier, index) => {
    const queryKey = TIER_QUERY_KEYS[index];

    if (!queryKey || tier.decks.length === 0) {
      return;
    }

    params.set(queryKey, tier.decks.map((deck) => deck.id).join(','));
  });

  const queryString = params.toString();

  if (typeof window === 'undefined') {
    return queryString ? `/?${queryString}` : '/';
  }

  const shareUrl = new URL(window.location.pathname, window.location.origin);

  if (queryString) {
    shareUrl.search = queryString;
  }

  return shareUrl.toString();
};

export const createTierListShareText = (
  tiers: Tier[],
  getDeckName: (deck: Deck) => string = (deck) => deck.name,
) => (
  tiers
    .map((tier) => [tier.name, ...tier.decks.map((deck) => getDeckName(deck))].join(' '))
    .join('\n')
);

export const createXShareText = ({
  intro,
  hashtags,
  tierText,
  url,
}: {
  intro: string;
  hashtags: string;
  tierText?: string;
  url: string;
}) => {
  const normalizedTierText = tierText?.trim() ?? '';
  const suffix = `\n${url}`;

  if (normalizedTierText.length === 0) {
    return `${intro}\n${hashtags}${suffix}`;
  }

  const prefix = `${intro}\n${hashtags}\n\n`;
  const maxTierTextLength = Math.max(0, X_POST_MAX_LENGTH - (prefix.length + suffix.length - url.length + X_SHORT_URL_LENGTH));
  const truncatedTierText = normalizedTierText.slice(0, maxTierTextLength);

  return `${prefix}${truncatedTierText}${suffix}`;
};
