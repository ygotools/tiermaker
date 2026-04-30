import { Deck } from '../types';

const ROMAJI_TO_HIRAGANA: Record<string, string> = {
  kya: 'きゃ',
  kyu: 'きゅ',
  kyo: 'きょ',
  sha: 'しゃ',
  shu: 'しゅ',
  sho: 'しょ',
  sya: 'しゃ',
  syu: 'しゅ',
  syo: 'しょ',
  cha: 'ちゃ',
  chu: 'ちゅ',
  cho: 'ちょ',
  cya: 'ちゃ',
  cyu: 'ちゅ',
  cyo: 'ちょ',
  tya: 'ちゃ',
  tyu: 'ちゅ',
  tyo: 'ちょ',
  nya: 'にゃ',
  nyu: 'にゅ',
  nyo: 'にょ',
  hya: 'ひゃ',
  hyu: 'ひゅ',
  hyo: 'ひょ',
  mya: 'みゃ',
  myu: 'みゅ',
  myo: 'みょ',
  rya: 'りゃ',
  ryu: 'りゅ',
  ryo: 'りょ',
  gya: 'ぎゃ',
  gyu: 'ぎゅ',
  gyo: 'ぎょ',
  ja: 'じゃ',
  ju: 'じゅ',
  jo: 'じょ',
  jya: 'じゃ',
  jyu: 'じゅ',
  jyo: 'じょ',
  bya: 'びゃ',
  byu: 'びゅ',
  byo: 'びょ',
  pya: 'ぴゃ',
  pyu: 'ぴゅ',
  pyo: 'ぴょ',
  fa: 'ふぁ',
  fi: 'ふぃ',
  fe: 'ふぇ',
  fo: 'ふぉ',
  va: 'ゔぁ',
  vi: 'ゔぃ',
  vu: 'ゔ',
  ve: 'ゔぇ',
  vo: 'ゔぉ',
  wi: 'うぃ',
  we: 'うぇ',
  wo: 'を',
  tsa: 'つぁ',
  tsi: 'つぃ',
  tse: 'つぇ',
  tso: 'つぉ',
  che: 'ちぇ',
  she: 'しぇ',
  je: 'じぇ',
  ji: 'じ',
  ti: 'てぃ',
  tu: 'とぅ',
  di: 'でぃ',
  du: 'どぅ',
  yi: 'い',
  ye: 'いぇ',
  kwa: 'くぁ',
  kwi: 'くぃ',
  kwe: 'くぇ',
  kwo: 'くぉ',
  qa: 'くぁ',
  qi: 'くぃ',
  qe: 'くぇ',
  qo: 'くぉ',
  la: 'ぁ',
  li: 'ぃ',
  lu: 'ぅ',
  le: 'ぇ',
  lo: 'ぉ',
  xa: 'ぁ',
  xi: 'ぃ',
  xu: 'ぅ',
  xe: 'ぇ',
  xo: 'ぉ',
  lya: 'ゃ',
  lyu: 'ゅ',
  lyo: 'ょ',
  xya: 'ゃ',
  xyu: 'ゅ',
  xyo: 'ょ',
  ltu: 'っ',
  xtu: 'っ',
  ltsu: 'っ',
  xtsu: 'っ',
  shi: 'し',
  chi: 'ち',
  tsu: 'つ',
  fu: 'ふ',
  ka: 'か',
  ki: 'き',
  ku: 'く',
  ke: 'け',
  ko: 'こ',
  sa: 'さ',
  si: 'し',
  su: 'す',
  se: 'せ',
  so: 'そ',
  ta: 'た',
  te: 'て',
  to: 'と',
  na: 'な',
  ni: 'に',
  nu: 'ぬ',
  ne: 'ね',
  no: 'の',
  ha: 'は',
  hi: 'ひ',
  hu: 'ふ',
  he: 'へ',
  ho: 'ほ',
  ma: 'ま',
  mi: 'み',
  mu: 'む',
  me: 'め',
  mo: 'も',
  ya: 'や',
  yu: 'ゆ',
  yo: 'よ',
  ra: 'ら',
  ri: 'り',
  ru: 'る',
  re: 'れ',
  ro: 'ろ',
  wa: 'わ',
  ga: 'が',
  gi: 'ぎ',
  gu: 'ぐ',
  ge: 'げ',
  go: 'ご',
  za: 'ざ',
  zi: 'じ',
  zu: 'ず',
  ze: 'ぜ',
  zo: 'ぞ',
  da: 'だ',
  de: 'で',
  do: 'ど',
  ba: 'ば',
  bi: 'び',
  bu: 'ぶ',
  be: 'べ',
  bo: 'ぼ',
  pa: 'ぱ',
  pi: 'ぴ',
  pu: 'ぷ',
  pe: 'ぺ',
  po: 'ぽ',
  a: 'あ',
  i: 'い',
  u: 'う',
  e: 'え',
  o: 'お',
};

