import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { createDefaultTierListSnapshot } from './utils/tierListStorage';

const setNavigatorLanguage = (language: string, languages = [language]) => {
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    value: language,
  });
  Object.defineProperty(window.navigator, 'languages', {
    configurable: true,
    value: languages,
  });
};

const getTierElement = (container: HTMLElement, tierIndex: number) => {
  const tier = container.querySelector<HTMLElement>(`.tier[data-tier-index="${tierIndex}"]`);

  expect(tier).toBeInTheDocument();

  return tier as HTMLElement;
};

const getTierDeckNames = (container: HTMLElement, tierIndex: number) => (
  Array.from(getTierElement(container, tierIndex).querySelectorAll<HTMLElement>('.tier-item'))
    .map((item) => item.getAttribute('title'))
);

const getAvailableDeckNames = (container: HTMLElement) => (
  Array.from(container.querySelectorAll<HTMLElement>('.available-decks-container [role="listitem"]'))
    .map((item) => item.getAttribute('title'))
);

type FileReaderStub = {
  result: string | ArrayBuffer | null;
  onload: ((event: ProgressEvent<FileReader>) => void) | null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null;
  readAsDataURL: (file: Blob) => void;
};

const setClipboardWriteText = (writeText?: Clipboard['writeText']) => {
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  });
};

