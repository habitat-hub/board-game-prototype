'use client';

import { loadStripe } from '@stripe/stripe-js';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { IoArrowBack } from 'react-icons/io5';

import { donationsService } from '@/api/endpoints/donations';
import KibakoButton from '@/components/atoms/KibakoButton';

type DonationOption = {
  amount: number;
  title: string;
  description: string;
  highlight?: boolean;
};

const donationOptions: DonationOption[] = [
  {
    amount: 100,
    title: 'First Step Supporter',
    description: 'コーヒー1杯分のご支援で、日々の改善を後押しできます。',
  },
  {
    amount: 500,
    title: 'Prototype Booster',
    description: 'UI/UX 改善や細かな調整の継続に活用させていただきます。',
  },
  {
    amount: 1000,
    title: 'Feature Explorer',
    description: '新機能の検証や安定化のための開発コストに充てられます。',
  },
  {
    amount: 5000,
    title: 'Expansion Creator',
    description: '大きな機能追加やサーバー運用費の確保に繋がります。',
  },
  {
    amount: 10000,
    title: 'Premium Patron',
    description: '長期的な開発体制を支える心強いご支援です。',
    highlight: true,
  },
];

const fallbackErrorMessage =
  '寄付の手続き中に問題が発生しました。時間をおいて再度お試しください。';

/**
 * 寄付ページのテンプレート。Stripe Checkout を利用して安全に寄付を受け付けます。
 * @returns ページ要素
 */
const DonationTemplate: React.FC = () => {
  const router = useRouter();
  const [processingAmount, setProcessingAmount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const publishableKey = useMemo(
    () => process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    []
  );

  const handleDonate = async (amount: number) => {
    try {
      setErrorMessage(null);
      setProcessingAmount(amount);

      if (!publishableKey) {
        throw new Error(
          'Stripe の公開鍵が設定されていません。環境変数を確認してください。'
        );
      }

      const { sessionId, sessionUrl } =
        await donationsService.createCheckoutSession({ amount });

      const stripe = await loadStripe(publishableKey);

      if (!stripe) {
        if (sessionUrl) {
          window.location.href = sessionUrl;
          return;
        }
        throw new Error('Stripe の初期化に失敗しました。');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        if (sessionUrl) {
          window.location.href = sessionUrl;
          return;
        }
        throw error;
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const responseMessage = error.response?.data?.error;
        setErrorMessage(
          typeof responseMessage === 'string'
            ? responseMessage
            : fallbackErrorMessage
        );
      } else {
        const message =
          error instanceof Error && error.message
            ? error.message
            : fallbackErrorMessage;
        setErrorMessage(message);
      }
    } finally {
      setProcessingAmount(null);
    }
  };

  return (
    <main className="relative mx-auto max-w-3xl px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-kibako-primary/10 via-transparent to-kibako-accent/10"
      />

      <div className="sticky top-20 z-sticky flex items-center gap-3 rounded-lg bg-transparent py-4 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="rounded-full p-2 transition-colors hover:bg-kibako-tertiary"
          title="前のページに戻る"
        >
          <IoArrowBack className="h-5 w-5 text-kibako-primary transition-colors hover:text-kibako-primary" />
        </button>
      </div>

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
          はボードゲームのアイデアを試して直してまた遊ぶことができるオンラインサービスです。Stripe
          Checkout を通じて安全に寄付をお受けしています。
        </p>
      </section>

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

          <div>
            <h2 className="text-lg font-bold text-gray-900">ご支援メニュー</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {donationOptions.map((option) => (
                <div
                  key={option.amount}
                  className={`flex h-full flex-col justify-between rounded-xl border border-kibako-primary/10 bg-white/70 p-4 shadow-sm ${
                    option.highlight ? 'sm:col-span-2' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {option.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {option.description}
                    </p>
                  </div>
                  <KibakoButton
                    variant="accent"
                    size="lg"
                    className="mt-4 w-full flex-col gap-1 text-base"
                    onClick={() => handleDonate(option.amount)}
                    disabled={
                      processingAmount !== null &&
                      processingAmount !== option.amount
                    }
                    isLoading={processingAmount === option.amount}
                    aria-label={`¥${option.amount.toLocaleString()} を寄付する`}
                  >
                    <span className="text-lg font-extrabold">
                      ¥{option.amount.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wide">
                      donate
                    </span>
                  </KibakoButton>
                </div>
              ))}
            </div>
            {errorMessage && (
              <div
                className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                role="alert"
                aria-live="assertive"
              >
                {errorMessage}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-kibako-primary/5 p-4 text-sm text-gray-700">
            決済には Stripe Checkout を利用しています。KIBAKO
            はカード情報を保持しません。決済完了後は Stripe の案内に従って
            KIBAKO に戻っていただけます。
          </div>

          <div className="rounded-xl bg-white/70 p-4 text-xs text-gray-600">
            <p>
              ・寄付完了後、登録されたメールアドレスに Stripe
              からレシートメールが送信されます。
            </p>
            <p className="mt-1">
              ・決済画面で「キャンセル」を選択するとこのページに戻ります。再度金額ボタンからお手続きいただけます。
            </p>
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
