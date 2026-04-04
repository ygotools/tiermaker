import React from 'react';
import { useDrop } from 'react-dnd';
import TierItem from './TierItem';
import { Tier, Deck } from '../types';

type TierComponentProps = {
  tier: Tier;
  tierIndex: number;
  moveDeck: (dragIndex: number, hoverIndex: number, dragTierIndex: number, hoverTierIndex: number) => void;
  moveDeckFromAvailableDecks: (deck: Deck, hoverTierIndex: number, hoverIndex?: number) => void;
  moveDeckToAvailableDecks: (deck: Deck, sourceTierIndex: number, hoverIndex?: number) => void;
}

const tierColors = ['bg-red-500', 'bg-orange-500', 'bg-green-500', 'bg-blue-500', 'bg-gray-500'];

const TierComponent: React.FC<TierComponentProps> = ({ tier, tierIndex, moveDeck, moveDeckFromAvailableDecks, moveDeckToAvailableDecks }) => {
  const [, tierDrop] = useDrop({
    accept: 'deck',
    drop: (item: { deck: Deck, index: number; tierIndex: number }, monitor) => {
      if (monitor.didDrop()) {
        return;
      }

      if (item.tierIndex === -1) { // AvailableDecksからのドロップ
        moveDeckFromAvailableDecks(item.deck, tierIndex);
      } else if (item.tierIndex !== tierIndex) {
        moveDeck(item.index, tier.decks.length, item.tierIndex, tierIndex);
      } else if (tier.decks.length === 0) {
        moveDeck(item.index, 0, item.tierIndex, tierIndex);
      }
    },
  });

  return (
    <div className="flex export-md:flex-row md:flex-row flex-col tier w-full " data-tier-index={tierIndex} ref={tierDrop as unknown as React.Ref<HTMLDivElement>} style={{ minHeight: '100px' }}>
      <div className={`tier-label ${tierColors[tierIndex]} m-2 flex h-8 w-[calc(100%-16px)] items-center justify-center rounded-sm font-bold text-white md:h-12 md:w-24 export-md:w-24 export-md:h-12`}>
        {tier.name}
      </div>
      <div className="flex flex-wrap w-full">
        {tier.decks.map((deck, index) => (
          <TierItem
            key={deck.id}
            deck={deck}
            index={index}
            tierIndex={tierIndex}
            moveDeck={moveDeck}
            moveDeckFromAvailableDecks={moveDeckFromAvailableDecks}
            moveDeckToAvailableDecks={moveDeckToAvailableDecks}
          />
        ))}
        {tier.decks.length === 0 && (
          <div className='p-2 w-full'>
            <div className="empty-placeholder w-full h-[calc(6rem-4px)] flex items-center justify-center text-gray-500 border border-dashed border-gray-300">
              ドラッグしてここにデッキを追加
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TierComponent;
