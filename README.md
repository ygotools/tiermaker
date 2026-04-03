# Tier Maker for Yu-Gi-Oh! Master Duel

遊戯王マスターデュエル向けの Tier 表をブラウザ上で作成するためのフロントエンドです。  
デッキ画像をドラッグ＆ドロップで Tier1〜Tier4 に並べ替え、そのまま PNG として書き出せます。

公開先: [https://tier.ygotools.com](https://tier.ygotools.com)

## 現在の実装でできること

- Tier1〜Tier4 の 4 段構成で Tier 表を編集
- 下部のデッキ一覧から各 Tier へドラッグ＆ドロップ
- Tier 内での並び替え
- Tier から外へドラッグして一覧へ戻す
- デッキ名の部分一致検索
- 画面上の Tier 表を PNG でダウンロード

初期状態では `src/masterdata.ts` に定義された Tier とデッキデータを読み込みます。  
現在のデータは、Tier 表に配置済みのサンプル 10 件と、下部一覧の 42 件をあわせた構成です。

## 技術スタック

- React 18
- TypeScript
- Vite 5
- Tailwind CSS
- React DnD
- Firebase Hosting

## 開発環境

CI では Node.js 20 / pnpm 10 系を使っています。ローカルでも同程度のバージョンを前提にすると無難です。

```bash
pnpm install
pnpm dev
```

開発サーバー起動後は、通常どおり Vite のローカル URL で確認できます。

## 利用できるスクリプト

```bash
pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm download-assets
```

- `pnpm dev`: 開発サーバーを起動
- `pnpm build`: TypeScript のコンパイルと本番ビルドを実行
- `pnpm preview`: ビルド済み成果物をローカル確認
- `pnpm lint`: ESLint を実行
- `pnpm download-assets`: `src/masterdata.ts` を走査し、参照されているデッキ画像を `public/static/deckimages` に取得

## データ更新方法

Tier の初期値とデッキ一覧は [src/masterdata.ts](./src/masterdata.ts) で管理しています。

- `SAMPLE_DATA`: 初期表示時に Tier1〜Tier4 に置いておくデッキ
- `INITIAL_AVAILABLE_DECKS`: 下部の一覧に表示するデッキ

画像は `public/static/deckimages/<theme>.png` を参照します。  
新しいデッキを追加する場合は、`src/masterdata.ts` に画像パスを追加したうえで、必要なら `pnpm download-assets` を実行してください。

アセット取得元は `scripts/download-assets.mjs` にある Google Cloud Storage の公開バケットです。

## ビルドとデプロイ

```bash
pnpm build
pnpm exec firebase deploy --only hosting
```

ビルド成果物は `dist/` に出力され、`firebase.json` の設定で Firebase Hosting に配信します。
