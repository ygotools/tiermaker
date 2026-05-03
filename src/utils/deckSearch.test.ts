import { describe, expect, it } from 'vitest';
import { convertRomajiToHiragana, matchesDeckSearch } from './deckSearch';

describe('deckSearch', () => {
  it('converts romaji to hiragana for deck search', () => {
    expect(convertRomajiToHiragana('raizeoru')).toBe('らいぜおる');
    expect(convertRomajiToHiragana('shukusei')).toBe('しゅくせい');
    expect(convertRomajiToHiragana('attoigunisuta')).toBe('あっといぐにすた');
    expect(convertRomajiToHiragana('jinrai')).toBe('じんらい');
    expect(convertRomajiToHiragana('n\'kko')).toBe('んっこ');
  });

  it('matches kana when the user searches in romaji', () => {
    expect(matchesDeckSearch({ id: 'ryzeal', name: 'ライゼオル', kana: 'らいぜおる', image: '/ryzeal.png' }, 'raizeoru')).toBe(true);
    expect(matchesDeckSearch({ id: 'ignister', name: '＠イグニスター', kana: 'あっといぐにすたー', image: '/ignister.png' }, 'attoigunisuta')).toBe(true);
    expect(matchesDeckSearch({ id: 'jinrai', name: '迅雷', kana: 'じんらい', image: '/jinrai.png' }, 'jinrai')).toBe(true);
  });

  it('matches kana even when the stored reading uses long vowel marks', () => {
    expect(matchesDeckSearch({ id: 'blue-eyes', name: '青眼', kana: 'ぶるーあいず', image: '/blue-eyes.png' }, 'buruaizu')).toBe(true);
  });

  it('still matches direct name and kana input', () => {
    const deck = { id: 'runick', name: '神碑', kana: 'るーん', image: '/runick.png' };

    expect(matchesDeckSearch(deck, '')).toBe(true);
    expect(matchesDeckSearch(deck, '神碑')).toBe(true);
    expect(matchesDeckSearch(deck, 'るーん')).toBe(true);
    expect(matchesDeckSearch(deck, 'runick')).toBe(true);
    expect(matchesDeckSearch(deck, 'unknown')).toBe(false);
  });

  it('normalizes full-width roman text and mixed separators', () => {
    const deck = { id: 'r-ace', name: 'R-ACE', nameEn: 'Rescue-ACE', kana: 'れすきゅーえーす', image: '/static/deckimages/r-ace.png' };

    expect(matchesDeckSearch(deck, 'Ｒ－ＡＣＥ')).toBe(true);
    expect(matchesDeckSearch(deck, 'rescue_ace')).toBe(true);
    expect(matchesDeckSearch(deck, 'rescue/ace')).toBe(true);
  });

  it('matches the image filename without the extension for english input', () => {
    expect(matchesDeckSearch({ id: 'blue-eyes', name: '青眼', kana: 'ぶるーあいず', image: '/static/deckimages/blue-eyes.png' }, 'blue-eyes')).toBe(true);
    expect(matchesDeckSearch({ id: 'blue-eyes', name: '青眼', kana: 'ぶるーあいず', image: '/static/deckimages/blue-eyes.png' }, 'blue eyes')).toBe(true);
    expect(matchesDeckSearch({ id: 'voiceless_voice', name: '粛声', kana: 'しゅくせい', image: '/static/deckimages/voiceless_voice.png' }, 'voiceless voice')).toBe(true);
  });

  it('matches the localized english name when it differs from the image filename', () => {
    expect(matchesDeckSearch({ id: 'moonlight', name: '月光', nameEn: 'Lunalight', kana: 'げっこう', image: '/static/deckimages/moonlight.png' }, 'lunalight')).toBe(true);
    expect(matchesDeckSearch({ id: 'r-ace', name: 'R-ACE', nameEn: 'Rescue-ACE', kana: 'れすきゅーえーす', image: '/static/deckimages/r-ace.png' }, 'rescue ace')).toBe(true);
  });
});
