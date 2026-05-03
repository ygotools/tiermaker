import { INITIAL_AVAILABLE_DECKS, SAMPLE_DATA } from '../masterdata';
import { Deck, Tier } from '../types';

type TierListSnapshot = {
  tiers: Tier[];
  availableDecks: Deck[];
}

const STORAGE_KEY = 'tiermaker:tier-list';
const TIER_QUERY_KEYS = ['tier1', 'tier2', 'tier3', 'tier4'] as const;
const CUSTOM_DECKS_QUERY_KEY = 'customDecks';
const DEFAULT_CUSTOM_DECK_IMAGE = '/static/deckimages/others_01.png';
const MAX_CUSTOM_DECK_ID_LENGTH = 128;
const MAX_CUSTOM_DECK_NAME_LENGTH = 120;
const TIER_DECK_ID_SEPARATOR = ',';
const hasControlCharacter = (value: string) => (
  Array.from(value).some((character) => {
    const characterCode = character.charCodeAt(0);

    return characterCode <= 0x1F || characterCode === 0x7F;
  })
);

const splitDeckIds = (value: string) => (
  value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
);

const getDeckIdsFromQueryParams = (params: URLSearchParams, queryKey: string) => (
  params.getAll(queryKey).flatMap(splitDeckIds)
);

const getAllDeckIdsFromTierQueryParams = (params: URLSearchParams) => (
  TIER_QUERY_KEYS.flatMap((queryKey) => getDeckIdsFromQueryParams(params, queryKey))
);

const isSafeCustomDeckQueryId = (id: string) => (
  !id.includes(TIER_DECK_ID_SEPARATOR) &&
  !hasControlCharacter(id)
);

export const hasTierListShareQuery = (queryString = typeof window === 'undefined' ? '' : window.location.search) => {
  try {
    const params = new URLSearchParams(queryString);

    return TIER_QUERY_KEYS.some((queryKey) => params.has(queryKey));
  } catch {
    return false;
  }
};

export const clearTierListShareQuery = () => {
  if (typeof window === 'undefined' || !hasTierListShareQuery()) {
    return;
  }

  try {
    const url = new URL(window.location.href);

    TIER_QUERY_KEYS.forEach((queryKey) => url.searchParams.delete(queryKey));
    url.searchParams.delete(CUSTOM_DECKS_QUERY_KEY);

    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // Keep the current URL if the environment cannot parse or replace it.
  }
};

type CustomDeckQueryValue = {
  id: string;
  name: string;
  imageUrl?: string;
};

export const normalizeCustomDeckImage = (imageUrl: string | undefined) => {
  const trimmedImageUrl = imageUrl?.trim() ?? '';

  if (!trimmedImageUrl) {
    return DEFAULT_CUSTOM_DECK_IMAGE;
  }

  try {
    const parsedUrl = new URL(trimmedImageUrl);

    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return trimmedImageUrl;
    }
  } catch {
    return DEFAULT_CUSTOM_DECK_IMAGE;
  }

  return DEFAULT_CUSTOM_DECK_IMAGE;
};

const normalizeCustomDeckQueryValue = (value: unknown): Deck | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const deck = value as Record<string, unknown>;

  if (
    typeof deck.id !== 'string' ||
    typeof deck.name !== 'string' ||
    (typeof deck.imageUrl !== 'undefined' && typeof deck.imageUrl !== 'string')
  ) {
    return null;
  }

  const id = deck.id.trim();
  const name = deck.name.trim();

  if (
    id.length === 0 ||
    name.length === 0 ||
    !isSafeCustomDeckQueryId(id) ||
    id.length > MAX_CUSTOM_DECK_ID_LENGTH ||
    name.length > MAX_CUSTOM_DECK_NAME_LENGTH
  ) {
    return null;
  }

  return {
    id,
    name,
    image: normalizeCustomDeckImage(deck.imageUrl),
  };
};

const createCustomDeckQueryValue = (deck: Deck): CustomDeckQueryValue | null => {
  const id = deck.id.trim();
  const name = deck.name.trim();

  if (
    id.length === 0 ||
    name.length === 0 ||
    !isSafeCustomDeckQueryId(id) ||
    id.length > MAX_CUSTOM_DECK_ID_LENGTH ||
    name.length > MAX_CUSTOM_DECK_NAME_LENGTH
  ) {
    return null;
  }

  const customDeckQueryValue: CustomDeckQueryValue = {
    id,
    name,
  };
  const imageUrl = deck.image.trim();

  if (imageUrl && !imageUrl.startsWith('data:')) {
    try {
      const parsedUrl = new URL(imageUrl);

      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        customDeckQueryValue.imageUrl = imageUrl;
      }
    } catch {
      // Omit invalid image URLs; restore will use the default custom deck image.
    }
  }

  return customDeckQueryValue;
};

