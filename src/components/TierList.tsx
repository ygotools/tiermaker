import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, RotateCcw, Share2 } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import AvailableDecks from './AvailableDecks';
import DragPreviewLayer from './DragPreviewLayer';
import GlobalDropZone from './GlobalDropZone';
import { DownloadIcon } from './Icon';
import TierComponent from './TierComponent';
import { Deck } from '../types';
import { exportAsImage } from '../utils/exportImage';
import {
  moveAvailableDeckState,
  moveDeckFromAvailableDecksState,
  moveDeckState,
  moveDeckToAvailableDecksState,
} from '../utils/tierListState';
import {
  createDefaultTierListSnapshot,
  createTierListShareText,
  createTierListShareUrl,
  loadTierListSnapshot,
  saveTierListSnapshot,
} from '../utils/tierListStorage';
import { useI18n } from '../i18n';
import { getDeckDisplayName } from '../utils/deckName';

type FeedbackMessage = {
  type: 'success' | 'error';
  text: string;
};

const isTouchPrimaryDevice = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) {
    return true;
  }

  return navigator.maxTouchPoints > 0;
};

const TierList: React.FC = () => {
  const i18n = useI18n();
  const [snapshot, setSnapshot] = useState(() => loadTierListSnapshot());
  const [isExporting, setIsExporting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
  const { tiers, availableDecks } = snapshot;
  const allDecks = [...tiers.flatMap((tier) => tier.decks), ...availableDecks];
  const useTouchBackend = isTouchPrimaryDevice();
  const shareUrl = createTierListShareUrl(tiers);
  const shareText = `${i18n.t('tierList.shareIntro')}\n\n${createTierListShareText(
    tiers,
    (deck) => getDeckDisplayName(deck, i18n.language),
  )}`;
  const xShareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  useEffect(() => {
    saveTierListSnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    if (!feedbackMessage || typeof window === 'undefined') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [feedbackMessage]);

  const moveDeck = useCallback((dragIndex: number, hoverIndex: number, dragTierIndex: number, hoverTierIndex: number) => {
    setSnapshot((prevSnapshot) => ({
      ...prevSnapshot,
      tiers: moveDeckState(prevSnapshot.tiers, dragIndex, hoverIndex, dragTierIndex, hoverTierIndex),
    }));
  }, []);

  const moveDeckFromAvailableDecks = useCallback((deck: Deck, hoverTierIndex: number, hoverIndex?: number) => {
    setSnapshot((prevSnapshot) => (
      moveDeckFromAvailableDecksState(prevSnapshot.tiers, prevSnapshot.availableDecks, deck, hoverTierIndex, hoverIndex)
    ));
  }, []);

  const moveDeckToAvailableDecks = useCallback((deck: Deck, sourceTierIndex: number, hoverIndex = 0) => {
    setSnapshot((prevSnapshot) => (
      moveDeckToAvailableDecksState(prevSnapshot.tiers, prevSnapshot.availableDecks, deck, sourceTierIndex, hoverIndex)
    ));
  }, []);

  const moveAvailableDeck = useCallback((dragIndex: number, hoverIndex: number) => {
    setSnapshot((prevSnapshot) => ({
      ...prevSnapshot,
      availableDecks: moveAvailableDeckState(prevSnapshot.availableDecks, dragIndex, hoverIndex),
    }));
  }, []);

  const handleExport = useCallback(async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      await exportAsImage({ tiers, getDeckName: (deck) => getDeckDisplayName(deck, i18n.language) });
      setFeedbackMessage({
        type: 'success',
        text: i18n.t('tierList.exportSuccess'),
      });
    } catch (error) {
      console.error('Failed to export the tier list image.', error);
      setFeedbackMessage({
        type: 'error',
        text: i18n.t('tierList.exportError'),
      });
    } finally {
      setIsExporting(false);
    }
  }, [i18n, isExporting, tiers]);

  const handleReset = useCallback(() => {
    if (typeof window !== 'undefined' && !window.confirm(i18n.t('tierList.resetConfirmation'))) {
      return;
    }

    setSnapshot(createDefaultTierListSnapshot());
    setFeedbackMessage({
      type: 'success',
      text: i18n.t('tierList.resetSuccess'),
    });
  }, [i18n]);

  return (
    <DndProvider
      backend={useTouchBackend ? TouchBackend : HTML5Backend}
      options={useTouchBackend ? { enableMouseEvents: true, delayTouchStart: 0 } : undefined}
    >
      <DragPreviewLayer />
      <GlobalDropZone moveDeckToAvailableDecks={moveDeckToAvailableDecks}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div id="tier-list-container" className="tier-list mb-2">
            {tiers.map((tier, tierIndex) => (
              <TierComponent
                key={tier.name}
                tier={tier}
                tierIndex={tierIndex}
                moveDeck={moveDeck}
                moveDeckFromAvailableDecks={moveDeckFromAvailableDecks}
                moveDeckToAvailableDecks={moveDeckToAvailableDecks}
              />
            ))}
          </div>
          <AvailableDecks
            decks={availableDecks}
            allDecks={allDecks}
            moveAvailableDeck={moveAvailableDeck}
            moveDeckToAvailableDecks={moveDeckToAvailableDecks}
            addDeck={(deck) => {
              setSnapshot((prevSnapshot) => ({
                ...prevSnapshot,
                availableDecks: [deck, ...prevSnapshot.availableDecks],
              }));
              setFeedbackMessage({
                type: 'success',
                text: i18n.t('tierList.addedTheme')(getDeckDisplayName(deck, i18n.language)),
              });
            }}
          />
        </div>
        <div className="mx-auto w-full max-w-[816px]">
          {feedbackMessage && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-4 flex items-center gap-2 rounded-md border px-4 py-3 text-sm ${
                feedbackMessage.type === 'error'
                  ? 'border-red-400/50 bg-red-500/10 text-red-100'
                  : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-50'
              }`}
            >
              {feedbackMessage.type === 'error'
                ? <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                : <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />}
              {feedbackMessage.text}
            </p>
          )}
          <div className="flex flex-col gap-3 pt-4 md:flex-row md:items-center">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              aria-busy={isExporting}
              className={`download-button flex min-h-16 flex-1 items-center justify-center border-2 border-blue-500 bg-transparent px-6 py-3 text-lg font-bold text-blue-400 transition-all hover:bg-blue-500/15 md:py-0 ${isExporting ? 'cursor-wait opacity-60' : ''}`}
            >
              <DownloadIcon className="h-6 w-6" />
              <span className="ml-2 inline-block">{isExporting ? i18n.t('tierList.exportInProgress') : i18n.t('tierList.exportButton')}</span>
            </button>
            <div className="grid grid-cols-2 gap-3 md:flex md:w-auto">
              <a
                href={xShareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-16 items-center justify-center gap-2 border border-white/20 px-6 text-sm font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                {i18n.t('tierList.shareOnX')}
              </a>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-16 items-center justify-center gap-2 border border-white/20 px-6 text-sm font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {i18n.t('tierList.resetButton')}
              </button>
            </div>
          </div>
        </div>
      </GlobalDropZone>
    </DndProvider>
  );
};

export default TierList;
