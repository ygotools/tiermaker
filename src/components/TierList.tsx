import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Copy, RotateCcw, Share2 } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import AvailableDecks, { type AvailableDeckKeyboardAction } from './AvailableDecks';
import DragPreviewLayer from './DragPreviewLayer';
import GlobalDropZone from './GlobalDropZone';
import { DownloadIcon } from './Icon';
import type { TierKeyboardAction } from './TierItem';
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
  clearTierListShareQuery,
  createXShareText,
  createDefaultTierListSnapshot,
  createTierListShareUrl,
  hasTierListShareQuery,
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
  const skipInitialSave = useRef(hasTierListShareQuery());
  const [isExporting, setIsExporting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
  const [focusedDeckId, setFocusedDeckId] = useState<string | null>(null);
  const { tiers, availableDecks } = snapshot;
  const allDecks = [...tiers.flatMap((tier) => tier.decks), ...availableDecks];
  const useTouchBackend = isTouchPrimaryDevice();
  const shareUrl = createTierListShareUrl(tiers);
  const shareText = createXShareText({
    intro: i18n.t('tierList.shareIntro'),
    hashtags: i18n.t('tierList.shareHashtags'),
    url: shareUrl,
  });
  const xShareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  useEffect(() => {
    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }

    clearTierListShareQuery();
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

  const moveAvailableDeckByKeyboard = useCallback((
    deck: Deck,
    index: number,
    action: AvailableDeckKeyboardAction,
    targetAvailableDeckIndex?: number,
  ) => {
    setFocusedDeckId(deck.id);
    setSnapshot((prevSnapshot) => {
      const availableDeckIndex = prevSnapshot.availableDecks.findIndex((candidate) => candidate.id === deck.id);
      const sourceIndex = availableDeckIndex === -1 ? index : availableDeckIndex;

      if (sourceIndex < 0 || sourceIndex >= prevSnapshot.availableDecks.length) {
        return prevSnapshot;
      }

      const moveWithinAvailableDecks = () => {
        if (
          targetAvailableDeckIndex === undefined ||
          targetAvailableDeckIndex < 0 ||
          targetAvailableDeckIndex >= prevSnapshot.availableDecks.length ||
          targetAvailableDeckIndex === sourceIndex
        ) {
          return prevSnapshot;
        }

        return {
          ...prevSnapshot,
          availableDecks: moveAvailableDeckState(prevSnapshot.availableDecks, sourceIndex, targetAvailableDeckIndex),
        };
      };

      if (
        action === 'move-left' ||
        action === 'move-right' ||
        action === 'move-home' ||
        action === 'move-end'
      ) {
        return moveWithinAvailableDecks();
      }

      if (action === 'move-to-last-tier') {
        const targetTierIndex = prevSnapshot.tiers.length - 1;

        if (targetTierIndex < 0) {
          return prevSnapshot;
        }

        return moveDeckFromAvailableDecksState(
          prevSnapshot.tiers,
          prevSnapshot.availableDecks,
          prevSnapshot.availableDecks[sourceIndex],
          targetTierIndex,
        );
      }

      return prevSnapshot;
    });
  }, []);

  const moveTierDeckByKeyboard = useCallback((deck: Deck, tierIndex: number, action: TierKeyboardAction) => {
    setFocusedDeckId(deck.id);
    setSnapshot((prevSnapshot) => {
      const sourceTier = prevSnapshot.tiers[tierIndex];
      const currentIndex = sourceTier?.decks.findIndex((candidate) => candidate.id === deck.id) ?? -1;

      if (!sourceTier || currentIndex === -1) {
        return prevSnapshot;
      }

      const moveWithinTier = (targetIndex: number) => {
        if (targetIndex === currentIndex) {
          return prevSnapshot;
        }

        return {
          ...prevSnapshot,
          tiers: moveDeckState(prevSnapshot.tiers, currentIndex, targetIndex, tierIndex, tierIndex),
        };
      };

      if (action === 'move-left') {
        return moveWithinTier(Math.max(0, currentIndex - 1));
      }

      if (action === 'move-right') {
        return moveWithinTier(Math.min(sourceTier.decks.length - 1, currentIndex + 1));
      }

      if (action === 'move-home') {
        return moveWithinTier(0);
      }

      if (action === 'move-end') {
        return moveWithinTier(sourceTier.decks.length - 1);
      }

      if (action === 'move-up' || action === 'move-down') {
        const targetTierIndex = action === 'move-up' ? tierIndex - 1 : tierIndex + 1;
        const targetTier = prevSnapshot.tiers[targetTierIndex];

        if (!targetTier) {
          return prevSnapshot;
        }

        return {
          ...prevSnapshot,
          tiers: moveDeckState(
            prevSnapshot.tiers,
            currentIndex,
            Math.min(currentIndex, targetTier.decks.length),
            tierIndex,
            targetTierIndex,
          ),
        };
      }

      if (action === 'move-to-available') {
        return moveDeckToAvailableDecksState(
          prevSnapshot.tiers,
          prevSnapshot.availableDecks,
          deck,
          tierIndex,
        );
      }

      return prevSnapshot;
    });
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

  const handleCopyShareUrl = useCallback(async () => {
    if (typeof navigator === 'undefined' || typeof navigator.clipboard?.writeText !== 'function') {
      setFeedbackMessage({
        type: 'error',
        text: i18n.t('tierList.copyShareUrlError'),
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setFeedbackMessage({
        type: 'success',
        text: i18n.t('tierList.copyShareUrlSuccess'),
      });
    } catch {
      setFeedbackMessage({
        type: 'error',
        text: i18n.t('tierList.copyShareUrlError'),
      });
    }
  }, [i18n, shareUrl]);

  const handleReset = useCallback(() => {
    if (typeof window !== 'undefined' && !window.confirm(i18n.t('tierList.resetConfirmation'))) {
      return;
    }

    setSnapshot(createDefaultTierListSnapshot());
  }, [i18n]);

  return (
    <DndProvider
      backend={useTouchBackend ? TouchBackend : HTML5Backend}
      options={useTouchBackend ? { enableMouseEvents: true, delayTouchStart: 0 } : undefined}
    >
      <DragPreviewLayer />
      <GlobalDropZone moveDeckToAvailableDecks={moveDeckToAvailableDecks}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div id="tier-list-container" className="tier-list mx-auto mb-2 w-full">
            {tiers.map((tier, tierIndex) => (
              <TierComponent
                key={tier.name}
                tier={tier}
                tierIndex={tierIndex}
                moveDeck={moveDeck}
                moveDeckFromAvailableDecks={moveDeckFromAvailableDecks}
                moveDeckToAvailableDecks={moveDeckToAvailableDecks}
                moveTierDeckByKeyboard={moveTierDeckByKeyboard}
                focusedDeckId={focusedDeckId}
              />
            ))}
          </div>
          <AvailableDecks
            decks={availableDecks}
            allDecks={allDecks}
            focusedDeckId={focusedDeckId}
            moveAvailableDeck={moveAvailableDeck}
            moveDeckToAvailableDecks={moveDeckToAvailableDecks}
            moveAvailableDeckByKeyboard={moveAvailableDeckByKeyboard}
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
              role={feedbackMessage.type === 'error' ? 'alert' : 'status'}
              aria-live={feedbackMessage.type === 'error' ? 'assertive' : 'polite'}
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:flex md:w-auto">
              <button
                type="button"
                onClick={handleCopyShareUrl}
                className="inline-flex min-h-16 min-w-0 items-center justify-center gap-2 whitespace-normal border border-white/20 px-4 py-3 text-center text-sm font-medium leading-tight text-white/80 transition-colors hover:border-white/40 hover:text-white md:px-6 md:py-0"
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                {i18n.t('tierList.copyShareUrl')}
              </button>
              <a
                href={xShareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-16 min-w-0 items-center justify-center gap-2 whitespace-normal border border-white/20 px-4 py-3 text-center text-sm font-medium leading-tight text-white/80 transition-colors hover:border-white/40 hover:text-white md:px-6 md:py-0"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                {i18n.t('tierList.shareOnX')}
              </a>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-16 min-w-0 items-center justify-center gap-2 whitespace-normal border border-white/20 px-4 py-3 text-center text-sm font-medium leading-tight text-white/80 transition-colors hover:border-white/40 hover:text-white md:px-6 md:py-0"
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
