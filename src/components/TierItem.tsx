import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Deck } from '../types';

type TierItemProps = {
  deck: Deck;
  index: number;
  tierIndex: number;
  moveDeck: (dragIndex: number, hoverIndex: number, dragTierIndex: number, hoverTierIndex: number) => void;
  moveDeckFromAvailableDecks: (deck: Deck, hoverTierIndex: number, hoverIndex?: number) => void;
  moveDeckToAvailableDecks: (deck: Deck, sourceTierIndex: number, hoverIndex?: number) => void;
}

const TierItem: React.FC<TierItemProps> = ({ deck, index, tierIndex, moveDeck, moveDeckFromAvailableDecks, moveDeckToAvailableDecks }) => {
  const ref = React.useRef<HTMLDivElement>(null);
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

  return (
    <div ref={ref} title={deck.name} className={`tier-item relative m-2 cursor-grab border border-gray-700 ${isDraggingItem ? 'border-blue-500 opacity-50' : ''}`}>
      <img src={deck.image} alt={deck.name} className="w-[160px] h-[90px] object-cover rounded-sm overflow-hidden" />
      <span className='block text-center w-full absolute left-0 bottom-0 p-1 text-sm font-bold text-white bg-[#000000cc]'>{deck.name}</span>
    </div>
  );
};

export default TierItem;
