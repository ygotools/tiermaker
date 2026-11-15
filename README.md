# Tier Maker for Yu-Gi-Oh! Master Duel

A frontend application for creating tier lists for Yu-Gi-Oh! Master Duel in the browser.  
Drag and drop deck images into Tier 1–Tier 4, then export the result as a PNG.

Live site: [https://tier.ygotools.com](https://tier.ygotools.com)

## Features

- Edit tier lists with a 4-tier layout (Tier 1–Tier 4)
- Drag and drop decks from the bottom deck list into each tier
- Reorder decks within a tier
- Drag decks out of a tier to return them to the list
- Search decks by partial name match
- Download the tier list as a PNG image

On initial load, tier and deck data defined in `src/masterdata.ts` is used.  
The default dataset includes 16 sample decks placed in tiers and 56 decks in the bottom list.
The November 15, 2026 update follows [Game8's November 13 tier list](https://game8.jp/yugioh-masterduel/423817).
New themes are also added to the candidates when an existing saved session is restored, preserving the user's tier placements.

## Tech Stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS
- React DnD
- Firebase Hosting

## Development

CI uses Node.js 20 and pnpm 10. Using similar versions locally is recommended.

```bash
pnpm install
pnpm dev
```

After starting the dev server, open the local URL provided by Vite.

## Available Scripts

```bash
pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm download-assets
```

- `pnpm dev`: Start the development server
- `pnpm build`: Run TypeScript compilation and production build
- `pnpm preview`: Preview the production build locally
- `pnpm lint`: Run ESLint
- `pnpm download-assets`: Scan `src/masterdata.ts` and download referenced deck images to `public/static/deckimages`

## Updating Data

Tier defaults and the deck list are managed in [src/masterdata.ts](./src/masterdata.ts).

- `SAMPLE_DATA`: Decks initially placed in Tier 1–Tier 4
- `INITIAL_AVAILABLE_DECKS`: Decks shown in the bottom list

Images are referenced from `public/static/deckimages/<theme>.png`.  
To add a new deck, add its image path to `src/masterdata.ts` and run `pnpm download-assets` if needed.

Legacy assets are fetched from a public Google Cloud Storage bucket configured in `scripts/download-assets.mjs`.
New artwork is committed under `public/static/deckimages/bundled/` so a clean CI build includes it without a bucket upload.
The downloader validates these bundled PNGs without overwriting them.
DeviantArt source pages, artist credits, source dimensions, and crop coordinates are recorded in [sources.json](./public/static/deckimages/bundled/sources.json).
The bundled images use a 480 × 270 canvas, with crops selected to keep the featured character visible above the deck label.

## Build and Deploy

```bash
pnpm build
pnpm exec firebase deploy --only hosting
```

Build output goes to `dist/` and is served via Firebase Hosting as configured in `firebase.json`.

### CI Deployment

GitHub Actions runs build and deploy via `.github/workflows/build.yml`.

- `push`, `pull_request`, and `workflow_dispatch` events trigger tests and builds
- On `push` to `master`, or `workflow_dispatch` targeting `master`, `pnpm download-assets` is run before rebuilding and deploying to Firebase Hosting

To enable CI deployment, add a `FIREBASE_TOKEN` to the GitHub repository secrets. Generate the token with `firebase login:ci`.

Note: `FIREBASE_TOKEN` is considered legacy for Firebase CLI CI authentication, but this workflow relies on token-based authentication.
