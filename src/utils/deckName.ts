import { Deck } from '../types';

export const getDeckDisplayName = (deck: Deck, language: 'ja' | 'en') => (
  language === 'en' ? deck.nameEn ?? deck.name : deck.name
);
