import { describe, expect, it } from 'vitest';
import type { Tier } from '../types';
import {
  EXPORT_CANVAS_WIDTH,
  EXPORT_FOOTER_HEIGHT,
  EXPORT_TITLE_HEIGHT,
  TIER_MIN_HEIGHT,
  getExportCanvasHeight,
  getTierCardColumns,
  getTierCardPosition,
  getTierDeckRows,
  getTierRowHeight,
} from './exportImageLayout';

describe('exportImageLayout', () => {
  it('uses three card columns in the current export width', () => {
    expect(getTierCardColumns()).toBe(3);
    expect(getTierCardColumns(EXPORT_CANVAS_WIDTH)).toBe(3);
  });

  it('grows the row height once the card count wraps', () => {
    expect(getTierDeckRows(0)).toBe(0);
    expect(getTierDeckRows(3)).toBe(1);
    expect(getTierDeckRows(4)).toBe(2);
    expect(getTierRowHeight(0)).toBe(TIER_MIN_HEIGHT);
    expect(getTierRowHeight(4)).toBeGreaterThan(getTierRowHeight(3));
  });

  it('positions cards on a three-column grid', () => {
    const first = getTierCardPosition(0, 120);
    const fourth = getTierCardPosition(3, 120);

    expect(first.x).toBe(120);
    expect(first.y).toBe(128);
    expect(fourth.x).toBe(120);
    expect(fourth.y).toBeGreaterThan(first.y);
  });

  it('computes the total canvas height from the tier rows', () => {
    const tiers: Pick<Tier, 'decks'>[] = [
      { decks: [{ id: 'a', name: 'a', image: '/a.png' }, { id: 'b', name: 'b', image: '/b.png' }, { id: 'c', name: 'c', image: '/c.png' }] },
      { decks: [] },
      { decks: [{ id: 'd', name: 'd', image: '/d.png' }, { id: 'e', name: 'e', image: '/e.png' }, { id: 'f', name: 'f', image: '/f.png' }, { id: 'g', name: 'g', image: '/g.png' }] },
    ];

    expect(getExportCanvasHeight(tiers)).toBe(
      EXPORT_TITLE_HEIGHT +
      getTierRowHeight(3) +
      getTierRowHeight(0) +
      getTierRowHeight(4) +
      EXPORT_FOOTER_HEIGHT,
    );
  });
});
