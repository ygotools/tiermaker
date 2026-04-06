import React, { createContext, useContext, useEffect, useState } from 'react';

export type Locale = 'ja' | 'en';

type Translation = {
  app: {
    updateHistoryTitle: string;
    updateHistoryItems: readonly string[];
    requestThemeLink: string;
  };
  tierList: {
    shareIntro: string;
    shareHashtags: string;
    exportSuccess: string;
    exportError: string;
    resetConfirmation: string;
    resetSuccess: string;
    addedTheme: (themeName: string) => string;
    exportInProgress: string;
    exportButton: string;
    shareOnX: string;
    resetButton: string;
  };
  availableDecks: {
    addTheme: string;
    countLabel: (filteredCount: number, totalCount: number) => string;
    searchPlaceholder: string;
    clearSearchAriaLabel: string;
    noMatchingThemes: string;
    emptyState: string;
    createThemeTitle: string;
    createThemeDescription: string;
    closeModalAriaLabel: string;
    previewAlt: string;
    previewDescription: string;
    themeNameLabel: string;
    themeNamePlaceholder: string;
    iconUrlLabel: string;
    localImageLabel: string;
    cancelButton: string;
    addButton: string;
    requiredThemeNameError: string;
    duplicateThemeError: string;
  };
  tier: {
    emptyPlaceholder: string;
  };
};

const translations = {
  ja: {
    app: {
      updateHistoryTitle: '更新履歴',
      updateHistoryItems: [
        '2026/04: 【ドレミヤミー】【キラーチューン】を追加しました。',
        '2026/02: 【VSK9】を追加しました。',
        '2025/12: 【オノマトライゼオル】【ドラゴンテイル】【巳剣】【ヤミー】【月光】【閃刀姫】【ジェムナイト】【オルフェゴール】【ライゼオル】【巳剣ライゼオル】を追加しました。',
        '2025/07: 【千年M∀LICE】【氷結界】【エルドリッチ】【M∀LICE】【クリストロン】を追加しました。',
        '2025/05: 【P.U.N.K.】【海皇】を追加しました。',
        '2025/04: 【青眼】【破械】【メメント】を追加し、【メタビート】を再追加しました。',
        '2025/02: 【スネークアイ】【千年】を追加しました。',
        '2025/01: 【ドライトロン】【ギミック・パペット】【白き森】を追加しました。',
        '2024/11: 【竜剣士】【マナドゥム】【キマイラ】【覇王幻奏】【暗黒界】を追加しました。',
        '2024/10: 【霊獣】【ライトロード】【天盃龍】【インフェルノイド】を追加しました。',
        '2024/09: 【古代の機械】【ヴァリアンツ】を追加しました。',
        '2024/08: 【神碑】【粛声】を追加しました。',
        '2024/07: 【センチュリオン】【ユベル】【エンディミオン】を追加しました。',
        '2024/06: v0.1.0 を公開しました。',
      ],
      requestThemeLink: 'テーマ追加希望はこちら',
    },
    tierList: {
      shareIntro: 'TierMakerでTier表を作成しました',
      shareHashtags: '#遊戯王マスターデュエル #TIERMAKERFORMD',
      exportSuccess: '画像を出力しました。ダウンロードされた PNG を確認してください。',
      exportError: '画像の出力に失敗しました。時間をおいて再度お試しください。',
      resetConfirmation: '現在の並び替えを破棄して初期状態に戻します。よろしいですか？',
      resetSuccess: '初期状態に戻しました。',
      addedTheme: (themeName) => `「${themeName}」を追加しました。`,
      exportInProgress: 'エクスポート中...',
      exportButton: '画像としてエクスポート',
      shareOnX: 'Xでシェア',
      resetButton: '初期状態に戻す',
    },
    availableDecks: {
      addTheme: 'テーマを追加',
      countLabel: (filteredCount, totalCount) => (
        filteredCount === totalCount ? `${totalCount}件の候補` : `${filteredCount} / ${totalCount}件を表示`
      ),
      searchPlaceholder: 'テーマ名で絞り込む',
      clearSearchAriaLabel: '検索条件をクリア',
      noMatchingThemes: '一致するテーマがありません。',
      emptyState: 'テーマを追加するか、ドラッグしてここに戻してください。',
      createThemeTitle: 'テーマを追加',
      createThemeDescription: '画像 URL か画像ファイルを指定して候補に追加できます。',
      closeModalAriaLabel: '閉じる',
      previewAlt: '新しいテーマのプレビュー',
      previewDescription: '追加前にプレビューを確認できます。画像未指定の場合はデフォルト画像を使います。',
      themeNameLabel: 'テーマ名',
      themeNamePlaceholder: '例: 新テーマ',
      iconUrlLabel: 'アイコン画像 URL',
      localImageLabel: 'またはローカル画像を選択',
      cancelButton: 'キャンセル',
      addButton: '追加',
      requiredThemeNameError: 'テーマ名を入力してください。',
      duplicateThemeError: '同じ名前のテーマはすでに存在します。',
    },
    tier: {
      emptyPlaceholder: 'ドラッグしてここにデッキを追加',
    },
  },
  en: {
    app: {
      updateHistoryTitle: 'Update History',
      updateHistoryItems: [
        '2026/04: Added 【Solfachord Yummy】 and 【Kewl Tune】.',
        '2026/02: Added 【VSK9】.',
        '2025/12: Added 【Onomat Ryzeal】【Dracotail】【Mitsurugi】【Yummy】【Lunalight】【Sky Striker】【Gem-Knight】【Orcust】【Ryzeal】 and 【Mitsurugi Ryzeal】.',
        '2025/07: Added 【Millennium Maliss】【Ice Barrier】【Eldlich】【Maliss】 and 【Crystron】.',
        '2025/05: Added 【P.U.N.K.】 and 【Atlantean】.',
        '2025/04: Added 【Blue-Eyes】【Unchained】 and 【Memento】, and brought back 【Meta Beat】.',
        '2025/02: Added 【Snake-Eye】 and 【Millennium】.',
        '2025/01: Added 【Drytron】【Gimmick Puppet】 and 【White Forest】.',
        '2024/11: Added 【Dracoslayer】【Mannadium】【Chimera】【Supreme King Melodious】 and 【Dark World】.',
        '2024/10: Added 【Ritual Beast】【Lightsworn】【Tenpai Dragon】 and 【Infernoid】.',
        '2024/09: Added 【Ancient Gear】 and 【Vaalmonica】.',
        '2024/08: Added 【Runick】 and 【Voiceless Voice】.',
        '2024/07: Added 【Centur-Ion】【Yubel】 and 【Endymion】.',
        '2024/06: Released v0.1.0.',
      ],
      requestThemeLink: 'Request a theme addition',
    },
    tierList: {
      shareIntro: 'I made a tier list with Tier Maker',
      shareHashtags: '#MasterDuel #YuGiOhMasterDuel #TIERMAKERFORMD',
      exportSuccess: 'Image exported. Please check the downloaded PNG.',
      exportError: 'Failed to export the image. Please try again in a moment.',
      resetConfirmation: 'Discard the current order and restore the initial state?',
      resetSuccess: 'Restored the initial state.',
      addedTheme: (themeName) => `Added "${themeName}".`,
      exportInProgress: 'Exporting...',
      exportButton: 'Export as Image',
      shareOnX: 'Share on X',
      resetButton: 'Reset to Default',
    },
    availableDecks: {
      addTheme: 'Add Theme',
      countLabel: (filteredCount, totalCount) => (
        filteredCount === totalCount ? `${totalCount} themes` : `Showing ${filteredCount} / ${totalCount}`
      ),
      searchPlaceholder: 'Filter by theme name',
      clearSearchAriaLabel: 'Clear search',
      noMatchingThemes: 'No matching themes found.',
      emptyState: 'Add a theme or drag one back here.',
      createThemeTitle: 'Add Theme',
      createThemeDescription: 'You can add a candidate by entering an image URL or selecting an image file.',
      closeModalAriaLabel: 'Close',
      previewAlt: 'Preview of the new theme',
      previewDescription: 'You can review the preview before adding it. If no image is set, the default image will be used.',
      themeNameLabel: 'Theme Name',
      themeNamePlaceholder: 'e.g. New Theme',
      iconUrlLabel: 'Icon Image URL',
      localImageLabel: 'Or choose a local image',
      cancelButton: 'Cancel',
      addButton: 'Add',
      requiredThemeNameError: 'Please enter a theme name.',
      duplicateThemeError: 'A theme with the same name already exists.',
    },
    tier: {
      emptyPlaceholder: 'Drag a deck here to add it',
    },
  },
} as const satisfies Record<Locale, Translation>;

