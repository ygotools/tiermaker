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
  moveAvailableDeckByKeyboard: (
    deck: Deck,
    index: number,
    action: AvailableDeckKeyboardAction,
    targetAvailableDeckIndex?: number,
  ) => void;
  addDeck: (deck: Deck) => void;
  focusedDeckId: string | null;
};

export type AvailableDeckKeyboardAction =
  | 'move-left'
  | 'move-right'
  | 'move-home'
  | 'move-end'
  | 'move-to-last-tier';

const DEFAULT_THEME_IMAGE = '/static/deckimages/others_01.png';
const DECK_CARD_WIDTH_REM = 10;
const DECK_CARD_GAP_REM = 1;
const MAX_LOCAL_THEME_IMAGE_BYTES = 1024 * 1024;
const THEME_NAME_INPUT_ID = 'create-theme-name';
const THEME_ICON_URL_INPUT_ID = 'create-theme-icon-url';
const THEME_LOCAL_IMAGE_INPUT_ID = 'create-theme-local-image';
const THEME_CREATE_DESCRIPTION_ID = 'create-theme-description';
const THEME_NAME_ERROR_ID = 'create-theme-name-error';
const THEME_LOCAL_IMAGE_ERROR_ID = 'create-theme-local-image-error';
const AVAILABLE_DECK_KEYBOARD_DESCRIPTION_ID = 'available-deck-keyboard-description';
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const createDeckId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `custom-${Date.now()}`;
};

const normalizeDeckName = (name: string) => name.trim().toLocaleLowerCase();

const getAvailableDeckKeyboardTargetIndex = (
  action: AvailableDeckKeyboardAction,
  visibleIndex: number,
  visibleDeckIndices: number[],
) => {
  switch (action) {
    case 'move-left':
      return visibleDeckIndices[visibleIndex - 1] ?? visibleDeckIndices[visibleIndex];
    case 'move-right':
      return visibleDeckIndices[visibleIndex + 1] ?? visibleDeckIndices[visibleIndex];
    case 'move-home':
      return visibleDeckIndices[0];
    case 'move-end':
      return visibleDeckIndices[visibleDeckIndices.length - 1];
    case 'move-to-last-tier':
      return undefined;
    default:
      return undefined;
  }
};

