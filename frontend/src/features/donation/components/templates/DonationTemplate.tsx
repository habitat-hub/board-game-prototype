'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IoArrowBack, IoSparkles, IoShieldCheckmark } from 'react-icons/io5';

import { donationService } from '@/api/endpoints/donations';

/** 寄付オプションの金額とPrice ID */
type DonationOption = {
  amount: number;
  priceId: string;
};

/** 金額別の寄付メッセージ */
const SUPPORT_MESSAGE_BY_AMOUNT: Readonly<Record<number, string>> = {
  100: '開発者が小さなおやつを食べられます 🍪',
  500: '開発者にコーヒーを差し入れできます ☕',
  1000: '開発者の昼食を支援できます 🍱',
  5000: '開発チームに新しいボードゲームを贈れます 🎲',
  10000: '開発チームに盛大な打ち上げをプレゼントできます 🎉',
};

/**
 * Stripe決済リクエスト向けの冪等性キーを生成する。
 * 利用可能な場合は `crypto.randomUUID()` を優先し、それ以外は Math.random と Date を組み合わせたキーを返す。
 * @returns {string} 冪等性の保証に用いる一意性の高いキー文字列
 */
const createIdempotencyKey = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `donation-${Math.random().toString(36).slice(2)}-${Date.now()}`;
};

/**
 * 寄付ページのテンプレート。Stripe Checkout と連携した寄付ボタンを提供する。
 * @returns ページ要素
 */
