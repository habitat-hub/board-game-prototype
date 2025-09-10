'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { IoArrowBack } from 'react-icons/io5';

import KibakoButton from '@/components/atoms/KibakoButton';

/**
 * 寄付ページのテンプレート。KIBAKOへの支援内容と今後の案内を表示する静的コンポーネント。
 * @returns ページ要素
 */
const DonationTemplate: React.FC = () => {
  const router = useRouter();

  return (
    <main className="relative mx-auto max-w-3xl px-4 py-10">
      {/* Decorative background gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-kibako-primary/10 via-transparent to-kibako-accent/10"
      />

      {/* Sticky header with back button */}
      <div className="sticky top-20 z-sticky bg-transparent backdrop-blur-sm flex items-center gap-3 py-4 rounded-lg">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-kibako-tertiary rounded-full transition-colors"
          title="前のページに戻る"
        >
          <IoArrowBack className="h-5 w-5 text-kibako-primary hover:text-kibako-primary transition-colors" />
        </button>
      </div>

      {/* Hero */}
      <section className="mb-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-kibako-primary/20 bg-white/60 px-3 py-1 text-xs font-bold text-kibako-primary shadow-sm backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-kibako-accent" />
          Support KIBAKO
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">
          KIBAKO を支援する
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-600">
          KIBAKO
          はボードゲームのアイデアを試して直してまた遊ぶことができるオンライン
          サービスです。さらに発展させるため、日々機能の追加や改善に取り組んでいます。
        </p>
      </section>

      {/* Content card */}
      <section className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-lg backdrop-blur">
        <div className="grid gap-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">寄付の使い道</h2>
            <p className="mt-2 text-sm text-gray-600">
              いただいたご支援は以下の用途に大切に使わせていただきます。
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-800">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-base">🚀</span>
                <span>新機能の開発や既存機能の改善</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-base">🖥️</span>
                <span>サーバーやドメインなどの運営費</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-base">🔧</span>
                <span>外部 API やライブラリの利用料</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-kibako-primary/5 p-4 text-sm text-gray-700">
            現在、寄付受付の準備を進めています。準備が整い次第、このページから寄付を
            行えるようになります。
          </div>

          <div className="flex flex-col items-center justify-center gap-2 pt-2">
            <KibakoButton
              variant="accent"
              size="lg"
              disabled
              className="w-full max-w-xs"
            >
              KIBAKOに寄付する
            </KibakoButton>
            <span className="text-xs text-gray-500">近日公開予定</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          みなさまの応援が、より良い KIBAKO をつくる原動力になります。
        </p>
      </section>
    </main>
  );
};

export default DonationTemplate;
