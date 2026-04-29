import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Deck } from '../types';
import { useI18n } from '../i18n';
import { getDeckDisplayName } from '../utils/deckName';

type TierItemProps = {
  deck: Deck;
  index: number;
  tierIndex: number;
  tierName: string;
  tierDeckCount: number;
  moveDeck: (dragIndex: number, hoverIndex: number, dragTierIndex: number, hoverTierIndex: number) => void;
  moveDeckFromAvailableDecks: (deck: Deck, hoverTierIndex: number, hoverIndex?: number) => void;
  moveDeckToAvailableDecks: (deck: Deck, sourceTierIndex: number, hoverIndex?: number) => void;
  moveTierDeckByKeyboard: (deck: Deck, tierIndex: number, action: TierKeyboardAction) => void;
  focusedDeckId: string | null;
}

export type TierKeyboardAction =
  | 'move-left'
  | 'move-right'
  | 'move-up'
  | 'move-down'
  | 'move-home'
  | 'move-end'
  | 'move-to-available';

const keyToKeyboardAction = (key: string): TierKeyboardAction | null => {
  switch (key) {
    case 'ArrowLeft':
      return 'move-left';
    case 'ArrowRight':
      return 'move-right';
    case 'ArrowUp':
      return 'move-up';
    case 'ArrowDown':
      return 'move-down';
    case 'Home':
      return 'move-home';
    case 'End':
      return 'move-end';
    case 'Backspace':
    case 'Delete':
      return 'move-to-available';
    default:
      return null;
  }
};

const TierItem: React.FC<TierItemProps> = ({
  deck,
  index,
  tierIndex,
  tierName,
  tierDeckCount,
  moveDeck,
  moveDeckFromAvailableDecks,
  moveDeckToAvailableDecks,
  moveTierDeckByKeyboard,
  focusedDeckId,
}) => {
  const i18n = useI18n();
  const ref = React.useRef<HTMLDivElement>(null);
  const deckDisplayName = getDeckDisplayName(deck, i18n.language);
  const [, drop] = useDrop({
    accept: 'deck',
    drop: () => ({ moved: true }),
    hover(item: { deck: Deck; index: number; tierIndex: number }) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      const dragTierIndex = item.tierIndex;
      const hoverTierIndex = tierIndex;

      if (dragIndex === hoverIndex && dragTierIndex === hoverTierIndex) {
        return;
      }

      if (dragTierIndex === -1) {
        moveDeckFromAvailableDecks(item.deck, hoverTierIndex, hoverIndex);
      } else {
        moveDeck(dragIndex, hoverIndex, dragTierIndex, hoverTierIndex);
      }

      item.index = hoverIndex;
      item.tierIndex = hoverTierIndex;
    },
  });

  const [{ isDraggingItem }, drag, preview] = useDrag({
    type: 'deck',
    item: { deck, index, tierIndex },
    collect: (monitor) => ({
      isDraggingItem: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (!didDrop && item.tierIndex === tierIndex) {
        moveDeckToAvailableDecks(item.deck, tierIndex);
      }
    },
  });

  React.useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  React.useEffect(() => {
    if (focusedDeckId === deck.id) {
      ref.current?.focus();
    }
  }, [deck.id, focusedDeckId]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const action = keyToKeyboardAction(event.key);

    if (!action) {
      return;
    }

    event.preventDefault();
    moveTierDeckByKeyboard(deck, tierIndex, action);
  };

  drag(drop(ref));

  return (
    <div
      ref={ref}
      title={deckDisplayName}
      role="button"
      tabIndex={0}
      aria-label={`${deckDisplayName}, ${tierName}, position ${index + 1} of ${tierDeckCount}`}
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End Delete Backspace"
      onKeyDown={handleKeyDown}
      className={`tier-item relative cursor-grab overflow-hidden rounded-sm border border-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 ${isDraggingItem ? 'border-blue-500 opacity-50' : ''}`}
    >
      <img src={deck.image} alt={deckDisplayName} className="h-[90px] w-[160px] object-cover" />
      <span className='block text-center w-full absolute left-0 bottom-0 p-1 text-sm font-bold text-white bg-[#000000cc]'>{deckDisplayName}</span>
    </div>
  );
};

export default TierItem;
