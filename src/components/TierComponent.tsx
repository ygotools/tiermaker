import React from 'react';
import { useDrop } from 'react-dnd';
import TierItem, { type TierKeyboardAction } from './TierItem';
import { Tier, Deck } from '../types';
import { useI18n } from '../i18n';

type TierComponentProps = {
  tier: Tier;
  tierIndex: number;
  moveDeck: (dragIndex: number, hoverIndex: number, dragTierIndex: number, hoverTierIndex: number) => void;
  moveDeckFromAvailableDecks: (deck: Deck, hoverTierIndex: number, hoverIndex?: number) => void;
  moveDeckToAvailableDecks: (deck: Deck, sourceTierIndex: number, hoverIndex?: number) => void;
  moveTierDeckByKeyboard: (deck: Deck, tierIndex: number, action: TierKeyboardAction) => void;
  focusedDeckId: string | null;
}

const tierColors = ['bg-red-500', 'bg-orange-500', 'bg-green-500', 'bg-blue-500', 'bg-gray-500'];

const TierComponent: React.FC<TierComponentProps> = ({
  tier,
  tierIndex,
  moveDeck,
  moveDeckFromAvailableDecks,
  moveDeckToAvailableDecks,
  moveTierDeckByKeyboard,
  focusedDeckId,
}) => {
  const i18n = useI18n();
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
    <div
      className="tier mb-2 flex w-full flex-col md:flex-row export-md:flex-row"
      data-tier-index={tierIndex}
      ref={tierDrop as unknown as React.Ref<HTMLDivElement>}
      style={{ minHeight: '100px' }}
    >
      <div className={`tier-label ${tierColors[tierIndex]} my-2 flex h-8 w-full items-center justify-center rounded-sm font-bold text-white md:m-2 md:h-12 md:w-24 md:shrink-0 export-md:h-12 export-md:w-24`}>
        {tier.name}
      </div>
      <div className="flex w-full flex-wrap content-start gap-2 pb-2 md:px-2 md:py-2">
        {tier.decks.map((deck, index) => (
          <TierItem
            key={deck.id}
            deck={deck}
            index={index}
            tierIndex={tierIndex}
            tierName={tier.name}
            tierDeckCount={tier.decks.length}
            moveDeck={moveDeck}
            moveDeckFromAvailableDecks={moveDeckFromAvailableDecks}
            moveDeckToAvailableDecks={moveDeckToAvailableDecks}
            moveTierDeckByKeyboard={moveTierDeckByKeyboard}
            focusedDeckId={focusedDeckId}
          />
        ))}
        {tier.decks.length === 0 && (
          <div className="w-full">
            <div className="empty-placeholder flex h-[calc(6rem-4px)] w-full items-center justify-center border border-dashed border-gray-300 text-gray-500">
              {i18n.t('tier.emptyPlaceholder')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TierComponent;
