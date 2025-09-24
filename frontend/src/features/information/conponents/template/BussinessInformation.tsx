'use client';

import { useRouter } from 'next/navigation';
import type { AppRouterInstance } from 'next/navigation';
import React from 'react';
import { IoArrowBack } from 'react-icons/io5';

/**
 * 情報提供ページテンプレート（特定商取引法に基づく表記 / 運営情報などのまとめ）。
 * 現時点ではダミー情報であり、実データが確定次第差し替える。
 */
const BussinessInformation: React.FC = () => {
  const router: AppRouterInstance = useRouter();
  return (
    <main className="relative mx-auto max-w-4xl px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-kibako-primary/5 via-transparent to-kibako-accent/5"
      />

      {/* Header / Back */}
      <div className="sticky top-20 z-sticky flex items-center gap-3 py-4 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-kibako-tertiary transition-colors"
          title="前のページに戻る"
        >
          <IoArrowBack className="h-5 w-5 text-kibako-primary" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          サービス情報 / 運営情報
        </h1>
      </div>

      <section className="mt-4 space-y-10 text-sm leading-relaxed text-gray-700">
        {/* Legend / Notice */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-xs text-rose-600 font-semibold shadow-sm">
          表示中の <span className="font-bold">赤字</span>{' '}
          情報はダミーです。正式リリース時に確定事項へ差し替えます。
        </div>
        {/* About the Service */}
        <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm backdrop-blur">
          <h2 className="text-lg font-semibold text-gray-900">サービス概要</h2>
          <p className="mt-2">
            本ページは
            KIBAKO（以下「本サービス」）に関する基本的な情報をまとめたものです。内容はダミーであり、正式確定後に更新されます。
          </p>
          <ul className="mt-4 list-disc list-inside space-y-1">
            <li>
              ボードゲームのアイデアを管理 / 記録 /
              テストできるオンラインプラットフォーム
            </li>
            <li>プロトタイピング、画像管理、権限管理などの支援機能</li>
            <li>将来的に公開共有、コラボレーション、寄付/課金機能を予定</li>
          </ul>
        </div>

        {/* Company / Seller Info (Dummy) */}
        <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            運営者情報{' '}
            <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-rose-600">
              DUMMY
            </span>
          </h2>
          <dl className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-3">
            <dt className="font-medium text-gray-600">事業者名</dt>
            <dd className="sm:col-span-2 text-rose-600 font-medium">
              KIBAKO Labs（仮）
            </dd>
            <dt className="font-medium text-gray-600">運営責任者</dt>
            <dd className="sm:col-span-2 text-rose-600 font-medium">
              山田 太郎（ダミー）
            </dd>
            <dt className="font-medium text-gray-600">所在地</dt>
            <dd className="sm:col-span-2 text-rose-600 font-medium">
              東京都新宿区〇〇 0-0-0（ダミー）
            </dd>
            <dt className="font-medium text-gray-600">お問い合わせ</dt>
            <dd className="sm:col-span-2 text-rose-600 font-medium">
              support@example.com（ダミー）
            </dd>
            <dt className="font-medium text-gray-600">サイトURL</dt>
            <dd className="sm:col-span-2 text-rose-600 font-medium">
              https://example.com (仮)
            </dd>
          </dl>
          <p className="mt-4 text-xs text-gray-500">
            ※ 上記は一時的なプレースホルダーです。
          </p>
        </div>

        {/* Fees & Pricing */}
        <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            利用料金 / 価格
          </h2>
          <p className="mt-2 text-rose-600 font-medium">
            現在は無料でご利用いただけます。将来的に以下のようなプランを検討しています（全てダミー）。
          </p>
          <ul className="mt-3 space-y-1">
            <li className="text-rose-600">
              Free: 基本的なボードゲームプロトタイプ管理
            </li>
            <li className="text-rose-600">
              Pro: 高度な分析 / 画像ストレージ拡張 / チームコラボ
            </li>
            <li className="text-rose-600">
              Supporter: 追加支援・早期アクセス・限定フィードバック参加
            </li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            正式な料金はリリース時に告知いたします。
          </p>
        </div>

        {/* Payment / Donation Info */}
        <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            支払い方法（予定 / ダミー）
          </h2>
          <p className="mt-2 text-rose-600 font-medium">
            寄付または有料プラン導入時に以下の決済手段を検討しています。
          </p>
          <ul className="mt-3 space-y-1">
            <li className="text-rose-600">クレジットカード（Stripe 経由）</li>
            <li className="text-rose-600">デビットカード</li>
            <li className="text-rose-600">一部ウォレットサービス</li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            実際の導入手段は変更される可能性があります。
          </p>
        </div>

        {/* Cancellation / Refund */}
        <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            解約・キャンセル・返金
          </h2>
          <ul className="mt-3 list-disc list-inside space-y-1 text-rose-600 font-medium">
            <li>現状：解約・返金に該当する有料機能は未提供</li>
            <li>
              将来：月額課金の場合、次回更新日前にキャンセルが可能（予定）
            </li>
            <li>返金ポリシーは提供開始前に明確化します（ダミー）</li>
          </ul>
        </div>

        {/* Supported Environment */}
        <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            動作環境（推奨 / ダミー）
          </h2>
          <ul className="mt-3 space-y-1 text-rose-600 font-medium">
            <li>最新の Chrome / Firefox / Safari / Edge</li>
            <li>タブレット端末（横向き）一部最適化予定</li>
            <li>スマートフォン：段階的に対応中</li>
          </ul>
        </div>

        {/* Intellectual Property */}
        <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">知的財産権</h2>
          <p className="mt-2 text-rose-600 font-medium">
            ユーザーが登録したボードゲームのアイデア・画像等の権利はユーザー本人に帰属します。運営は機能改善・不正監視のために内容を参照する場合があります（ダミー）。
          </p>
        </div>

        {/* Disclaimer */}
        <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            免責事項（ダミー）
          </h2>
          <ul className="mt-3 list-disc list-inside space-y-1 text-rose-600 font-medium">
            <li>サービスは現状有姿で提供されます</li>
            <li>
              データ損失防止のためエクスポート機能（予定）をご利用ください
            </li>
            <li>第三者間のトラブルについては原則関与いたしません</li>
          </ul>
        </div>

        {/* Revision History */}
        <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            改定履歴（ダミー）
          </h2>
          <ol className="mt-3 list-decimal list-inside space-y-1 text-xs text-rose-600 font-medium">
            <li>2025-09-24 初版（ダミー作成）</li>
          </ol>
        </div>

        <p className="text-center text-xs text-rose-600 font-semibold">
          本ページの記載は全て仮情報です。正式版公開時に通知します。
        </p>
      </section>
    </main>
  );
};

export default BussinessInformation;
