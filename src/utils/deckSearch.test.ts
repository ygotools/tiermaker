import { describe, expect, it } from 'vitest';
import { convertRomajiToHiragana, matchesDeckSearch } from './deckSearch';

describe('deckSearch', () => {
  it('converts romaji to hiragana for deck search', () => {
    expect(convertRomajiToHiragana('raizeoru')).toBe('らいぜおる');
    expect(convertRomajiToHiragana('shukusei')).toBe('しゅくせい');
    expect(convertRomajiToHiragana('attoigunisuta')).toBe('あっといぐにすた');
  });

  it('matches kana when the user searches in romaji', () => {
    expect(matchesDeckSearch({ id: 'ryzeal', name: 'ライゼオル', kana: 'らいぜおる', image: '/ryzeal.png' }, 'raizeoru')).toBe(true);
    expect(matchesDeckSearch({ id: 'ignister', name: '＠イグニスター', kana: 'あっといぐにすたー', image: '/ignister.png' }, 'attoigunisuta')).toBe(true);
  });

  it('matches kana even when the stored reading uses long vowel marks', () => {
    expect(matchesDeckSearch({ id: 'blue-eyes', name: '青眼', kana: 'ぶるーあいず', image: '/blue-eyes.png' }, 'buruaizu')).toBe(true);
  });

  it('still matches direct name and kana input', () => {
    const deck = { id: 'runick', name: '神碑', kana: 'るーん', image: '/runick.png' };

    expect(matchesDeckSearch(deck, '神碑')).toBe(true);
    expect(matchesDeckSearch(deck, 'るーん')).toBe(true);
    expect(matchesDeckSearch(deck, 'runick')).toBe(true);
    expect(matchesDeckSearch(deck, 'unknown')).toBe(false);
  });

  it('matches the image filename without the extension for english input', () => {
    expect(matchesDeckSearch({ id: 'blue-eyes', name: '青眼', kana: 'ぶるーあいず', image: '/static/deckimages/blue-eyes.png' }, 'blue-eyes')).toBe(true);
    expect(matchesDeckSearch({ id: 'blue-eyes', name: '青眼', kana: 'ぶるーあいず', image: '/static/deckimages/blue-eyes.png' }, 'blue eyes')).toBe(true);
    expect(matchesDeckSearch({ id: 'voiceless_voice', name: '粛声', kana: 'しゅくせい', image: '/static/deckimages/voiceless_voice.png' }, 'voiceless voice')).toBe(true);
  });
});
