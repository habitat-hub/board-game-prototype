import React from 'react';
import { IoSparkles } from 'react-icons/io5';

import KibakoLink from '@/components/atoms/KibakoLink';

/**
 * 寄付完了後のサンクス表示テンプレート。
 * DonationTemplate と視覚的一貫性を持たせた背景 / レイアウト / トーンを再利用。
 * ページ固有の metadata は利用側 (page.tsx) で設定してください。
 */
const DonateSuccessTemplate: React.FC = () => {
  return (
    <main className="relative mx-auto max-w-3xl px-4 pb-20 pt-24">
      {/* DonationTemplate と同じ装飾背景 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-kibako-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.04),transparent_60%)]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-kibako-primary/15 via-transparent"
      />

      {/* ヒーローセクション */}
      <section className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-kibako-primary/20 bg-white/70 px-4 py-1 text-xs font-medium text-kibako-primary backdrop-blur">
          <IoSparkles className="h-4 w-4" />
          THANK YOU
        </div>
        <h1 className="mt-4 text-balance text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
          ご支援ありがとうございます
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-sm text-gray-600 sm:text-base">
          いただいたご支援は KIBAKO の継続的な改善の大きな力になります。
        </p>
      </section>

      {/* コンテンツカード */}
      <section className="relative rounded-3xl border border-black/5 bg-white/80 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md sm:p-8">
        {/* グラデーションのアクセントリング */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl [mask:linear-gradient(white,transparent)]"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-kibako-primary/10 via-transparent to-kibako-accent/10" />
        </div>

        <div className="relative space-y-8">
          <div className="space-y-5 rounded-xl border border-kibako-primary/10 bg-white/60 p-6 text-sm text-gray-700 shadow-sm backdrop-blur-sm">
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-bold text-kibako-primary sm:text-3xl">
                心より感謝いたします
              </h2>
              <p className="text-base leading-relaxed text-gray-700">
                ご協力いただいた寄付は、プロジェクトの品質向上・新機能の企画のために大切に活用させていただきます。
              </p>
            </div>

            <div className="flex justify-center">
              <KibakoLink
                href="/projects"
                variant="accent"
                size="lg"
                className="inline-flex items-center gap-2"
              >
                プロジェクト一覧に戻る
              </KibakoLink>
            </div>
          </div>

          <p className="text-center text-xs font-medium text-gray-500">
            これからも KIBAKO をよろしくお願いいたします。
          </p>
        </div>
      </section>
    </main>
  );
};

export default DonateSuccessTemplate;