const DonationTemplate: React.FC = () => {
  const router = useRouter();
  const idempotencyKeyRef = useRef<string>(createIdempotencyKey());
  const inFlightRef = useRef<boolean>(false);

  const [currency, setCurrency] = useState<string>('JPY');
  const [options, setOptions] = useState<Array<DonationOption>>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [processingAmount, setProcessingAmount] = useState<number | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    let isActive = true;

    const fetchOptions = async () => {
      try {
        setOptionsError(null);
        const data = await donationService.getDonationOptions();

        // エフェクトが無効化された場合の早期リターン
        if (!isActive) return;

        const normalizedCurrency =
          typeof data.currency === 'string' && data.currency.length > 0
            ? data.currency.toUpperCase()
            : 'JPY';
        setCurrency(normalizedCurrency);

        const normalizedOptions = (data.options ?? [])
          .map((option) => ({
            amount:
              typeof option?.amount === 'number' ? option.amount : Number.NaN,
            priceId: typeof option?.priceId === 'string' ? option.priceId : '',
          }))
          .filter(
            (option): option is DonationOption =>
              Number.isInteger(option.amount) &&
              option.amount > 0 &&
              option.priceId.length > 0
          )
          .sort((a, b) => a.amount - b.amount);

        setOptions(normalizedOptions);
        setSelectedOptionIndex((prevIndex) => {
          // 寄付オプションが空の場合は選択状態を解除
          if (normalizedOptions.length === 0) {
            return null;
          }

          // 前回選択が有効範囲内であれば再利用
          if (prevIndex !== null && prevIndex < normalizedOptions.length) {
            return prevIndex;
          }

          const defaultIndex = normalizedOptions.findIndex(
            (option) => option.amount === 100
          );

          // デフォルトの100円オプションが存在する場合は初期選択に設定
          if (defaultIndex !== -1) {
            return defaultIndex;
          }

          return 0;
        });

        // 利用可能な寄付オプションが存在しない場合はエラーメッセージを表示
        if (normalizedOptions.length === 0) {
          setOptionsError('現在、利用可能な寄付オプションがありません。');
        }
      } catch (error: unknown) {
        // エフェクトが無効化済みの場合は以降の処理を中断
        if (!isActive) return;
        console.error('[donations] failed to fetch options', error);
        setOptionsError(
          '寄付オプションの取得に失敗しました。時間を置いて再度お試しください。'
        );
      } finally {
        // エフェクトが有効な場合のみローディング状態を更新
        if (isActive) {
          setIsLoadingOptions(false);
        }
      }
    };

    fetchOptions();

    return () => {
      isActive = false;
    };
  }, []);

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } catch (error) {
      console.warn('[donations] failed to create currency formatter', error);
      return null;
    }
  }, [currency]);

  const formatAmount = useCallback(
    (amount: number) => {
      if (currencyFormatter) {
        return currencyFormatter.format(amount);
      }

      return `¥${amount.toLocaleString('ja-JP')}`;
    },
    [currencyFormatter]
  );

  /**
   * Stripe Checkout セッションを作成してリダイレクト
   */
  const handleCheckout = useCallback(
    async (amount: number): Promise<void> => {
      // 決済処理中（または同期ガード有効）なら二重送信を防止
      if (processingAmount !== null || inFlightRef.current) return;
      inFlightRef.current = true;

      setCheckoutError(null);
      setProcessingAmount(amount);

      try {
        // 冪等性キーを都度生成（重複決済防止）
        const key = createIdempotencyKey();
        idempotencyKeyRef.current = key;
        const session = await donationService.createCheckoutSession(
          { amount },
          { idempotencyKey: key }
        );

        if (!session.url) {
          throw new Error('Stripe Checkout のURLが応答に含まれていません。');
        }

        window.location.assign(session.url);
      } catch (error: unknown) {
        console.error('[donations] failed to start checkout', error);

        if (axios.isAxiosError(error) && error.response?.status === 400) {
          setCheckoutError(
            '選択した寄付金額は現在利用できません。ページを再読み込みしてお試しください。'
          );
        } else {
          setCheckoutError(
            '寄付の手続きに失敗しました。時間を置いて再度お試しください。'
          );
        }

        setProcessingAmount(null);
      } finally {
        inFlightRef.current = false;
      }
    },
    [processingAmount]
  );

  const getSupportMessage = useCallback((amount: number | null) => {
    if (amount == null) {
      return '';
    }

    return (
      SUPPORT_MESSAGE_BY_AMOUNT[amount] ??
      '🌟 継続的な改善に挑む勇気をお届けできます 💪'
    );
  }, []);

  const selectedOption = useMemo(() => {
    if (selectedOptionIndex === null) {
      return null;
    }

    return options[selectedOptionIndex] ?? null;
  }, [options, selectedOptionIndex]);

  // 寄付オプションボタンを左右キーで操作できるようにするキーボードナビゲーション
  const optionsContainerRef = useRef<HTMLDivElement | null>(null);

  const handleKeyNav = useCallback(
    (e: React.KeyboardEvent) => {
      if (!options.length) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      // 決済処理中の場合はスキップ
      if (processingAmount !== null) return;
      e.preventDefault();
      setCheckoutError(null);
      setSelectedOptionIndex((prev) => {
        if (prev == null) return 0;
        const next = e.key === 'ArrowRight' ? prev + 1 : prev - 1;
        if (next < 0) return options.length - 1; // 先頭に戻って循環
        if (next >= options.length) return 0; // 末尾まで到達したら先頭へ循環
        return next;
      });
    },
    [options, processingAmount]
  );

  return (
    <main className="relative mx-auto max-w-3xl px-4 pb-16 pt-24">
      {/* やわらかな装飾背景 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-kibako-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.04),transparent_60%)]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-kibako-primary/15 via-transparent"
      />

      {/* 固定ヘッダー */}
      <div className="fixed left-0 right-0 top-4 z-40 mx-auto flex max-w-3xl items-center justify-between px-4">
        <button
          onClick={() => router.back()}
          className="group rounded-full border border-kibako-primary/20 bg-white/70 p-2 backdrop-blur transition hover:border-kibako-primary/40 hover:bg-white hover:shadow-sm"
          title="前のページに戻る"
        >
          <IoArrowBack className="h-5 w-5 text-kibako-primary transition group-hover:scale-105" />
        </button>
      </div>

      {/* ヒーローセクション */}
      <section className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-kibako-primary/20 bg-white/70 px-4 py-1 text-xs font-medium text-kibako-primary backdrop-blur">
          <IoSparkles className="h-4 w-4" />
          SUPPORT KIBAKO
        </div>
        <h1 className="mt-4 text-balance text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
          KIBAKO に寄付
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-gray-600 sm:text-base">
          ちいさなご支援も、継続的な改善と新しいアイデアの大きな力になります。
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

        <div className="relative grid gap-8">
          <div className="space-y-5 rounded-xl border border-kibako-primary/10 bg-white/60 p-5 text-sm text-gray-700 shadow-sm backdrop-blur-sm">
            {isLoadingOptions ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={`donation-skeleton-${index}`}
                    className="h-12 animate-pulse rounded-full bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100"
                  />
                ))}
              </div>
            ) : optionsError ? (
              <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/90 p-3 text-sm text-red-700">
                {optionsError}
              </p>
            ) : (
              <div className="space-y-4">
                <div
                  ref={optionsContainerRef}
                  role="radiogroup"
                  aria-label="寄付金額を選択"
                  className="flex gap-2 overflow-x-auto pb-1"
                  onKeyDown={handleKeyNav}
                >
                  {options.map((option, index) => {
                    const isSelected = selectedOptionIndex === index;
                    return (
                      <button
                        key={option.priceId}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => {
                          if (processingAmount !== null) return;
                          setSelectedOptionIndex(index);
                          setCheckoutError(null);
                        }}
                        disabled={processingAmount !== null}
                        className={`relative inline-flex min-w-fit items-center justify-center rounded-full border px-5 py-2 text-sm font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kibako-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 ${
                          isSelected
                            ? 'border-kibako-primary bg-gradient-to-br from-kibako-primary/15 to-kibako-accent/10 text-kibako-primary shadow-sm ring-1 ring-inset ring-kibako-primary/30'
                            : 'border-kibako-primary/20 bg-white/70 text-gray-700 hover:border-kibako-primary/40 hover:text-kibako-primary'
                        }`}
                      >
                        {formatAmount(option.amount)}
                        {isSelected && (
                          <span
                            aria-hidden
                            className="absolute inset-0 rounded-full ring-2 ring-kibako-primary/30 animate-in fade-in"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-kibako-primary/15 bg-white/80 p-5 shadow-sm">
                  {selectedOption ? (
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatAmount(selectedOption.amount)} の寄付で…
                        </p>
                        <p className="text-base font-medium text-gray-700">
                          {getSupportMessage(selectedOption?.amount ?? null)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          selectedOption
                            ? handleCheckout(selectedOption.amount)
                            : null
                        }
                        disabled={processingAmount !== null}
                        className="group inline-flex items-center justify-center gap-2 rounded-full bg-kibako-accent px-7 py-2 text-sm font-bold text-white shadow transition-all hover:shadow-md hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kibako-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {processingAmount === selectedOption.amount ? (
                          <>
                            <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-white/70 border-t-transparent" />
                            決済準備中…
                          </>
                        ) : (
                          <>寄付する</>
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      寄付したい金額を選ぶと、具体的な使い道が表示されます。
                    </p>
                  )}
                </div>
              </div>
            )}

            {checkoutError ? (
              <p className="rounded-lg border border-red-200 bg-red-50/90 p-3 text-sm text-red-700">
                {checkoutError}
              </p>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-kibako-primary/15 bg-white/70 p-3 text-[11px] text-gray-600">
                <IoShieldCheckmark className="h-4 w-4 flex-shrink-0 text-kibako-primary" />
                <ul className="space-y-1">
                  <li>Stripe の安全な決済システムを利用しています。</li>
                  <li>カード情報は KIBAKO 上では保持されません。</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs font-medium text-gray-500">
          みなさまの寄付が、より良い KIBAKO をつくる原動力になります！
        </p>
      </section>
    </main>
  );
};

export default DonationTemplate;
