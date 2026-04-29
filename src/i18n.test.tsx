import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider, useI18n } from './i18n';

const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

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

const replaceLocalStorage = (storage: Partial<Storage>) => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
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

describe('i18n', () => {
  beforeEach(() => {
    setNavigatorLanguage('ja-JP');
    window.localStorage.clear();
  });

  afterEach(() => {
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    }
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

  it('falls back to the browser language when reading localStorage fails', () => {
    replaceLocalStorage({
      getItem: () => {
        throw new Error('storage unavailable');
      },
      setItem: () => undefined,
    });

    render(
      <I18nProvider>
        <I18nProbe />
      </I18nProvider>,
    );

    expect(screen.getByText('更新履歴')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('ja');
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

  it('keeps language switching usable when localStorage writes fail', async () => {
    const user = userEvent.setup();

    replaceLocalStorage({
      getItem: () => null,
      setItem: () => {
        throw new Error('storage unavailable');
      },
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
});
