import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the tier list search input', () => {
    render(<App />);

    expect(screen.getByPlaceholderText('テーマ名で絞り込む')).toBeInTheDocument();
  });

  it('renders update history entries inside a details disclosure', () => {
    render(<App />);

    const summary = screen.getByText('更新履歴').closest('summary');

    expect(summary).toBeInTheDocument();

    const details = summary?.closest('details');

    expect(details).toBeInTheDocument();
    expect(within(details as HTMLElement).getByText('2024/11/05: 【マナドゥム】【キマイラ】【覇王幻奏】【暗黒界】を追加しました。')).toBeInTheDocument();
  });
});
