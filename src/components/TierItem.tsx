import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Deck } from '../types';

type TierItemProps = {
  deck: Deck;
  index: number;
  tierIndex: number;
  moveDeck: (dragIndex: number, hoverIndex: number, dragTierIndex: number, hoverTierIndex: number) => void;
  moveDeckFromAvailableDecks: (deck: Deck, hoverTierIndex: number, hoverIndex?: number) => void;
  moveDeckToAvailableDecks: (deck: Deck, sourceTierIndex: number) => void;
}

const TierItem: React.FC<TierItemProps> = ({ deck, index, tierIndex, moveDeck, moveDeckFromAvailableDecks, moveDeckToAvailableDecks }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const lastTouchTargetRef = React.useRef<string>('');
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

  const [{ isDraggingItem }, drag] = useDrag({
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

  drag(drop(ref));

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    event.preventDefault();
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    if (!targetElement) {
      return;
    }

    const tierItem = targetElement.closest('[data-tier-index][data-item-index]') as HTMLElement | null;
    if (tierItem) {
      const hoverTierIndex = Number(tierItem.dataset.tierIndex);
      const hoverIndex = Number(tierItem.dataset.itemIndex);
      const targetKey = `tier-item-${hoverTierIndex}-${hoverIndex}`;
      if (targetKey === lastTouchTargetRef.current) {
        return;
      }
      lastTouchTargetRef.current = targetKey;

      if (hoverTierIndex === tierIndex && hoverIndex === index) {
        return;
      }

      moveDeck(index, hoverIndex, tierIndex, hoverTierIndex);
      return;
    }

    const tierContainer = targetElement.closest('[data-tier-container-index]') as HTMLElement | null;
    if (tierContainer) {
      const hoverTierIndex = Number(tierContainer.dataset.tierContainerIndex);
      const targetKey = `tier-container-${hoverTierIndex}`;
      if (targetKey === lastTouchTargetRef.current || hoverTierIndex === tierIndex) {
        return;
      }
      lastTouchTargetRef.current = targetKey;
      moveDeck(index, Number.MAX_SAFE_INTEGER, tierIndex, hoverTierIndex);
      return;
    }

    const availableItem = targetElement.closest('[data-available-index]') as HTMLElement | null;
    if (availableItem) {
      const hoverIndex = Number(availableItem.dataset.availableIndex);
      const targetKey = `available-item-${hoverIndex}`;
      if (targetKey === lastTouchTargetRef.current) {
        return;
      }
      lastTouchTargetRef.current = targetKey;
      moveDeckToAvailableDecks(deck, tierIndex);
      return;
    }

    const availableContainer = targetElement.closest('[data-available-container]') as HTMLElement | null;
    if (availableContainer) {
      const targetKey = 'available-container';
      if (targetKey === lastTouchTargetRef.current) {
        return;
      }
      lastTouchTargetRef.current = targetKey;
      moveDeckToAvailableDecks(deck, tierIndex);
    }
  };

  const handleTouchEnd = () => {
    lastTouchTargetRef.current = '';
  };

  return (
    <div
      ref={ref}
      data-tier-index={tierIndex}
      data-item-index={index}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`tier-item m-2 ${isDraggingItem ? 'opacity-50 border-blue-500' : ''} cursor-grab touch-none relative border border-gray-700`}
    >
      <img src={deck.image} alt={deck.name} className="w-[160px] h-[90px] object-cover rounded-sm overflow-hidden" />
      <span className='block text-center w-full absolute left-0 bottom-0 p-1 text-sm font-bold text-white bg-[#000000cc]'>{deck.name}</span>
    </div>
  );
};

export default TierItem;
