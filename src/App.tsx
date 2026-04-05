import React from 'react';
import { ExternalLink, History } from 'lucide-react';
import TierList from './components/TierList';
import { I18nProvider, useI18n } from './i18n';

const AppContent: React.FC = () => {
  const i18n = useI18n();

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
            {i18n.t('app.updateHistoryTitle')}
          </summary>
          <ul className="space-y-1 text-white/75">
            {i18n.t('app.updateHistoryItems').map((item) => (
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
          {i18n.t('app.requestThemeLink')}
        </a>
      </section>

      <div className="mx-auto mt-6 w-full max-w-[816px] text-center text-sm text-white/80">
        &copy; 2024&nbsp;
        <a href="https://x.com/potato4d" target="_blank" rel="noreferrer" className="underline">
          @potato4d
        </a>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <I18nProvider>
    <AppContent />
  </I18nProvider>
);

export default App;