describe('App', () => {
  beforeEach(() => {
    setNavigatorLanguage('en-US');
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    setClipboardWriteText();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the English UI when the browser language is not Japanese', () => {
    render(<App />);

    expect(screen.getByRole('textbox', { name: 'Filter by theme name' })).toBeInTheDocument();
    expect(screen.getByText(/\d+ themes/)).toHaveAttribute('aria-live', 'polite');
    expect(screen.getAllByRole('button', { name: 'Add Theme' })).toHaveLength(2);
    expect(screen.getByText('Lunalight')).toBeInTheDocument();
    expect(screen.getByText('Maliss')).toBeInTheDocument();
    expect(screen.getByText('2024/08: Added 【Runick】 and 【Voiceless Voice】.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.lang).toBe('en');
  });

  it('uses the primary browser language when multiple preferred languages exist', () => {
    setNavigatorLanguage('en-US', ['en-US', 'ja-JP']);
    render(<App />);

    expect(screen.getByPlaceholderText('Filter by theme name')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('renders the Japanese UI when the browser language is Japanese', () => {
    setNavigatorLanguage('ja-JP');
    render(<App />);

    expect(screen.getByRole('textbox', { name: 'テーマ名で絞り込む' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'テーマを追加' })).toHaveLength(2);
    expect(screen.getByText('月光')).toBeInTheDocument();
    expect(screen.getByText('M∀LICE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '日本語' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.lang).toBe('ja');
  });

  it('renders grouped update history entries inside a details disclosure', () => {
    setNavigatorLanguage('ja-JP');
    render(<App />);

    const summary = screen.getByText('更新履歴').closest('summary');

    expect(summary).toBeInTheDocument();

    const details = summary?.closest('details');

    expect(details).toBeInTheDocument();
    expect(within(details as HTMLElement).getByText('2024/11: 【竜剣士】【マナドゥム】【キマイラ】【覇王幻奏】【暗黒界】を追加しました。')).toBeInTheDocument();
  });

  it('links screen-reader keyboard drag descriptions to deck items', () => {
    render(<App />);

    const availableDeck = screen.getByRole('listitem', { name: 'Onomat Ryzeal' });
    const availableDescriptionId = availableDeck.getAttribute('aria-describedby');

    expect(availableDescriptionId).toBeTruthy();

    const availableDescription = document.getElementById(availableDescriptionId as string);

    expect(availableDescription).toHaveClass('sr-only');
    expect(availableDeck).toHaveAccessibleDescription(
      'Keyboard controls: Use ArrowLeft, ArrowRight, Home, and End to reorder within available decks. Use ArrowUp to move to the last tier.',
    );

    const tierDeck = screen.getByRole('listitem', { name: 'Kewl Tune, Tier1, position 1 of 2' });
    const tierDescriptionId = tierDeck.getAttribute('aria-describedby');

    expect(tierDescriptionId).toBeTruthy();

    const tierDescription = document.getElementById(tierDescriptionId as string);

    expect(tierDescription).toHaveClass('sr-only');
    expect(tierDeck).toHaveAccessibleDescription(
      'Keyboard controls: Use ArrowLeft, ArrowRight, Home, and End to move within this tier. Use ArrowUp and ArrowDown to move between tiers. Use Delete or Backspace to return to available decks.',
    );
  });

  it('does not use custom deck ids for tier keyboard drag description ids', () => {
    const customDeckId = 'custom deck #1/[test]';
    const params = new URLSearchParams({
      tier1: customDeckId,
      customDecks: JSON.stringify([{
        id: customDeckId,
        name: 'Odd Custom',
        imageUrl: 'https://example.com/odd-custom.png',
      }]),
    });

    window.history.replaceState({}, '', `/?${params.toString()}`);
    render(<App />);

    const tierDeck = screen.getByRole('listitem', { name: 'Odd Custom, Tier1, position 1 of 1' });
    const tierDescriptionId = tierDeck.getAttribute('aria-describedby');

    expect(tierDescriptionId).toBeTruthy();
    expect(tierDescriptionId).not.toContain(customDeckId);
    expect(document.getElementById(tierDescriptionId as string)).toHaveClass('sr-only');
    expect(tierDeck).toHaveAccessibleDescription(
      'Keyboard controls: Use ArrowLeft, ArrowRight, Home, and End to move within this tier. Use ArrowUp and ArrowDown to move between tiers. Use Delete or Backspace to return to available decks.',
    );
  });

  it('announces the required theme name error in the add theme dialog', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'Add Theme' })[0]);
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const themeNameInput = screen.getByLabelText('Theme Name');
    const error = screen.getByRole('alert');

    expect(error).toHaveTextContent('Please enter a theme name.');
    expect(themeNameInput).toHaveAttribute('aria-invalid', 'true');
    expect(themeNameInput).toHaveAttribute('aria-describedby', error.id);
    expect(themeNameInput).toHaveFocus();
  });

  it('clears the required theme name error when the theme name changes', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'Add Theme' })[0]);
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const themeNameInput = screen.getByLabelText('Theme Name');

    expect(themeNameInput).toHaveAttribute('aria-invalid', 'true');

    await user.type(themeNameInput, 'Unique Theme');

    expect(screen.queryByText('Please enter a theme name.')).not.toBeInTheDocument();
    expect(themeNameInput).not.toHaveAttribute('aria-invalid');
    expect(themeNameInput).not.toHaveAttribute('aria-describedby');
  });

  it('rejects duplicate theme names and keeps focus on the theme name input', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'Add Theme' })[0]);
    await user.type(screen.getByLabelText('Theme Name'), 'lunalight');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const themeNameInput = screen.getByLabelText('Theme Name');
    const error = screen.getByRole('alert');

    expect(error).toHaveTextContent('A theme with the same name already exists.');
    expect(themeNameInput).toHaveAttribute('aria-invalid', 'true');
    expect(themeNameInput).toHaveAttribute('aria-describedby', error.id);
    expect(themeNameInput).toHaveFocus();
  });

  it('keeps focus inside the add theme dialog', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'Add Theme' })[0]);

    const dialog = screen.getByRole('dialog');
    const closeButton = within(dialog).getByRole('button', { name: 'Close' });
    const addButton = within(dialog).getByRole('button', { name: 'Add' });

    expect(screen.getByLabelText('Theme Name')).toHaveFocus();
    expect(dialog).toHaveAccessibleDescription(
      'You can add a candidate by entering an image URL or selecting an image file.',
    );

    closeButton.focus();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(addButton).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it('restores focus to the add theme button after the dialog closes', async () => {
    const user = userEvent.setup();

    render(<App />);

    const addThemeButton = screen.getAllByRole('button', { name: 'Add Theme' })[0];

    await user.click(addThemeButton);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(addThemeButton).toHaveFocus();
  });

  it('restores focus to the add theme button after creating a theme', async () => {
    const user = userEvent.setup();

    render(<App />);

    const addThemeButton = screen.getAllByRole('button', { name: 'Add Theme' })[0];

    await user.click(addThemeButton);
    await user.type(screen.getByLabelText('Theme Name'), 'Unique Theme');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Added "Unique Theme".');
    expect(addThemeButton).toHaveFocus();
  });

  it('rejects oversized local images before reading them', async () => {
    const user = userEvent.setup();
    const FileReaderMock = vi.fn();

    vi.stubGlobal('FileReader', FileReaderMock);
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'Add Theme' })[0]);
    await user.upload(
      screen.getByLabelText('Or choose a local image'),
      new File([new Uint8Array(1024 * 1024 + 1)], 'too-large.png', { type: 'image/png' }),
    );

    const localImageInput = screen.getByLabelText('Or choose a local image');
    const error = screen.getByRole('alert');

    expect(error).toHaveTextContent('Please choose a local image that is 1 MB or smaller.');
    expect(localImageInput).toHaveAttribute('aria-invalid', 'true');
    expect(localImageInput).toHaveAttribute('aria-describedby', error.id);
    expect(FileReaderMock).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem('tiermaker:tier-list') ?? '').not.toContain('data:');
  });

  it('shows an error when a local image cannot be read', async () => {
    const user = userEvent.setup();
    const readAsDataURL = vi.fn(function readAsDataURL(this: FileReaderStub) {
      this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>);
    });
    const FileReaderMock = vi.fn((): FileReaderStub => ({
      result: null,
      onload: null,
      onerror: null,
      readAsDataURL,
    }));

    vi.stubGlobal('FileReader', FileReaderMock);
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'Add Theme' })[0]);
    await user.upload(
      screen.getByLabelText('Or choose a local image'),
      new File(['not readable'], 'broken.png', { type: 'image/png' }),
    );

    const localImageInput = screen.getByLabelText('Or choose a local image');
    const error = screen.getByRole('alert');

    expect(error).toHaveTextContent('Could not read the local image. Please choose another image.');
    expect(localImageInput).toHaveAttribute('aria-invalid', 'true');
    expect(localImageInput).toHaveAttribute('aria-describedby', error.id);
    expect(readAsDataURL).toHaveBeenCalledOnce();
    expect(window.sessionStorage.getItem('tiermaker:tier-list') ?? '').not.toContain('data:');
  });

  it('clears a local image read error when an icon URL is entered and adds the URL image deck', async () => {
    const user = userEvent.setup();
    const customDeckName = 'URL Recovery Theme';
    const customDeckImageUrl = 'https://example.com/url-recovery-theme.png';
    const readAsDataURL = vi.fn(function readAsDataURL(this: FileReaderStub) {
      this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>);
    });
    const FileReaderMock = vi.fn((): FileReaderStub => ({
      result: null,
      onload: null,
      onerror: null,
      readAsDataURL,
    }));
    vi.stubGlobal('FileReader', FileReaderMock);
    const { container } = render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'Add Theme' })[0]);
    await user.type(screen.getByLabelText('Theme Name'), customDeckName);

    const localImageInput = screen.getByLabelText('Or choose a local image');
    await user.upload(
      localImageInput,
      new File(['not readable'], 'broken.png', { type: 'image/png' }),
    );

    const error = screen.getByRole('alert');

    expect(error).toHaveTextContent('Could not read the local image. Please choose another image.');
    expect(localImageInput).toHaveAttribute('aria-invalid', 'true');
    expect(localImageInput).toHaveAttribute('aria-describedby', error.id);

    await user.type(screen.getByLabelText('Icon Image URL'), customDeckImageUrl);

    expect(screen.queryByText('Could not read the local image. Please choose another image.')).not.toBeInTheDocument();
    expect(localImageInput).not.toHaveAttribute('aria-invalid');
    expect(localImageInput).not.toHaveAttribute('aria-describedby');

    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const customDeck = screen.getByRole('listitem', { name: customDeckName });
    expect(customDeck).toBeInTheDocument();
    expect(within(customDeck).getByRole('img', { name: customDeckName })).toHaveAttribute(
      'src',
      customDeckImageUrl,
    );
    expect(getAvailableDeckNames(container)).toContain(customDeckName);
    expect(readAsDataURL).toHaveBeenCalledOnce();
  });

  it('does not add a deck after a local image read error when Add is pressed', async () => {
    const user = userEvent.setup();
    const readAsDataURL = vi.fn(function readAsDataURL(this: FileReaderStub) {
      this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>);
    });
    const FileReaderMock = vi.fn((): FileReaderStub => ({
      result: null,
      onload: null,
      onerror: null,
      readAsDataURL,
    }));
    vi.stubGlobal('FileReader', FileReaderMock);
    const { container } = render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'Add Theme' })[0]);
    await user.type(screen.getByLabelText('Theme Name'), 'Broken Local Image Theme');
    await user.upload(
      screen.getByLabelText('Or choose a local image'),
      new File(['not readable'], 'broken.png', { type: 'image/png' }),
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const localImageInput = screen.getByLabelText('Or choose a local image');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not read the local image. Please choose another image.');
    expect(localImageInput).toHaveFocus();
    expect(getAvailableDeckNames(container)).not.toContain('Broken Local Image Theme');
  });

  it('does not overwrite stored state on initial render for an invalid share URL', () => {
    const storedSnapshot = {
      tiers: [
        { name: 'Stored', decks: [{ id: 'stored-custom', name: 'Stored Custom', image: '/stored-custom.png' }] },
      ],
      availableDecks: [],
    };

    window.sessionStorage.setItem('tiermaker:tier-list', JSON.stringify(storedSnapshot));
    window.history.replaceState({}, '', '/?tier1=unknown');

    const { container } = render(<App />);

    expect(container.querySelector('[title="Stored Custom"]')).not.toBeInTheDocument();
    expect(JSON.parse(window.sessionStorage.getItem('tiermaker:tier-list') ?? '')).toEqual(storedSnapshot);
  });

  it('saves the default snapshot after resetting from an invalid share URL', async () => {
    const user = userEvent.setup();
    const storedSnapshot = {
      tiers: [
        { name: 'Stored', decks: [{ id: 'stored-custom', name: 'Stored Custom', image: '/stored-custom.png' }] },
      ],
      availableDecks: [],
    };
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    window.sessionStorage.setItem('tiermaker:tier-list', JSON.stringify(storedSnapshot));
    window.history.replaceState({}, '', '/?tier1=unknown');

    try {
      render(<App />);

      expect(JSON.parse(window.sessionStorage.getItem('tiermaker:tier-list') ?? '')).toEqual(storedSnapshot);

      await user.click(screen.getByRole('button', { name: 'Reset to Default' }));

      await waitFor(() => {
        expect(JSON.parse(window.sessionStorage.getItem('tiermaker:tier-list') ?? '')).toEqual(createDefaultTierListSnapshot());
      });

      expect(window.location.search).toBe('');
      expect(window.sessionStorage.getItem('tiermaker:tier-list') ?? '').not.toContain('stored-custom');
      expect(window.sessionStorage.getItem('tiermaker:tier-list') ?? '').not.toContain('Stored Custom');
      expect(confirmSpy).toHaveBeenCalledOnce();
      expect(confirmSpy).toHaveBeenCalledWith('Discard the current order and restore the initial state?');
    } finally {
      confirmSpy.mockRestore();
    }
  });

  it('saves the next user change after loading from a share URL', async () => {
    const user = userEvent.setup();
    const storedSnapshot = {
      tiers: [
        { name: 'Stored', decks: [{ id: 'stored-custom', name: 'Stored Custom', image: '/stored-custom.png' }] },
      ],
      availableDecks: [],
    };

    window.sessionStorage.setItem('tiermaker:tier-list', JSON.stringify(storedSnapshot));
    window.history.replaceState({}, '', '/?tier1=blue-eyes');

    const { unmount } = render(<App />);

    expect(JSON.parse(window.sessionStorage.getItem('tiermaker:tier-list') ?? '')).toEqual(storedSnapshot);
    expect(window.location.search).toBe('?tier1=blue-eyes');

    screen.getByRole('listitem', { name: 'Blue-Eyes, Tier1, position 1 of 1' }).focus();
    await user.keyboard('{Delete}');

    await waitFor(() => {
      const savedSnapshot = JSON.parse(window.sessionStorage.getItem('tiermaker:tier-list') ?? '');

      expect(savedSnapshot).not.toEqual(storedSnapshot);
      expect(savedSnapshot.tiers[0].decks).toEqual([]);
      expect(savedSnapshot.availableDecks.map((deck: { id: string }) => deck.id)).toContain('blue-eyes');
    });

    expect(window.location.search).toBe('');
    expect(window.sessionStorage.getItem('tiermaker:tier-list') ?? '').not.toContain('stored-custom');

    unmount();

    const { container } = render(<App />);

    expect(getTierDeckNames(container, 0)).toEqual([]);
    expect(getAvailableDeckNames(container)).toContain('Blue-Eyes');
  });

  it('renders when tier share query detection cannot parse the current URL', () => {
    const OriginalURLSearchParams = globalThis.URLSearchParams;

    globalThis.URLSearchParams = class extends OriginalURLSearchParams {
      constructor(init?: string[][] | Record<string, string> | string | URLSearchParams) {
        if (typeof init === 'string') {
          throw new Error('query parsing failed');
        }

        super(init);
      }
    };

    try {
      window.history.replaceState({}, '', '/?tier1=blue-eyes');

      render(<App />);

      expect(screen.getByPlaceholderText('Filter by theme name')).toBeInTheDocument();
    } finally {
      globalThis.URLSearchParams = OriginalURLSearchParams;
    }
  });

  it('copies the share URL to the clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn<Clipboard['writeText']>().mockResolvedValue(undefined);

    setClipboardWriteText(writeText);
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Copy URL' }));

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('tier1='));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('killer-tune'));
    expect(screen.getByRole('status')).toHaveTextContent('Share URL copied.');
  });

  it('copies a share URL with custom deck metadata to the clipboard', async () => {
    const user = userEvent.setup();
    const customDeckId = '00000000-0000-4000-8000-000000000001';
    const customDeckName = 'Clipboard Custom Theme';
    const customDeckImageUrl = 'https://example.com/custom-theme.png';
    const writeText = vi.fn<Clipboard['writeText']>().mockResolvedValue(undefined);

    vi.spyOn(crypto, 'randomUUID').mockReturnValue(customDeckId);
    setClipboardWriteText(writeText);
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'Add Theme' })[0]);
    await user.type(screen.getByLabelText('Theme Name'), customDeckName);
    await user.type(screen.getByLabelText('Icon Image URL'), customDeckImageUrl);
    await user.click(screen.getByRole('button', { name: 'Add' }));

    screen.getByRole('listitem', { name: customDeckName }).focus();
    await user.keyboard('{ArrowUp}');
    await user.click(screen.getByRole('button', { name: 'Copy URL' }));

    expect(writeText).toHaveBeenCalledOnce();

    const copiedUrl = writeText.mock.calls[0]?.[0] as string;
    const copiedUrlParams = new URL(copiedUrl).searchParams;

    expect(copiedUrlParams.get('customDecks')).not.toBeNull();
    expect(copiedUrlParams.get('tier4')?.split(',')).toContain(customDeckId);
    expect(JSON.parse(copiedUrlParams.get('customDecks') ?? '')).toEqual([
      { id: customDeckId, name: customDeckName, imageUrl: customDeckImageUrl },
    ]);
  });

  it('shows feedback when the share URL cannot be copied', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn<Clipboard['writeText']>().mockRejectedValue(new Error('clipboard denied'));

    setClipboardWriteText(writeText);
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Copy URL' }));

    expect(writeText).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not copy the share URL.');
  });

  it('shows feedback when the Clipboard API is unavailable', async () => {
    const user = userEvent.setup();

    setClipboardWriteText();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Copy URL' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Could not copy the share URL.');
  });

  it('builds the X share link from intro, hashtags, and the share URL only', () => {
    render(<App />);

    const shareLink = screen.getByRole('link', { name: 'Share on X' });
    const shareText = new URL(shareLink.getAttribute('href') ?? '').searchParams.get('text') ?? '';

    expect(shareText).toContain('I made a tier list with Tier Maker');
    expect(shareText).toContain('#MasterDuel #YuGiOhMasterDuel #TIERMAKERFORMD');
    expect(shareText).toContain('http://localhost:3000/?tier1=');
    expect(shareText).not.toContain('Tier1');
    expect(shareText).not.toContain('Kewl Tune');
    expect(shareText).not.toContain('Solfachord Yummy');
  });

  it('moves a tier deck within the same tier with arrow keys', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    screen.getByRole('listitem', { name: 'Kewl Tune, Tier1, position 1 of 2' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(getTierDeckNames(container, 0)).toEqual(['Solfachord Yummy', 'Kewl Tune']);
    expect(document.activeElement).toHaveAccessibleName('Kewl Tune, Tier1, position 2 of 2');
  });

  it('moves a tier deck between tiers with arrow keys', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    screen.getByRole('listitem', { name: 'Kewl Tune, Tier1, position 1 of 2' }).focus();
    await user.keyboard('{ArrowDown}');

    expect(getTierDeckNames(container, 0)).toEqual(['Solfachord Yummy']);
    expect(getTierDeckNames(container, 1)).toEqual(['Kewl Tune', 'VSK9', 'Dracotail', 'Maliss', 'Gem-Knight']);
    expect(document.activeElement).toHaveAccessibleName('Kewl Tune, Tier2, position 1 of 5');
  });

  it('returns a tier deck to available decks with Delete', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    screen.getByRole('listitem', { name: 'Kewl Tune, Tier1, position 1 of 2' }).focus();
    await user.keyboard('{Delete}');

    expect(getTierDeckNames(container, 0)).toEqual(['Solfachord Yummy']);
    expect(container.querySelector('.available-decks-container [title="Kewl Tune"]')).toBeInTheDocument();
    expect(document.activeElement).toHaveAccessibleName('Kewl Tune');
  });

  it('moves an available deck within available decks with keyboard shortcuts', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    screen.getByRole('listitem', { name: 'Onomat Ryzeal' }).focus();
    await user.keyboard('{ArrowRight}');

    let availableDeckNames = getAvailableDeckNames(container);
    expect(availableDeckNames.indexOf('Onomat Ryzeal')).toBe(availableDeckNames.indexOf('Mitsurugi') + 1);
    expect(document.activeElement).toHaveAccessibleName('Onomat Ryzeal');

    await user.keyboard('{ArrowLeft}');
    availableDeckNames = getAvailableDeckNames(container);
    expect(availableDeckNames.indexOf('Onomat Ryzeal')).toBeLessThan(availableDeckNames.indexOf('Mitsurugi'));
    expect(document.activeElement).toHaveAccessibleName('Onomat Ryzeal');

    await user.keyboard('{End}');
    availableDeckNames = getAvailableDeckNames(container);
    expect(availableDeckNames.at(-1)).toBe('Onomat Ryzeal');
    expect(document.activeElement).toHaveAccessibleName('Onomat Ryzeal');

    await user.keyboard('{Home}');
    availableDeckNames = getAvailableDeckNames(container);
    expect(availableDeckNames[0]).toBe('Onomat Ryzeal');
    expect(document.activeElement).toHaveAccessibleName('Onomat Ryzeal');

    await user.keyboard('{Delete}{Backspace}');
    expect(getAvailableDeckNames(container)[0]).toBe('Onomat Ryzeal');
    expect(document.activeElement).toHaveAccessibleName('Onomat Ryzeal');
  });

  it('uses the actual available deck index when moving a filtered available deck', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.type(screen.getByPlaceholderText('Filter by theme name'), 'ryzeal');

    expect(getAvailableDeckNames(container)).toEqual(['Onomat Ryzeal', 'Ryzeal']);

    screen.getByRole('listitem', { name: 'Onomat Ryzeal' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(getAvailableDeckNames(container)).toEqual(['Ryzeal', 'Onomat Ryzeal']);
    expect(document.activeElement).toHaveAccessibleName('Onomat Ryzeal');

    await user.clear(screen.getByPlaceholderText('Filter by theme name'));

    const availableDeckNames = getAvailableDeckNames(container);
    expect(availableDeckNames.indexOf('Onomat Ryzeal')).toBe(availableDeckNames.indexOf('Ryzeal') + 1);
  });

  it('moves an available deck to the end of Tier4 with ArrowUp and restores focus', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    screen.getByRole('listitem', { name: 'Onomat Ryzeal' }).focus();
    await user.keyboard('{ArrowUp}');

    expect(getTierDeckNames(container, 3)).toEqual(['Tearlaments', 'Onomat Ryzeal']);
    expect(getAvailableDeckNames(container)).not.toContain('Onomat Ryzeal');
    expect(document.activeElement).toHaveAccessibleName('Onomat Ryzeal, Tier4, position 2 of 2');
  });
});
