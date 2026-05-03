export type Deck = {
  id: string;
  name: string;
  nameEn?: string;
  kana?: string;
  image: string; // 代表画像のURL
}

export type Tier = {
  name: string;
  decks: Deck[];
}

export type DeckDragItem = {
  deck: Deck;
  index: number;
  tierIndex: number;
}