const getCustomDecksFromQueryParams = (
  params: URLSearchParams,
  referencedDeckIds: Set<string>,
  knownDeckIds: Set<string>,
): Deck[] => (
  params.getAll(CUSTOM_DECKS_QUERY_KEY).flatMap((rawValue) => {
    try {
      const parsed = JSON.parse(rawValue) as unknown;
      const values = Array.isArray(parsed) ? parsed : [parsed];

      return values.flatMap((value) => {
        const customDeck = normalizeCustomDeckQueryValue(value);

        if (!customDeck || knownDeckIds.has(customDeck.id) || !referencedDeckIds.has(customDeck.id)) {
          return [];
        }

        return [customDeck];
      });
    } catch {
      return [];
    }
  })
);

const createSnapshotFromQueryParams = (queryString: string, defaultSnapshot: TierListSnapshot): TierListSnapshot | null => {
  const params = new URLSearchParams(queryString);

  if (!hasTierListShareQuery(queryString)) {
    return null;
  }

  const knownDecks = [...defaultSnapshot.tiers.flatMap((tier) => tier.decks), ...defaultSnapshot.availableDecks];
  const referencedDeckIds = new Set(getAllDeckIdsFromTierQueryParams(params));
  const knownDeckIds = new Set(knownDecks.map((deck) => deck.id));
  const customDecks = getCustomDecksFromQueryParams(params, referencedDeckIds, knownDeckIds);
  const deckById = new Map(
    [...knownDecks, ...customDecks]
      .map((deck) => [deck.id, deck]),
  );
  const usedDeckIds = new Set<string>();

  const tiers = defaultSnapshot.tiers.map((tier, index) => {
    const queryKey = TIER_QUERY_KEYS[index];
    const deckIds = queryKey ? getDeckIdsFromQueryParams(params, queryKey) : [];

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

const deduplicateSnapshotDecks = (snapshot: TierListSnapshot): TierListSnapshot => {
  const usedDeckIds = new Set<string>();
  const getUniqueDecks = (decks: Deck[]) => decks.filter((deck) => {
    if (usedDeckIds.has(deck.id)) {
      return false;
    }

    usedDeckIds.add(deck.id);
    return true;
  });

  return {
    tiers: snapshot.tiers.map((tier) => ({
      ...tier,
      decks: getUniqueDecks(tier.decks),
    })),
    availableDecks: getUniqueDecks(snapshot.availableDecks),
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

  let querySnapshot: TierListSnapshot | null = null;

  try {
    querySnapshot = createSnapshotFromQueryParams(window.location.search, defaultSnapshot);
  } catch {
    querySnapshot = null;
  }

  if (querySnapshot) {
    return querySnapshot;
  }

  let rawValue: string | null = null;

  try {
    rawValue = window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return defaultSnapshot;
  }

  if (!rawValue) {
    return defaultSnapshot;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!isTierListSnapshot(parsed)) {
      return defaultSnapshot;
    }

    return hydrateSnapshotDeckNames(deduplicateSnapshotDecks(parsed), defaultSnapshot);
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
    // Ignore unavailable or full session storage so the tier list remains usable.
  }
};

export const createTierListShareUrl = (tiers: Tier[]) => {
  const params = new URLSearchParams();
  const defaultSnapshot = createDefaultTierListSnapshot();
  const knownDeckIds = new Set(
    [...defaultSnapshot.tiers.flatMap((tier) => tier.decks), ...defaultSnapshot.availableDecks]
      .map((deck) => deck.id),
  );
  const customDecksById = new Map<string, CustomDeckQueryValue>();
  const sharedDeckIds = new Set<string>();

  tiers.forEach((tier, index) => {
    const queryKey = TIER_QUERY_KEYS[index];

    if (!queryKey || tier.decks.length === 0) {
      return;
    }

    const deckIds = tier.decks.flatMap((deck) => {
      let shareDeckId: string | null = null;

      if (knownDeckIds.has(deck.id)) {
        shareDeckId = deck.id;
      } else {
        const customDeckQueryValue = createCustomDeckQueryValue(deck);

        if (!customDeckQueryValue) {
          return [];
        }

        shareDeckId = customDeckQueryValue.id;

        if (!knownDeckIds.has(customDeckQueryValue.id) && !customDecksById.has(customDeckQueryValue.id)) {
          customDecksById.set(customDeckQueryValue.id, customDeckQueryValue);
        }
      }

      if (sharedDeckIds.has(shareDeckId)) {
        return [];
      }

      sharedDeckIds.add(shareDeckId);
      return [shareDeckId];
    });

    if (deckIds.length === 0) {
      return;
    }

    params.set(queryKey, deckIds.join(','));
  });

  if (customDecksById.size > 0) {
    params.set(CUSTOM_DECKS_QUERY_KEY, JSON.stringify([...customDecksById.values()]));
  }

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
  url,
}: {
  intro: string;
  hashtags: string;
  url: string;
}) => `${intro}\n${hashtags}\n${url}`;
