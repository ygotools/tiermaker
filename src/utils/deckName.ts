import { Deck } from '../types';

export const getDeckDisplayName = (deck: Deck, language: 'ja' | 'en') => {
  if (language === 'ja') {
    return deck.name;
  }

  return deck.nameEn?.trim() || deck.name;
};