const AvailableDecks: React.FC<AvailableDecksProps> = ({
  decks,
  allDecks,
  moveAvailableDeck,
  moveDeckToAvailableDecks,
  moveAvailableDeckByKeyboard,
  addDeck,
  focusedDeckId,
}) => {
  const i18n = useI18n();
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const modalOpenerRef = React.useRef<HTMLButtonElement | null>(null);
  const themeNameInputRef = React.useRef<HTMLInputElement>(null);
  const localImageInputRef = React.useRef<HTMLInputElement>(null);
  const [inputThemeName, setInputThemeName] = React.useState('');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newDeckName, setNewDeckName] = React.useState('');
  const [newDeckIcon, setNewDeckIcon] = React.useState('');
  const [themeNameError, setThemeNameError] = React.useState<string | null>(null);
  const [localImageError, setLocalImageError] = React.useState<string | null>(null);

  const handleInputThemeName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInputThemeName(event.target.value);
  }, []);

  const handleNewDeckNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setNewDeckName(event.target.value);
    setThemeNameError(null);
  }, []);

  const resetCreateForm = useCallback(() => {
    setNewDeckName('');
    setNewDeckIcon('');
    setThemeNameError(null);
    setLocalImageError(null);
  }, []);

  const restoreModalOpenerFocus = useCallback(() => {
    if (modalOpenerRef.current?.isConnected) {
      modalOpenerRef.current.focus();
    }
  }, []);

  const handleOpenModal = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    modalOpenerRef.current = event.currentTarget;
    setIsCreateModalOpen(true);
    setThemeNameError(null);
    setLocalImageError(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsCreateModalOpen(false);
    resetCreateForm();
    restoreModalOpenerFocus();
  }, [resetCreateForm, restoreModalOpenerFocus]);

  useEffect(() => {
    if (!isCreateModalOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseModal();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCloseModal, isCreateModalOpen]);

  const handleCreateTheme = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = newDeckName.trim();
    if (!normalizedName) {
      setThemeNameError(i18n.t('availableDecks.requiredThemeNameError'));
      themeNameInputRef.current?.focus();
      return;
    }

    if (allDecks.some((deck) => (
      normalizeDeckName(deck.name) === normalizeDeckName(normalizedName) ||
      normalizeDeckName(deck.nameEn ?? '') === normalizeDeckName(normalizedName)
    ))) {
      setThemeNameError(i18n.t('availableDecks.duplicateThemeError'));
      themeNameInputRef.current?.focus();
      return;
    }

    setThemeNameError(null);

    if (localImageError) {
      localImageInputRef.current?.focus();
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
    localImageError,
    newDeckIcon,
    newDeckName,
  ]);

  const handleIconFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const input = event.currentTarget;

    if (!file) {
      return;
    }

    if (file.size > MAX_LOCAL_THEME_IMAGE_BYTES) {
      setLocalImageError(i18n.t('availableDecks.localImageTooLargeError'));
      input.value = '';
      return;
    }

    const setLocalImageReadError = () => {
      setLocalImageError(i18n.t('availableDecks.localImageReadError'));
      input.value = '';
    };

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewDeckIcon(reader.result);
        setLocalImageError(null);
        return;
      }

      setLocalImageReadError();
    };
    reader.onerror = setLocalImageReadError;

    try {
      reader.readAsDataURL(file);
    } catch {
      setLocalImageReadError();
    }
  }, [i18n]);

  const normalizedSearchTerm = normalizeDeckName(inputThemeName);
  const filteredDecks = decks
    .map((deck, index) => ({ deck, index }))
    .filter(({ deck }) => matchesDeckSearch(deck, normalizedSearchTerm));
  const visibleDeckIndices = filteredDecks.map(({ index }) => index);
  const shouldRevealSearchAction = isSearchFocused || inputThemeName.length > 0;
  const canClearSearch = inputThemeName.length > 0;
  const isThemeNameInvalid = themeNameError !== null;
  const isLocalImageInvalid = localImageError !== null;
  const deckStripMinWidth = decks.length > 0
    ? `max(100%, ${decks.length * DECK_CARD_WIDTH_REM + Math.max(decks.length - 1, 0) * DECK_CARD_GAP_REM}rem)`
    : 'max(100%, 20rem)';

  return (
    <section className="available-decks-container overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow-[0_20px_45px_rgba(0,0,0,0.2)]">
      <p id={AVAILABLE_DECK_KEYBOARD_DESCRIPTION_ID} className="sr-only">
        {i18n.t('availableDecks.keyboardDragDescription')}
      </p>
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
              <span aria-live="polite" aria-atomic="true">
                {i18n.t('availableDecks.countLabel')(filteredDecks.length, decks.length)}
              </span>
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
                aria-label={i18n.t('availableDecks.searchPlaceholder')}
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
          <div role="list" className="flex min-w-0 flex-1 gap-4">
            {filteredDecks.map(({ deck, index }, visibleIndex) => (
              <AvailableDeckItem
                key={deck.id}
                deck={deck}
                index={index}
                visibleIndex={visibleIndex}
                visibleDeckIndices={visibleDeckIndices}
                focusedDeckId={focusedDeckId}
                moveAvailableDeck={moveAvailableDeck}
                moveDeckToAvailableDecks={moveDeckToAvailableDecks}
                moveAvailableDeckByKeyboard={moveAvailableDeckByKeyboard}
              />
            ))}
          </div>

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
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-theme-title"
            aria-describedby={THEME_CREATE_DESCRIPTION_ID}
            className="w-full max-w-md rounded-md border border-gray-600 bg-gray-800 p-5 text-white shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="create-theme-title" className="text-lg font-bold">{i18n.t('availableDecks.createThemeTitle')}</h2>
                <p id={THEME_CREATE_DESCRIPTION_ID} className="mt-1 text-sm text-gray-300">
                  {i18n.t('availableDecks.createThemeDescription')}
                </p>
              </div>
              <button
                type="button"
                aria-label={i18n.t('availableDecks.closeModalAriaLabel')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/5 hover:text-white"
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
              <label htmlFor={THEME_NAME_INPUT_ID} className="mb-2 block text-sm">{i18n.t('availableDecks.themeNameLabel')}</label>
              <input
                id={THEME_NAME_INPUT_ID}
                ref={themeNameInputRef}
                type="text"
                value={newDeckName}
                onChange={handleNewDeckNameChange}
                className="mb-3 w-full rounded-md p-2 text-black"
                placeholder={i18n.t('availableDecks.themeNamePlaceholder')}
                aria-invalid={isThemeNameInvalid ? 'true' : undefined}
                aria-describedby={isThemeNameInvalid ? THEME_NAME_ERROR_ID : undefined}
                autoFocus
              />

              <label htmlFor={THEME_ICON_URL_INPUT_ID} className="mb-2 block text-sm">{i18n.t('availableDecks.iconUrlLabel')}</label>
              <input
                id={THEME_ICON_URL_INPUT_ID}
                type="url"
                value={newDeckIcon}
                onChange={(event) => {
                  setNewDeckIcon(event.target.value);
                  setLocalImageError(null);
                }}
                className="mb-3 w-full rounded-md p-2 text-black"
                placeholder="https://..."
              />

              <label htmlFor={THEME_LOCAL_IMAGE_INPUT_ID} className="mb-2 block text-sm">{i18n.t('availableDecks.localImageLabel')}</label>
              <input
                id={THEME_LOCAL_IMAGE_INPUT_ID}
                ref={localImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleIconFileInput}
                className="mb-3 w-full text-sm"
                aria-invalid={isLocalImageInvalid ? 'true' : undefined}
                aria-describedby={isLocalImageInvalid ? THEME_LOCAL_IMAGE_ERROR_ID : undefined}
              />

              {themeNameError && (
                <p
                  id={THEME_NAME_ERROR_ID}
                  role="alert"
                  className="mb-3 text-sm text-red-300"
                >
                  {themeNameError}
                </p>
              )}

              {localImageError && (
                <p
                  id={THEME_LOCAL_IMAGE_ERROR_ID}
                  role="alert"
                  className="mb-3 text-sm text-red-300"
                >
                  {localImageError}
                </p>
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
  visibleIndex: number;
  visibleDeckIndices: number[];
  focusedDeckId: string | null;
  moveAvailableDeck: (dragIndex: number, hoverIndex: number) => void;
  moveDeckToAvailableDecks: (deck: Deck, sourceTierIndex: number, hoverIndex?: number) => void;
  moveAvailableDeckByKeyboard: (
    deck: Deck,
    index: number,
    action: AvailableDeckKeyboardAction,
    targetAvailableDeckIndex?: number,
  ) => void;
}> = ({
  deck,
  index,
  visibleIndex,
  visibleDeckIndices,
  focusedDeckId,
  moveAvailableDeck,
  moveDeckToAvailableDecks,
  moveAvailableDeckByKeyboard,
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

      if (item.tierIndex === -1) {
        if (item.index === index) {
          return;
        }

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

  useEffect(() => {
    if (focusedDeckId === deck.id) {
      ref.current?.focus();
    }
  }, [deck.id, focusedDeckId]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      return;
    }

    const actionByKey: Partial<Record<string, AvailableDeckKeyboardAction>> = {
      ArrowLeft: 'move-left',
      ArrowRight: 'move-right',
      ArrowUp: 'move-to-last-tier',
      Home: 'move-home',
      End: 'move-end',
    };
    const action = actionByKey[event.key];

    if (!action) {
      return;
    }

    event.preventDefault();
    moveAvailableDeckByKeyboard(
      deck,
      index,
      action,
      getAvailableDeckKeyboardTargetIndex(action, visibleIndex, visibleDeckIndices),
    );
  };

  drag(drop(ref));

  return (
    <div
      ref={ref}
      title={deckDisplayName}
      role="listitem"
      tabIndex={0}
      aria-label={deckDisplayName}
      aria-describedby={AVAILABLE_DECK_KEYBOARD_DESCRIPTION_ID}
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp Home End"
      onKeyDown={handleKeyDown}
      className={`relative inline-block cursor-grab overflow-hidden rounded-sm border border-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 ${isDragging ? 'opacity-50' : ''}`}
    >
      <img src={deck.image} alt={deckDisplayName} className="h-24 w-40 min-w-40 max-w-40 object-cover" />
      <span className="absolute bottom-0 left-0 block w-full bg-[#000000cc] p-1 text-center text-sm font-bold text-white">{deckDisplayName}</span>
    </div>
  );
};

export default AvailableDecks;