const normalizeSearchText = (value: string) => value.trim().toLocaleLowerCase().normalize('NFKC');

const katakanaToHiragana = (value: string) => (
  value.replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
);

const compactKanaForSearch = (value: string) => (
  katakanaToHiragana(normalizeSearchText(value))
    .replace(/[ー\-－‐]/g, '')
    .replace(/\s+/g, '')
);

const compactIdentifierForSearch = (value: string) => (
  normalizeSearchText(value)
    .replace(/[/\\]/g, ' ')
    .replace(/[-_\s]+/g, '')
);

const getImageStem = (imagePath: string) => {
  const withoutQuery = normalizeSearchText(imagePath).split(/[?#]/, 1)[0] ?? '';
  const basename = withoutQuery.split('/').pop() ?? withoutQuery;

  return basename.replace(/\.[^.]+$/, '');
};

const isConsonant = (char: string) => /[bcdfghjklmnpqrstvwxyz]/.test(char);

export const convertRomajiToHiragana = (value: string) => {
  const normalizedValue = normalizeSearchText(value).replace(/\s+/g, '');
  let index = 0;
  let result = '';

  while (index < normalizedValue.length) {
    const current = normalizedValue[index];
    const next = normalizedValue[index + 1];

    if (!current) {
      break;
    }

    if (current === 'n') {
      if (!next) {
        result += 'ん';
        index += 1;
        continue;
      }

      if (next === '\'') {
        result += 'ん';
        index += 2;
        continue;
      }

      if (!/[aiueoyn]/.test(next)) {
        result += 'ん';
        index += 1;
        continue;
      }
    }

    if (
      current === next &&
      current !== 'n' &&
      isConsonant(current)
    ) {
      result += 'っ';
      index += 1;
      continue;
    }

    let matched = false;

    for (const length of [4, 3, 2, 1]) {
      const chunk = normalizedValue.slice(index, index + length);
      const hiragana = ROMAJI_TO_HIRAGANA[chunk];

      if (!hiragana) {
        continue;
      }

      result += hiragana;
      index += length;
      matched = true;
      break;
    }

    if (matched) {
      continue;
    }

    result += current;
    index += 1;
  }

  return result;
};

export const matchesDeckSearch = (deck: Deck, searchTerm: string) => {
  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const normalizedKanaSearchTerm = compactKanaForSearch(searchTerm);
  const hiraganaSearchTerm = compactKanaForSearch(convertRomajiToHiragana(searchTerm));
  const normalizedImageStem = getImageStem(deck.image);
  const compactSearchTerm = compactIdentifierForSearch(searchTerm);
  const compactImageStem = compactIdentifierForSearch(normalizedImageStem);

  const normalizedDeckName = normalizeSearchText(deck.name);
  const normalizedDeckNameEn = normalizeSearchText(deck.nameEn ?? '');
  const compactDeckName = compactIdentifierForSearch(deck.name);
  const compactDeckNameEn = compactIdentifierForSearch(deck.nameEn ?? '');
  const normalizedDeckKana = compactKanaForSearch(deck.kana ?? '');

  return normalizedDeckName.includes(normalizedSearchTerm) ||
    normalizedDeckNameEn.includes(normalizedSearchTerm) ||
    compactDeckName.includes(compactSearchTerm) ||
    compactDeckNameEn.includes(compactSearchTerm) ||
    normalizedDeckKana.includes(normalizedKanaSearchTerm) ||
    normalizedDeckKana.includes(hiraganaSearchTerm) ||
    normalizedImageStem.includes(normalizedSearchTerm) ||
    compactImageStem.includes(compactSearchTerm);
};
