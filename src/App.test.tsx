import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

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

describe('App', () => {
  beforeEach(() => {
    setNavigatorLanguage('en-US');
    window.localStorage.clear();
  });

  it('renders the English UI when the browser language is not Japanese', () => {
    render(<App />);

    expect(screen.getByPlaceholderText('Filter by theme name')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Add Theme' })).toHaveLength(2);
    expect(screen.getByText('Lunalight')).toBeInTheDocument();
    expect(screen.getByText('Maliss')).toBeInTheDocument();
    expect(screen.getByText('2024/08: Added 【Runick】 and 【Voiceless Voice】.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.lang).toBe('en');
  });

  it('uses the primary browser language when multiple preferred languages exist', () => {
    setNavigatorLanguage('en-US', ['en-US', 'ja-JP']);
    render(<App />);

    expect(screen.getByPlaceholderText('Filter by theme name')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('renders the Japanese UI when the browser language is Japanese', () => {
    setNavigatorLanguage('ja-JP');
    render(<App />);

    expect(screen.getByPlaceholderText('テーマ名で絞り込む')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'テーマを追加' })).toHaveLength(2);
    expect(screen.getByText('月光')).toBeInTheDocument();
    expect(screen.getByText('M∀LICE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '日本語' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.lang).toBe('ja');
  });

  it('renders grouped update history entries inside a details disclosure', () => {
    setNavigatorLanguage('ja-JP');
    render(<App />);

    const summary = screen.getByText('更新履歴').closest('summary');

    expect(summary).toBeInTheDocument();

    const details = summary?.closest('details');

    expect(details).toBeInTheDocument();
    expect(within(details as HTMLElement).getByText('2024/11: 【竜剣士】【マナドゥム】【キマイラ】【覇王幻奏】【暗黒界】を追加しました。')).toBeInTheDocument();
  });
});
