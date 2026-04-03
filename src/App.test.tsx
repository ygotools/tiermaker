import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the tier list search input', () => {
    render(<App />);

    expect(screen.getByPlaceholderText('テーマ名で絞り込む')).toBeInTheDocument();
  });
});
