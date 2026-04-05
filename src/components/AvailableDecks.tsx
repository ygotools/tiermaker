import React, { useCallback, useEffect } from 'react';
import { PlusCircle, Search, X } from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Deck } from '../types';
import { matchesDeckSearch } from '../utils/deckSearch';
import { useI18n } from '../i18n';
import { getDeckDisplayName } from '../utils/deckName';

type AvailableDecksProps = {
  decks: Deck[];
  allDecks: Deck[];
  moveAvailableDeck: (dragIndex: number, hoverIndex: number) => void;
  moveDeckToAvailableDecks: (deck: Deck, sourceTierIndex: number, hoverIndex?: number) => void;
  addDeck: (deck: Deck) => void;
};

const DEFAULT_THEME_IMAGE = '/static/deckimages/others_01.png';
const DECK_CARD_WIDTH_REM = 10;
const DECK_CARD_GAP_REM = 1;

const createDeckId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `custom-${Date.now()}`;
};

const normalizeDeckName = (name: string) => name.trim().toLocaleLowerCase();

const AvailableDecks: React.FC<AvailableDecksProps> = ({ decks, allDecks, moveAvailableDeck, moveDeckToAvailableDecks, addDeck }) => {
  const i18n = useI18n();
  const [inputThemeName, setInputThemeName] = React.useState('');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newDeckName, setNewDeckName] = React.useState('');
  const [newDeckIcon, setNewDeckIcon] = React.useState('');
  const [formError, setFormError] = React.useState('');

  const handleInputThemeName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInputThemeName(event.target.value);
  }, []);

  const resetCreateForm = useCallback(() => {
    setNewDeckName('');
    setNewDeckIcon('');
    setFormError('');
  }, []);

  const handleOpenModal = useCallback(() => {
    setIsCreateModalOpen(true);
    setFormError('');
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsCreateModalOpen(false);
    resetCreateForm();
  }, [resetCreateForm]);

  useEffect(() => {
    if (!isCreateModalOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCloseModal, isCreateModalOpen]);

  const handleCreateTheme = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = newDeckName.trim();
    if (!normalizedName) {
      setFormError(i18n.t('availableDecks.requiredThemeNameError'));
      return;
    }

    if (allDecks.some((deck) => (
      normalizeDeckName(deck.name) === normalizeDeckName(normalizedName) ||
      normalizeDeckName(deck.nameEn ?? '') === normalizeDeckName(normalizedName)
    ))) {
      setFormError(i18n.t('availableDecks.duplicateThemeError'));
      return;
    }

    addDeck({
      id: createDeckId(),
      name: normalizedName,
      image: newDeckIcon || DEFAULT_THEME_IMAGE,
    });
    handleCloseModal();
  }, [
    addDeck,
    allDecks,
    handleCloseModal,
    i18n,
    newDeckIcon,
    newDeckName,
  ]);

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

  const normalizedSearchTerm = normalizeDeckName(inputThemeName);
  const filteredDecks = decks
    .map((deck, index) => ({ deck, index }))
    .filter(({ deck }) => matchesDeckSearch(deck, normalizedSearchTerm));
  const shouldRevealSearchAction = isSearchFocused || inputThemeName.length > 0;
  const canClearSearch = inputThemeName.length > 0;
  const deckStripMinWidth = decks.length > 0
    ? `max(100%, ${decks.length * DECK_CARD_WIDTH_REM + Math.max(decks.length - 1, 0) * DECK_CARD_GAP_REM}rem)`
    : 'max(100%, 20rem)';

  return (
    <section className="available-decks-container overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow-[0_20px_45px_rgba(0,0,0,0.2)]">
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center justify-between gap-3 md:items-end">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              className="hidden h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium text-blue-200 transition-colors hover:bg-blue-400/10 hover:text-white md:inline-flex"
              onClick={handleOpenModal}
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              {i18n.t('availableDecks.addTheme')}
            </button>
            <p className="text-sm text-gray-300">
              {i18n.t('availableDecks.countLabel')(filteredDecks.length, decks.length)}
            </p>
          </div>
          <div
            className="min-w-0 flex-1 max-w-[14rem] md:grid md:max-w-sm md:items-center md:transition-[grid-template-columns] md:duration-200 md:ease-out"
            style={{
              gridTemplateColumns: shouldRevealSearchAction ? 'minmax(0, 1fr) 2.5rem' : 'minmax(0, 1fr) 0rem',
            }}
          >
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                value={inputThemeName}
                onChange={handleInputThemeName}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full rounded-md border border-transparent p-2 pl-10 pr-10 text-black"
                placeholder={i18n.t('availableDecks.searchPlaceholder')}
              />
              <button
                type="button"
                aria-label={i18n.t('availableDecks.clearSearchAriaLabel')}
                disabled={!canClearSearch}
                className={`absolute right-2 top-1/2 rounded-full p-1 transition-all duration-150 ease-out md:hidden ${
                  shouldRevealSearchAction
                    ? 'translate-y-[-50%] opacity-100'
                    : 'translate-y-[-50%] translate-x-1 opacity-0'
                } ${canClearSearch ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' : 'pointer-events-none text-gray-300'}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setInputThemeName('')}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div
              aria-hidden={!shouldRevealSearchAction}
              className={`hidden overflow-hidden md:flex md:items-center md:justify-end md:pl-2 md:transition-[width,opacity,padding] md:duration-150 md:ease-out ${
                shouldRevealSearchAction ? 'md:opacity-100 md:delay-150' : 'md:opacity-0 md:delay-0'
              }`}
            >
              <button
                type="button"
                aria-label={i18n.t('availableDecks.clearSearchAriaLabel')}
                disabled={!canClearSearch}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  canClearSearch ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'pointer-events-none text-gray-600'
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setInputThemeName('')}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-scroll overflow-y-hidden px-4 py-6 md:p-4">
        <div className="flex min-h-[98px] gap-4" style={{ minWidth: deckStripMinWidth }}>
          <button
            type="button"
            className="inline-flex h-24 min-w-24 items-center justify-center self-stretch rounded-sm text-blue-200 transition-colors hover:bg-blue-400/10 hover:text-white md:hidden"
            onClick={handleOpenModal}
            aria-label={i18n.t('availableDecks.addTheme')}
          >
            <PlusCircle className="h-6 w-6" aria-hidden="true" />
          </button>
          {filteredDecks.map(({ deck, index }) => (
            <AvailableDeckItem
              key={deck.id}
              deck={deck}
              index={index}
              moveAvailableDeck={moveAvailableDeck}
              moveDeckToAvailableDecks={moveDeckToAvailableDecks}
            />
          ))}

          {decks.length !== 0 && filteredDecks.length === 0 && (
            <div className="flex min-w-full items-center justify-center self-stretch rounded-sm border border-transparent px-4 text-center text-sm text-gray-300">
              {i18n.t('availableDecks.noMatchingThemes')}
            </div>
          )}

          {decks.length === 0 && (
            <div className="flex h-24 min-w-[320px] items-center justify-center rounded-sm border border-dashed border-gray-500 px-4 text-sm text-gray-300">
              {i18n.t('availableDecks.emptyState')}
            </div>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-theme-title"
            className="w-full max-w-md rounded-md border border-gray-600 bg-gray-800 p-5 text-white shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="create-theme-title" className="text-lg font-bold">{i18n.t('availableDecks.createThemeTitle')}</h2>
                <p className="mt-1 text-sm text-gray-300">{i18n.t('availableDecks.createThemeDescription')}</p>
              </div>
              <button
                type="button"
                aria-label={i18n.t('availableDecks.closeModalAriaLabel')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white"
                onClick={handleCloseModal}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mb-4 flex items-center gap-4 rounded-md border border-white/10 bg-white/5 p-3">
              <img
                src={newDeckIcon || DEFAULT_THEME_IMAGE}
                alt={i18n.t('availableDecks.previewAlt')}
                className="h-16 w-28 rounded-sm object-cover"
              />
              <p className="text-sm text-gray-300">
                {i18n.t('availableDecks.previewDescription')}
              </p>
            </div>

            <form onSubmit={handleCreateTheme}>
              <label className="mb-2 block text-sm">{i18n.t('availableDecks.themeNameLabel')}</label>
              <input
                type="text"
                value={newDeckName}
                onChange={(event) => setNewDeckName(event.target.value)}
                className="mb-3 w-full rounded-md p-2 text-black"
                placeholder={i18n.t('availableDecks.themeNamePlaceholder')}
                autoFocus
              />

              <label className="mb-2 block text-sm">{i18n.t('availableDecks.iconUrlLabel')}</label>
              <input
                type="url"
                value={newDeckIcon}
                onChange={(event) => setNewDeckIcon(event.target.value)}
                className="mb-3 w-full rounded-md p-2 text-black"
                placeholder="https://..."
              />

              <label className="mb-2 block text-sm">{i18n.t('availableDecks.localImageLabel')}</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleIconFileInput}
                className="mb-3 w-full text-sm"
              />

              {formError && (
                <p className="mb-3 text-sm text-red-300">{formError}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-md border border-gray-500 px-3 py-2 text-sm"
                >
                  {i18n.t('availableDecks.cancelButton')}
                </button>
                <button
                  type="submit"
                  className="rounded-md border border-blue-400 px-3 py-2 text-sm text-blue-200 transition-colors hover:bg-blue-400/10"
                >
                  {i18n.t('availableDecks.addButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

const AvailableDeckItem: React.FC<{
  deck: Deck;
  index: number;
  moveAvailableDeck: (dragIndex: number, hoverIndex: number) => void;
  moveDeckToAvailableDecks: (deck: Deck, sourceTierIndex: number, hoverIndex?: number) => void;
}> = ({ deck, index, moveAvailableDeck, moveDeckToAvailableDecks }) => {
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

      if (item.tierIndex === -1) {
        moveAvailableDeck(item.index, index);
      } else {
        moveDeckToAvailableDecks(item.deck, item.tierIndex, index);
      }

      item.index = index;
      item.tierIndex = -1;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'deck',
    item: { deck, index, tierIndex: -1 },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  drag(drop(ref));

  return (
    <div
      ref={ref}
      title={deckDisplayName}
      className={`relative inline-block cursor-grab overflow-hidden rounded-sm border border-gray-700 ${isDragging ? 'opacity-50' : ''}`}
    >
      <img src={deck.image} alt={deckDisplayName} className="h-24 w-40 min-w-40 max-w-40 object-cover" />
      <span className="absolute bottom-0 left-0 block w-full bg-[#000000cc] p-1 text-center text-sm font-bold text-white">{deckDisplayName}</span>
    </div>
  );
};

export default AvailableDecks;
