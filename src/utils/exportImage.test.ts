import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Tier } from '../types';

type ImageOutcome = 'load' | 'error';

class MockImage {
  static created: MockImage[] = [];
  static outcomes = new Map<string, ImageOutcome[]>();

  complete = false;
  crossOrigin: string | null = null;
  decoding = 'auto';
  loading = 'auto';
  naturalHeight = 0;
  naturalWidth = 0;
  onerror: (() => void) | null = null;
  onload: (() => void) | null = null;

  private currentSrc = '';

  constructor() {
    MockImage.created.push(this);
  }

  get src() {
    return this.currentSrc;
  }

  set src(value: string) {
    this.currentSrc = value;

    queueMicrotask(() => {
      const outcome = MockImage.outcomes.get(value)?.shift() ?? 'load';

      if (outcome === 'error') {
        this.complete = false;
        this.onerror?.();
        return;
      }

      this.complete = true;
      this.naturalWidth = 160;
      this.naturalHeight = 90;
      this.onload?.();
    });
  }
}

const tiers: Tier[] = [
  {
    name: 'Tier1',
    decks: [{ id: 'retry-me', name: 'Retry Me', image: '/deck.png' }],
  },
];

const createMockContext = () => ({
  arcTo: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  clip: vi.fn(),
  closePath: vi.fn(),
  drawImage: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn((text: string) => ({ width: text.length * 6 }) as TextMetrics),
  moveTo: vi.fn(),
  restore: vi.fn(),
  save: vi.fn(),
  scale: vi.fn(),
  strokeRect: vi.fn(),
}) as unknown as CanvasRenderingContext2D;

describe('exportAsImage image loading', () => {
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.stubGlobal('Image', MockImage as unknown as typeof Image);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:export-image'),
      revokeObjectURL: vi.fn(),
    });

    MockImage.created = [];
    MockImage.outcomes = new Map();

    mockContext = createMockContext();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback: BlobCallback) => {
      callback(new Blob(['png'], { type: 'image/png' }));
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('retries an image that failed during a previous export', async () => {
    MockImage.outcomes.set('/deck.png', ['error', 'load']);

    const { exportAsImage } = await import('./exportImage');

    await exportAsImage({ tiers });
    await exportAsImage({ tiers });

    const deckLoads = MockImage.created.filter((image) => image.src === '/deck.png');

    expect(deckLoads).toHaveLength(2);
  });

  it('keeps a successfully loaded image cached for later exports', async () => {
    MockImage.outcomes.set('/deck.png', ['load', 'error']);

    const { exportAsImage } = await import('./exportImage');

    await exportAsImage({ tiers });
    await exportAsImage({ tiers });

    const deckLoads = MockImage.created.filter((image) => image.src === '/deck.png');

    expect(deckLoads).toHaveLength(1);
    expect(MockImage.outcomes.get('/deck.png')).toEqual(['error']);
  });

  it('sets anonymous crossOrigin before loading images', async () => {
    const { exportAsImage } = await import('./exportImage');

    await exportAsImage({ tiers });

    const deckLoad = MockImage.created.find((image) => image.src === '/deck.png');

    expect(deckLoad?.crossOrigin).toBe('anonymous');
  });

  it('leaves crossOrigin unset when loading data URL images', async () => {
    const dataImage = 'data:image/png;base64,iVBORw0KGgo=';
    const { exportAsImage } = await import('./exportImage');

    await exportAsImage({
      tiers: [
        {
          name: 'Tier1',
          decks: [{ id: 'data-image', name: 'Data Image', image: dataImage }],
        },
      ],
    });

    const deckLoad = MockImage.created.find((image) => image.src === dataImage);

    expect(deckLoad?.crossOrigin).toBeNull();
  });

  it.each(['http://example.com/deck.png', 'https://example.com/deck.png'])(
    'sets anonymous crossOrigin before loading %s images',
    async (imageUrl) => {
      const { exportAsImage } = await import('./exportImage');

      await exportAsImage({
        tiers: [
          {
            name: 'Tier1',
            decks: [{ id: imageUrl, name: 'Remote Image', image: imageUrl }],
          },
        ],
      });

      const deckLoad = MockImage.created.find((image) => image.src === imageUrl);

      expect(deckLoad?.crossOrigin).toBe('anonymous');
    },
  );

  it('falls back to the card placeholder when a deck image fails to load', async () => {
    MockImage.outcomes.set('/deck.png', ['error']);

    const { exportAsImage } = await import('./exportImage');

    await expect(exportAsImage({ tiers })).resolves.toBeUndefined();
    expect(mockContext.fillRect).toHaveBeenCalledWith(120, 76, 160, 90);
    expect(mockContext.strokeRect).toHaveBeenCalledWith(120.5, 76.5, 159, 89);
    expect(mockContext.fillText).toHaveBeenCalledWith('Retry Me', 200, 154);
  });

  it('falls back to the card placeholder when drawing a loaded deck image fails', async () => {
    vi.mocked(mockContext.drawImage).mockImplementation(((
      _image: CanvasImageSource,
      dx: number,
      dy: number,
      dw: number,
      dh: number,
    ) => {
      if (dx === 120 && dy === 76 && dw === 160 && dh === 90) {
        throw new Error('Failed to draw deck image.');
      }
    }) as typeof mockContext.drawImage);

    const { exportAsImage } = await import('./exportImage');

    await expect(exportAsImage({ tiers })).resolves.toBeUndefined();
    expect(mockContext.fillRect).toHaveBeenCalledWith(120, 76, 160, 90);
    expect(mockContext.strokeRect).toHaveBeenCalledWith(120.5, 76.5, 159, 89);
    expect(mockContext.fillText).toHaveBeenCalledWith('Retry Me', 200, 154);
  });
});
