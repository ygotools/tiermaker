import { Tier } from '../types';

export const EXPORT_CANVAS_WIDTH = 640;
export const EXPORT_SCALE = 2;
export const EXPORT_PADDING = 8;
export const EXPORT_TITLE_HEIGHT = 68;
export const EXPORT_FOOTER_HEIGHT = 56;
export const TIER_LABEL_WIDTH = 96;
export const TIER_LABEL_OUTER_WIDTH = 112;
export const TIER_LABEL_HEIGHT = 48;
export const TIER_MIN_HEIGHT = 100;
export const TIER_CARD_WIDTH = 160;
export const TIER_CARD_HEIGHT = 90;
export const TIER_CARD_GAP = 16;
export const TIER_CARD_TEXT_HEIGHT = 24;

export const getTierCardColumns = (canvasWidth = EXPORT_CANVAS_WIDTH) => (
  Math.max(
    1,
    Math.floor(
      (canvasWidth - (TIER_LABEL_OUTER_WIDTH + EXPORT_PADDING * 2) + TIER_CARD_GAP) /
      (TIER_CARD_WIDTH + TIER_CARD_GAP),
    ),
  )
);

export const getTierDeckRows = (
  deckCount: number,
  canvasWidth = EXPORT_CANVAS_WIDTH,
) => {
  if (deckCount <= 0) {
    return 0;
  }

  return Math.ceil(deckCount / getTierCardColumns(canvasWidth));
};

export const getTierRowHeight = (
  deckCount: number,
  canvasWidth = EXPORT_CANVAS_WIDTH,
) => {
  const deckRows = getTierDeckRows(deckCount, canvasWidth);

  if (deckRows === 0) {
    return TIER_MIN_HEIGHT;
  }

  return Math.max(
    TIER_MIN_HEIGHT,
    EXPORT_PADDING * 2 +
      deckRows * TIER_CARD_HEIGHT +
      Math.max(0, deckRows - 1) * TIER_CARD_GAP,
  );
};

export const getExportCanvasHeight = (
  tiers: Pick<Tier, 'decks'>[],
  canvasWidth = EXPORT_CANVAS_WIDTH,
) => (
  EXPORT_TITLE_HEIGHT +
  tiers.reduce((height, tier) => height + getTierRowHeight(tier.decks.length, canvasWidth), 0) +
  EXPORT_FOOTER_HEIGHT
);

export const getTierCardPosition = (
  index: number,
  rowTop: number,
  canvasWidth = EXPORT_CANVAS_WIDTH,
) => {
  const columns = getTierCardColumns(canvasWidth);
  const column = index % columns;
  const row = Math.floor(index / columns);

  return {
    x: TIER_LABEL_OUTER_WIDTH + EXPORT_PADDING + column * (TIER_CARD_WIDTH + TIER_CARD_GAP),
    y: rowTop + EXPORT_PADDING + row * (TIER_CARD_HEIGHT + TIER_CARD_GAP),
  };
};
