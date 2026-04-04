import React, { useCallback, useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import TierComponent from './TierComponent';
import AvailableDecks from './AvailableDecks';
import { Deck, Tier } from '../types';
import { exportAsImage } from '../utils/exportImage';
import {
  moveAvailableDeckState,
  moveDeckFromAvailableDecksState,
  moveDeckToAvailableDecksState,
} from '../utils/tierListState';
import {
  loadTierListSnapshot,
  saveTierListSnapshot,
} from '../utils/tierListStorage';
import GlobalDropZone from './GlobalDropZone';
import { DownloadIcon } from './Icon';
import { DragProvider } from '../context/DragContext';

const TierList: React.FC = () => {
  const [{ tiers: initialTiers, availableDecks: initialAvailableDecks }] = useState(() => loadTierListSnapshot());
  const [tiers, setTiers] = useState<Tier[]>(initialTiers);
  const [availableDecks, setAvailableDecks] = useState<Deck[]>(initialAvailableDecks);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    saveTierListSnapshot({ tiers, availableDecks });
  }, [tiers, availableDecks]);

  const moveDeck = useCallback((dragIndex: number, hoverIndex: number, dragTierIndex: number, hoverTierIndex: number) => {
    const newTiers = [...tiers];
    const dragTier = newTiers[dragTierIndex];
    const hoverTier = newTiers[hoverTierIndex];
    const [movedDeck] = dragTier.decks.splice(dragIndex, 1);

    hoverTier.decks.splice(hoverIndex, 0, movedDeck);

    setTiers(newTiers);
  }, [tiers]);

  const moveDeckFromAvailableDecks = useCallback((deck: Deck, hoverTierIndex: number, hoverIndex?: number) => {
    setAvailableDecks((prevAvailableDecks) => {
      const nextState = moveDeckFromAvailableDecksState(tiers, prevAvailableDecks, deck, hoverTierIndex, hoverIndex);
      setTiers(nextState.tiers);
      return nextState.availableDecks;
    });
  }, [tiers]);

  const moveDeckToAvailableDecks = useCallback((deck: Deck, sourceTierIndex: number, hoverIndex = 0) => {
    setAvailableDecks((prevAvailableDecks) => {
      const nextState = moveDeckToAvailableDecksState(tiers, prevAvailableDecks, deck, sourceTierIndex, hoverIndex);
      setTiers(nextState.tiers);
      return nextState.availableDecks;
    });
  }, [tiers]);

  const moveAvailableDeck = useCallback((dragIndex: number, hoverIndex: number) => {
    setAvailableDecks((prevAvailableDecks) => moveAvailableDeckState(prevAvailableDecks, dragIndex, hoverIndex));
  }, []);

  const addCustomDeck = useCallback((deck: Deck) => {
    setAvailableDecks((prev) => [...prev, deck]);
  }, []);

  const handleExport = useCallback(async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      await exportAsImage({ tiers });
    } catch (error) {
      console.error('Failed to export the tier list image.', error);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, tiers]);

  return (
    <DragProvider>
      <DndProvider backend={HTML5Backend}>
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
              moveAvailableDeck={moveAvailableDeck}
              moveDeckToAvailableDecks={moveDeckToAvailableDecks}
              addCustomDeck={addCustomDeck}
            />
          </div>
          <div className="w-full max-w-[816px]">
            <div className="flex pt-4 justify-center items-center">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                aria-busy={isExporting}
                className={`w-[calc(50%-8px)] h-20 text-xl download-button leading-none py-2 flex items-center justify-center appearance-none transition-all text-blue-500 font-bold border-2 border-blue-500 hover:border-bg-blue-600 bg-transparent hover:bg-blue-500 hover:bg-opacity-20 ${isExporting ? 'cursor-wait opacity-60' : ''}`}
              >
                <DownloadIcon className="w-6 h-6" />
                <span className="inline-block ml-2">{isExporting ? 'Exporting...' : 'Export image'}</span>
              </button>
              {/* <div id="share-button" className='w-[calc(50%-8px)] h-20'>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('繝槭せ繧ｿ繝ｼ繝・Η繧ｨ繝ｫ縺ｮTier陦ｨ繧剃ｽ懊▲縺溘ｈ・・)}&url=${encodeURIComponent('https://tier.ygotools.com/')}&hashtags=${encodeURIComponent('驕頑葦邇九・繧ｹ繧ｿ繝ｼ繝・Η繧ｨ繝ｫ,TIERMAKERFORMD')}`} target='_blank' className="relative overflow-hidden w-full h-full text-2xl flex items-center justify-center appearance-none border-2 border-white text-white">
                  Share to X
                </a>
              </div> */}
            </div>
          </div>
        </GlobalDropZone>
      </DndProvider>
    </DragProvider>
  );
};

export default TierList;
