import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Tier } from '../types';

type ImageOutcome = 'load' | 'error';

const originalImage = globalThis.Image;
const originalGetContext = HTMLCanvasElement.prototype.getContext;
const originalToBlob = HTMLCanvasElement.prototype.toBlob;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

const createMockContext = () => ({
  arcTo: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  clip: vi.fn(),
  closePath: vi.fn(),
  drawImage: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
  moveTo: vi.fn(),
  restore: vi.fn(),
  save: vi.fn(),
  scale: vi.fn(),
  strokeRect: vi.fn(),
});

const installExportMocks = (imageOutcomes: Map<string, ImageOutcome[]>) => {
  const imageAttempts = new Map<string, number>();

  class MockImage {
    complete = false;
    crossOrigin: string | null = null;
    decoding = 'auto';
    loading = 'auto';
    naturalHeight = 40;
    naturalWidth = 80;
    onerror: ((event: Event) => void) | null = null;
    onload: ((event: Event) => void) | null = null;
    private currentSrc = '';

    get src() {
      return this.currentSrc;
    }

    set src(value: string) {
      this.currentSrc = value;

      const attemptIndex = imageAttempts.get(value) ?? 0;
      imageAttempts.set(value, attemptIndex + 1);

      const outcome = imageOutcomes.get(value)?.[attemptIndex] ?? 'load';
      queueMicrotask(() => {
        if (outcome === 'load') {
          this.complete = true;
          this.onload?.(new Event('load'));
          return;
        }

        this.onerror?.(new Event('error'));
      });
    }
  }

  Object.defineProperty(globalThis, 'Image', {
    configurable: true,
    value: MockImage,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: vi.fn(() => createMockContext()),
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    configurable: true,
    value: vi.fn((callback: BlobCallback) => {
      callback(new Blob(['png'], { type: 'image/png' }));
    }),
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:export-image'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

  return { imageAttempts };
};

const restoreProperty = <T, K extends keyof T>(target: T, key: K, value: T[K]) => {
  if (value === undefined) {
    Reflect.deleteProperty(target as object, key);
    return;
  }

  Object.defineProperty(target, key, {
    configurable: true,
    value,
  });
};

describe('exportAsImage', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreProperty(globalThis, 'Image', originalImage);
    restoreProperty(HTMLCanvasElement.prototype, 'getContext', originalGetContext);
    restoreProperty(HTMLCanvasElement.prototype, 'toBlob', originalToBlob);
    restoreProperty(URL, 'createObjectURL', originalCreateObjectURL);
    restoreProperty(URL, 'revokeObjectURL', originalRevokeObjectURL);
    document.body.replaceChildren();
  });

  it('retries deck image loads after a failed export attempt', async () => {
    const deckImage = '/deck.png';
    const { imageAttempts } = installExportMocks(new Map([
      [deckImage, ['error', 'load']],
    ]));
    const { exportAsImage } = await import('./exportImage');
    const tiers: Tier[] = [
      {
        name: 'Tier1',
        decks: [{ id: 'deck', image: deckImage, name: 'Deck' }],
      },
    ];

    await exportAsImage({ tiers });
    await exportAsImage({ tiers });

    expect(imageAttempts.get(deckImage)).toBe(2);
  });

  it('keeps successful image loads cached across exports', async () => {
    const deckImage = '/cached-deck.png';
    const { imageAttempts } = installExportMocks(new Map([
      [deckImage, ['load', 'load']],
    ]));
    const { exportAsImage } = await import('./exportImage');
    const tiers: Tier[] = [
      {
        name: 'Tier1',
        decks: [{ id: 'deck', image: deckImage, name: 'Deck' }],
      },
    ];

    await exportAsImage({ tiers });
    await exportAsImage({ tiers });

    expect(imageAttempts.get(deckImage)).toBe(1);
  });
});
