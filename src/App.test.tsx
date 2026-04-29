import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const getTierElement = (container: HTMLElement, tierIndex: number) => {
  const tier = container.querySelector<HTMLElement>(`.tier[data-tier-index="${tierIndex}"]`);

  expect(tier).toBeInTheDocument();

  return tier as HTMLElement;
};

const getTierDeckNames = (container: HTMLElement, tierIndex: number) => (
  Array.from(getTierElement(container, tierIndex).querySelectorAll<HTMLElement>('.tier-item'))
    .map((item) => item.getAttribute('title'))
);

describe('App', () => {
  beforeEach(() => {
    setNavigatorLanguage('en-US');
    window.localStorage.clear();
    window.sessionStorage.clear();
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

  it('announces the required theme name error in the add theme dialog', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'Add Theme' })[0]);
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const themeNameInput = screen.getByLabelText('Theme Name');
    const error = screen.getByRole('alert');

    expect(error).toHaveTextContent('Please enter a theme name.');
    expect(themeNameInput).toHaveAttribute('aria-invalid', 'true');
    expect(themeNameInput).toHaveAttribute('aria-describedby', error.id);
  });

  it('moves a tier deck within the same tier with arrow keys', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    screen.getByRole('button', { name: 'Kewl Tune, Tier1, position 1 of 2' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(getTierDeckNames(container, 0)).toEqual(['Solfachord Yummy', 'Kewl Tune']);
    expect(document.activeElement).toHaveAccessibleName('Kewl Tune, Tier1, position 2 of 2');
  });

  it('moves a tier deck between tiers with arrow keys', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    screen.getByRole('button', { name: 'Kewl Tune, Tier1, position 1 of 2' }).focus();
    await user.keyboard('{ArrowDown}');

    expect(getTierDeckNames(container, 0)).toEqual(['Solfachord Yummy']);
    expect(getTierDeckNames(container, 1)).toEqual(['Kewl Tune', 'VSK9', 'Dracotail', 'Maliss', 'Gem-Knight']);
    expect(document.activeElement).toHaveAccessibleName('Kewl Tune, Tier2, position 1 of 5');
  });

  it('returns a tier deck to available decks with Delete', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    screen.getByRole('button', { name: 'Kewl Tune, Tier1, position 1 of 2' }).focus();
    await user.keyboard('{Delete}');

    expect(getTierDeckNames(container, 0)).toEqual(['Solfachord Yummy']);
    expect(container.querySelector('.available-decks-container [title="Kewl Tune"]')).toBeInTheDocument();
  });
});
