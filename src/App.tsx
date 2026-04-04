import React from 'react';
import { ExternalLink, History } from 'lucide-react';
import TierList from './components/TierList';

const UPDATE_HISTORY_ITEMS = [
  '2026/04: 【ドレミヤミー】【キラーチューン】を追加しました。',
  '2026/02: 【VSK9】を追加しました。',
  '2025/12: 【オノマトライゼオル】【ドラゴンテイル】【巳剣】【ヤミー】【月光】【閃刀姫】【ジェムナイト】【オルフェゴール】【ライゼオル】【巳剣ライゼオル】を追加しました。',
  '2025/07: 【千年M∀LICE】【氷結界】【エルドリッチ】【M∀LICE】【クリストロン】を追加しました。',
  '2025/05: 【P.U.N.K.】【海皇】を追加しました。',
  '2025/04: 【青眼】【破械】【メメント】を追加し、【メタビート】を再追加しました。',
  '2025/02: 【スネークアイ】【千年】を追加しました。',
  '2025/01: 【ドライトロン】【ギミック・パペット】【白き森】を追加しました。',
  '2024/11: 【竜剣士】【マナドゥム】【キマイラ】【覇王幻奏】【暗黒界】を追加しました。',
  '2024/10: 【霊獣】【ライトロード】【天盃龍】【インフェルノイド】を追加しました。',
  '2024/09: 【古代の機械】【ヴァリアンツ】を追加しました。',
  '2024/08: 【神碑】【粛声】を追加しました。',
  '2024/07: 【センチュリオン】【ユベル】【エンディミオン】を追加しました。',
  '2024/06: v0.1.0 を公開しました。',
] as const;

const App: React.FC = () => {
  return (
    <div className="container mx-auto w-full max-w-[880px] px-4 pb-8">
      <h1
        className="mb-8 flex items-center justify-center pt-4 text-center text-4xl font-bold md:pt-8 export-md:pt-8"
        style={{ fontFamily: 'Digital Numbers' }}
      >
        <img src="/static/logo.png" alt="Tier Maker" width="225" height="35.5" />
      </h1>

      <TierList />

      <section className="mx-auto mt-6 w-full max-w-[816px] rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white">
        <details>
          <summary className="mb-2 inline-flex cursor-pointer items-center gap-2 font-semibold">
            <History className="h-4 w-4" aria-hidden="true" />
            更新履歴
          </summary>
          <ul className="space-y-1 text-white/75">
            {UPDATE_HISTORY_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>

        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLScn8SCvjob9GXjtwctK6JDdIpdIg2pzX-pMDdNryTBQDsXfhw/viewform?usp=sf_link"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm underline"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          テーマ追加希望はこちら
        </a>
      </section>

      <div className="mt-6 flex items-center justify-center text-sm text-white/80">
        &copy; 2024&nbsp;
        <a href="https://x.com/potato4d" target="_blank" rel="noreferrer" className="underline">
          @potato4d
        </a>
      </div>
    </div>
  );
};

export default App;
