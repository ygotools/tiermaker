import React, { useCallback, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Deck } from '../types';
import { useDragContext } from '../context/useDragContext'; // コンテキストのインポート

type AvailableDecksProps = {
  decks: Deck[];
  moveAvailableDeck: (dragIndex: number, hoverIndex: number) => void;
  moveDeckToAvailableDecks: (deck: Deck, sourceTierIndex: number, hoverIndex?: number) => void;
  addDeck: (deck: Deck) => void;
}

const createDeckId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `custom-${Date.now()}`;
};

const AvailableDecks: React.FC<AvailableDecksProps> = ({ decks, moveAvailableDeck, moveDeckToAvailableDecks, addDeck }) => {
  const [inputThemeName, setInputThemeName] = React.useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newDeckName, setNewDeckName] = React.useState('');
  const [newDeckIcon, setNewDeckIcon] = React.useState('');
  const [formError, setFormError] = React.useState('');

  const DEFAULT_THEME_IMAGE = '/static/deckimages/others_01.png';

  const handleInputThemeName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputThemeName(e.target.value);
  }, []);

  const resetCreateForm = useCallback(() => {
    setNewDeckName('');
    setNewDeckIcon('');
    setFormError('');
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsCreateModalOpen(false);
    resetCreateForm();
  }, [resetCreateForm]);

  const handleCreateTheme = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = newDeckName.trim();
    if (!normalizedName) {
      setFormError('テーマ名を入力してください。');
      return;
    }

    if (decks.some((deck) => deck.name === normalizedName)) {
      setFormError('同じテーマ名が既に存在します。');
      return;
    }

    addDeck({
      id: createDeckId(),
      name: normalizedName,
      image: newDeckIcon || DEFAULT_THEME_IMAGE,
    });
    handleCloseModal();
  }, [addDeck, decks, handleCloseModal, newDeckIcon, newDeckName]);

  const handleIconFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewDeckIcon(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const filteredDecks = decks
    .map((deck, index) => ({ deck, index }))
    .filter(({ deck }) => deck.name.includes(inputThemeName));

  return (
    <div className='available-decks-container rounded overflow-hidden'>
      <div className="overflow-x-auto whitespace-nowrap p-4 bg-gray-800 flex gap-4 flex-nowrap">
        <button
          type="button"
          className="w-40 min-w-40 max-w-40 h-24 rounded-sm border-2 border-dashed border-gray-500 text-4xl text-gray-200 hover:border-white hover:text-white transition-colors"
          aria-label="テーマを追加"
          onClick={() => setIsCreateModalOpen(true)}
        >
          +
        </button>
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
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-10 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-800 rounded-md border border-gray-600 p-4 text-white">
            <h2 className="text-lg font-bold mb-3">テーマを追加</h2>
            <form onSubmit={handleCreateTheme}>
              <label className="block mb-2 text-sm">テーマ名</label>
              <input
                type="text"
                value={newDeckName}
                onChange={(event) => setNewDeckName(event.target.value)}
                className="w-full rounded p-2 text-black mb-3"
                placeholder="例: 新テーマ"
              />

              <label className="block mb-2 text-sm">アイコン画像URL（任意）</label>
              <input
                type="url"
                value={newDeckIcon}
                onChange={(event) => setNewDeckIcon(event.target.value)}
                className="w-full rounded p-2 text-black mb-3"
                placeholder="https://..."
              />

              <label className="block mb-2 text-sm">またはローカル画像を選択（任意）</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleIconFileInput}
                className="w-full mb-3"
              />

              {formError && (
                <p className="text-red-300 text-sm mb-3">{formError}</p>
              )}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={handleCloseModal} className="px-3 py-1 border border-gray-500 rounded">
                  キャンセル
                </button>
                <button type="submit" className="px-3 py-1 border border-blue-400 text-blue-300 rounded">
                  追加
                </button>
              </div>
            </form>
          </div>
        </div>
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
