import { describe, expect, it } from 'vitest';
import { getDeckDisplayName } from './deckName';
import type { Deck } from '../types';

const createDeck = (overrides: Partial<Deck> = {}): Deck => ({
  id: 'moonlight',
  name: '月光',
  nameEn: 'Lunalight',
  image: '/static/deckimages/moonlight.png',
  ...overrides,
});

describe('getDeckDisplayName', () => {
  it('uses the Japanese name for Japanese display even when an English name exists', () => {
    expect(getDeckDisplayName(createDeck(), 'ja')).toBe('月光');
  });

  it('uses the English name for English display', () => {
    expect(getDeckDisplayName(createDeck(), 'en')).toBe('Lunalight');
  });

  it('falls back to the Japanese name when the English name is missing or blank', () => {
    expect(getDeckDisplayName(createDeck({ nameEn: undefined }), 'en')).toBe('月光');
    expect(getDeckDisplayName(createDeck({ nameEn: '' }), 'en')).toBe('月光');
    expect(getDeckDisplayName(createDeck({ nameEn: '   ' }), 'en')).toBe('月光');
  });
});
