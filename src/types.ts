export type Deck = {
  id: string;
  name: string;
  image: string; // 代表画像のURL
}

export type Tier = {
  name: string;
  decks: Deck[];
}
