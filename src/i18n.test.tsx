import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { detectLocale, I18nProvider, useI18n } from './i18n';

const setNavigatorLanguage = (language: string, languages = [language]) => {
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    value: language,
  });
  Object.defineProperty(window.navigator, 'languages', {
    configurable: true,
    value: languages,
  });
};

const I18nProbe = () => {
  const i18n = useI18n();

  return (
    <div>
      <p>{i18n.t('app.updateHistoryTitle')}</p>
      <button type="button" onClick={() => i18n.setLanguage('en')}>switch-en</button>
      <button type="button" onClick={() => i18n.setLanguage('ja')}>switch-ja</button>
    </div>
  );
};

const recentUiTranslationExpectations = {
  ja: {
    'tierList.shareIntro': 'TierMakerでTier表を作成しました',
    'tierList.shareHashtags': '#遊戯王マスターデュエル #TIERMAKERFORMD',
    'tierList.resetConfirmation': '現在の並び替えを破棄して初期状態に戻します。よろしいですか？',
    'tierList.copyShareUrl': 'URLをコピー',
    'tierList.copyShareUrlSuccess': '共有 URL をコピーしました。',
    'tierList.copyShareUrlError': '共有 URL をコピーできませんでした。ブラウザの権限設定を確認してください。',
    'tierList.shareOnX': 'Xでシェア',
    'tierList.resetButton': '初期状態に戻す',
    'availableDecks.localImageTooLargeError': 'ローカル画像は 1MB 以下のファイルを選択してください。',
    'availableDecks.localImageReadError': 'ローカル画像を読み込めませんでした。別の画像を選択してください。',
    'availableDecks.keyboardDragDescription': 'キーボード操作: 左右矢印キー、Home キー、End キーで候補内を並び替え、上矢印キーで最後の Tier へ移動できます。',
    'tier.keyboardDragDescription': 'キーボード操作: 左右矢印キー、Home キー、End キーでこの Tier 内を移動できます。上下矢印キーで Tier 間を移動し、Delete キーまたは Backspace キーで候補に戻せます。',
  },
  en: {
    'tierList.shareIntro': 'I made a tier list with Tier Maker',
    'tierList.shareHashtags': '#MasterDuel #YuGiOhMasterDuel #TIERMAKERFORMD',
    'tierList.resetConfirmation': 'Discard the current order and restore the initial state?',
    'tierList.copyShareUrl': 'Copy URL',
    'tierList.copyShareUrlSuccess': 'Share URL copied.',
    'tierList.copyShareUrlError': 'Could not copy the share URL. Please check your browser permissions.',
    'tierList.shareOnX': 'Share on X',
    'tierList.resetButton': 'Reset to Default',
    'availableDecks.localImageTooLargeError': 'Please choose a local image that is 1 MB or smaller.',
    'availableDecks.localImageReadError': 'Could not read the local image. Please choose another image.',
    'availableDecks.keyboardDragDescription': 'Keyboard controls: Use ArrowLeft, ArrowRight, Home, and End to reorder within available decks. Use ArrowUp to move to the last tier.',
    'tier.keyboardDragDescription': 'Keyboard controls: Use ArrowLeft, ArrowRight, Home, and End to move within this tier. Use ArrowUp and ArrowDown to move between tiers. Use Delete or Backspace to return to available decks.',
  },
} as const;

const recentUiTranslationKeys = Object.keys(
  recentUiTranslationExpectations.en,
) as Array<keyof typeof recentUiTranslationExpectations.en>;

const RecentUiTranslationsProbe = () => {
  const i18n = useI18n();

  return (
    <div>
      {recentUiTranslationKeys.map((key) => (
        <p key={key} data-testid={`translation:${key}`}>
          {i18n.t(key)}
        </p>
      ))}
      <p data-testid="translation:tierList.addedTheme">
        {i18n.t('tierList.addedTheme')('Probe Theme')}
      </p>
    </div>
  );
};

describe('i18n', () => {
  beforeEach(() => {
    setNavigatorLanguage('ja-JP');
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses localStorage language when available', () => {
    window.localStorage.setItem('tier-maker-language', 'en');

    render(
      <I18nProvider>
        <I18nProbe />
      </I18nProvider>,
    );

    expect(screen.getByText('Update History')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('falls back to navigator language when localStorage reads fail', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage is blocked');
    });

    expect(detectLocale()).toBe('ja');
  });

  it('falls back to navigator language when localStorage is unavailable', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('localStorage is unavailable');
    });

    expect(detectLocale()).toBe('ja');
  });

  it('ignores unsupported stored locale values', () => {
    setNavigatorLanguage('en-US');
    window.localStorage.setItem('tier-maker-language', 'fr');

    expect(detectLocale()).toBe('en');
  });

  it('switches the active language through setLanguage', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <I18nProbe />
      </I18nProvider>,
    );

    expect(screen.getByText('更新履歴')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'switch-en' }));
    expect(screen.getByText('Update History')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    expect(window.localStorage.getItem('tier-maker-language')).toBe('en');

    await user.click(screen.getByRole('button', { name: 'switch-ja' }));
    expect(screen.getByText('更新履歴')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('ja');
    expect(window.localStorage.getItem('tier-maker-language')).toBe('ja');
  });

  it('resolves recent UI translations in Japanese and English', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <I18nProbe />
        <RecentUiTranslationsProbe />
      </I18nProvider>,
    );

    recentUiTranslationKeys.forEach((key) => {
      expect(screen.getByTestId(`translation:${key}`)).toHaveTextContent(
        recentUiTranslationExpectations.ja[key],
      );
    });
    expect(screen.getByTestId('translation:tierList.addedTheme')).toHaveTextContent('「Probe Theme」を追加しました。');

    await user.click(screen.getByRole('button', { name: 'switch-en' }));

    recentUiTranslationKeys.forEach((key) => {
      expect(screen.getByTestId(`translation:${key}`)).toHaveTextContent(
        recentUiTranslationExpectations.en[key],
      );
    });
    expect(screen.getByTestId('translation:tierList.addedTheme')).toHaveTextContent('Added "Probe Theme".');
  });

  it('keeps language switching usable when localStorage writes fail', async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('localStorage is blocked');
    });

    render(
      <I18nProvider>
        <I18nProbe />
      </I18nProvider>,
    );

    expect(screen.getByText('更新履歴')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'switch-en' }));
    expect(screen.getByText('Update History')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('keeps initial render and language switching usable when localStorage is full', async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    render(
      <I18nProvider>
        <I18nProbe />
      </I18nProvider>,
    );

    expect(screen.getByText('更新履歴')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('ja');

    await user.click(screen.getByRole('button', { name: 'switch-en' }));
    expect(screen.getByText('Update History')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });
});
