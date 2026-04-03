import React, { useCallback, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Deck } from '../types';
import { useDragContext } from '../context/useDragContext'; // コンテキストのインポート

type AvailableDecksProps = {
  decks: Deck[];
  moveAvailableDeck: (dragIndex: number, hoverIndex: number) => void;
  moveDeckToAvailableDecks: (deck: Deck, sourceTierIndex: number, hoverIndex?: number) => void;
}

const AvailableDecks: React.FC<AvailableDecksProps> = ({ decks, moveAvailableDeck, moveDeckToAvailableDecks }) => {
  const [inputThemeName, setInputThemeName] = React.useState<string>('');
  const handleInputThemeName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputThemeName(e.target.value);
  }, []);
  const filteredDecks = decks
    .map((deck, index) => ({ deck, index }))
    .filter(({ deck }) => deck.name.includes(inputThemeName));

  return (
    <div className='available-decks-container rounded overflow-hidden'>
      <div className="overflow-x-auto whitespace-nowrap p-4 bg-gray-800 flex gap-4 flex-nowrap">
        {filteredDecks.map(({ deck, index }) => (
          <AvailableDeckItem
            key={deck.name}
            deck={deck}
            index={index}
            moveAvailableDeck={moveAvailableDeck}
            moveDeckToAvailableDecks={moveDeckToAvailableDecks}
          />
        ))}
        {(decks.length !== 0 && filteredDecks.length === 0) && (
          <div className='p-2 w-full'>
            <div className="empty-placeholder w-full h-24 flex items-center justify-center text-gray-500 border border-dashed border-gray-300">
              &nbsp;
            </div>
          </div>
        )}
        {decks.length === 0 && (
          <div className='p-2 w-full'>
            <div className="empty-placeholder rounded-sm w-full h-24 flex items-center justify-center text-gray-300 border border-dashed border-gray-300">
              ドラッグしてここにデッキを追加
            </div>
          </div>
        )}
      </div>
      <div className='w-full p-4 bg-gray-700 text-white'>
        <input type="text" className='w-full rounded overflow-hidden p-2 text-black' placeholder='テーマ名で絞り込む' onInput={handleInputThemeName} />
      </div>
    </div>
  );
};

const AvailableDeckItem: React.FC<{
  deck: Deck;
  index: number;
  moveAvailableDeck: (dragIndex: number, hoverIndex: number) => void;
  moveDeckToAvailableDecks: (deck: Deck, sourceTierIndex: number, hoverIndex?: number) => void;
}> = ({ deck, index, moveAvailableDeck, moveDeckToAvailableDecks }) => {
  const { setDragging } = useDragContext();
  const ref = React.useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: 'deck',
    drop: () => ({ moved: true }),
    hover(item: { deck: Deck; index: number; tierIndex: number }) {
      if (!ref.current) {
        return;
      }

      if (item.tierIndex === -1) {
        moveAvailableDeck(item.index, index);
      } else {
        moveDeckToAvailableDecks(item.deck, item.tierIndex, index);
      }

      item.index = index;
      item.tierIndex = -1;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'deck',
    item: { deck, index, tierIndex: -1 },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    setDragging(isDragging);
  }, [isDragging, setDragging]);

  drag(drop(ref));

  return (
    <div ref={ref} className={`inline-block ${isDragging ? 'opacity-50' : ''} relative cursor-grab border border-gray-700`}>
      <img src={deck.image} alt={deck.name} className="w-40 min-w-40 max-w-40 h-24 object-cover rounded-sm overflow-hidden" />
      <span className='block text-center w-full absolute left-0 bottom-0 p-1 text-sm font-bold text-white bg-[#000000cc]'>{deck.name}</span>
    </div>
  );
};

export default AvailableDecks;
