import React, { useCallback, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Deck } from '../types';
import { useDragContext } from '../context/useDragContext'; // コンテキストのインポート
import CustomThemeModal from './CustomThemeModal';

type AvailableDecksProps = {
  decks: Deck[];
  moveAvailableDeck: (dragIndex: number, hoverIndex: number) => void;
  moveDeckToAvailableDecks: (deck: Deck, sourceTierIndex: number, hoverIndex?: number) => void;
  addCustomDeck: (deck: Deck) => void;
}

const AvailableDecks: React.FC<AvailableDecksProps> = ({ decks, moveAvailableDeck, moveDeckToAvailableDecks, addCustomDeck }) => {
  const [inputThemeName, setInputThemeName] = React.useState<string>('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleInputThemeName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputThemeName(e.target.value);
  }, []);
  const filteredDecks = decks
    .map((deck, index) => ({ deck, index }))
    .filter(({ deck }) => deck.name.includes(inputThemeName));

  return (
    <div className='available-decks-container rounded overflow-hidden'>
      <div className="overflow-x-auto whitespace-nowrap p-4 bg-gray-800 flex gap-4 flex-nowrap items-center">
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
          <div className='p-2 flex-1'>
            <div className="empty-placeholder rounded-sm w-full h-24 flex items-center justify-center text-gray-300 border border-dashed border-gray-300">
              ドラッグしてここにデッキを追加
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex-shrink-0 w-16 h-24 flex items-center justify-center border-2 border-dashed border-gray-500 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors rounded text-3xl font-light"
          title="カスタムテーマを追加"
        >
          +
        </button>
      </div>
      <div className='w-full p-4 bg-gray-700 text-white'>
        <input type="text" className='w-full rounded overflow-hidden p-2 text-black' placeholder='テーマ名で絞り込む' onInput={handleInputThemeName} />
      </div>
      {isModalOpen && (
        <CustomThemeModal
          onAdd={addCustomDeck}
          onClose={() => setIsModalOpen(false)}
        />
      )}
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