type Messages = typeof translations.ja;

type Join<K, P> = K extends string
  ? P extends string
    ? `${K}.${P}`
    : never
  : never;

type TranslationLeaf =
  | string
  | readonly string[]
  | ((...args: never[]) => unknown);

type LeafPaths<T> = T extends TranslationLeaf
  ? never
  : {
    [K in keyof T & string]:
      T[K] extends TranslationLeaf
        ? K
        : Join<K, LeafPaths<T[K]>>;
  }[keyof T & string];

type PathValue<T, P extends string> =
  P extends `${infer Head}.${infer Rest}`
    ? Head extends keyof T
      ? PathValue<T[Head], Rest>
      : never
    : P extends keyof T
      ? T[P]
      : never;

export type TranslationKey = LeafPaths<Messages>;

const getLanguageCandidates = () => {
  if (typeof navigator === 'undefined') {
    return [];
  }

  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    return navigator.languages;
  }

  return navigator.language ? [navigator.language] : [];
};

const LANGUAGE_STORAGE_KEY = 'tier-maker-language';

const isLocale = (value: string): value is Locale => value === 'ja' || value === 'en';

const getStoredLocale = (): Locale | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedLocale = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

  return storedLocale && isLocale(storedLocale) ? storedLocale : null;
};

export const detectLocale = (): Locale => {
  const storedLocale = getStoredLocale();

  if (storedLocale) {
    return storedLocale;
  }

  const [primaryLanguage] = getLanguageCandidates();

  return primaryLanguage?.toLowerCase().startsWith('ja') ? 'ja' : 'en';
};

const getValue = <T, P extends string>(messages: T, path: P): PathValue<T, P> => (
  path
    .split('.')
    .reduce<unknown>((currentValue, key) => (currentValue as Record<string, unknown>)[key], messages as unknown) as PathValue<T, P>
);

type I18nContextValue = {
  language: Locale;
  setLanguage: React.Dispatch<React.SetStateAction<Locale>>;
  t: <K extends TranslationKey>(key: K) => PathValue<Messages, K>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Locale>(detectLocale);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const t = <K extends TranslationKey>(key: K): PathValue<Messages, K> => (
    getValue(translations[language], key)
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider.');
  }

  return context;
};
