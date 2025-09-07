'use client';

import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { GiWoodenCrate } from 'react-icons/gi';

import FloatingActionButton from '@/features/top/components/atoms/FloatingActionButton';
import ShareLinkButton from '@/features/top/components/atoms/ShareLinkButton';
import CatchCopyCard from '@/features/top/components/molecules/CatchCopyCard';
import MiniGameBoard from '@/features/top/components/organisms/MiniGameBoard';
import { useIsPC } from '@/hooks/useIsPC';

/**
 * トップページのランディング。PC限定UIの案内やヒーロー/特徴/案内セクションを含む。
 */
const TopPage: React.FC = () => {
  const { isPC, isReady } = useIsPC();
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollYProgress } = useScroll();

  // パララックス効果のための変換値
  const featuresY = useTransform(scrollYProgress, [0.1, 0.3], [100, 0]);
  const featuresOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);

  // ページ読み込み後のアニメーション開始のため
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 非PCデバイスの場合にのみ案内を表示する判定
  const isNonPC = isReady && !isPC;

  // カード要素のバリアント
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.8,
        ease: 'easeOut' as const,
      },
    }),
  };

  return (
    <div className="overflow-x-hidden relative">
      <FloatingActionButton />
      {/* KIBAKOロゴアニメーション（最上部に配置） */}
      <motion.div
        className="w-full py-16 flex flex-col items-center justify-center overflow-hidden relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="relative"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.3,
          }}
        >
          {/* アイコン背景のグローエフェクト */}
          <motion.div
            className="absolute inset-0 bg-amber-400 rounded-full blur-xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.3 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />

          {/* メインアイコン */}
          <motion.div
            className="relative z-10 bg-gradient-to-br from-amber-500 to-amber-700 p-6 rounded-full shadow-2xl"
            whileHover={{
              rotate: [-5, 5, -5, 5, 0],
              transition: { duration: 0.5 },
            }}
          >
            <GiWoodenCrate className="text-6xl md:text-7xl lg:text-8xl text-white drop-shadow-lg" />
          </motion.div>
        </motion.div>

        {/* KIBAKO タイトルテキスト */}
        <motion.h1
          className="text-5xl md:text-6xl lg:text-7xl font-bold mt-6 text-amber-800 tracking-wider"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 10,
            delay: 0.7,
          }}
        >
          KIBAKO
        </motion.h1>

        {/* タグライン */}
        <motion.p
          className="text-xl text-amber-600 mt-4 font-medium tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
        >
          ボードゲーム試作品をカンタンに
        </motion.p>

        {/* 装飾ライン */}
        <motion.div
          className="h-1 w-24 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mt-6"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '6rem', opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        />
      </motion.div>

      {isNonPC && (
        <div className="text-center text-xs text-gray-600 mt-2">
          <p>このサービスはPC専用のサービスです。</p>
          <ShareLinkButton />
        </div>
      )}

      {/* キャッチコピーセクション */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="mt-4 py-12 md:py-16 bg-gradient-to-r from-amber-600 to-amber-800 relative overflow-hidden rounded-3xl mx-2 md:mx-4 lg:mx-6 shadow-xl"
      >
        {/* ドットパターンの背景アニメーション - より大きく明るいドット */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 30,
              ease: 'linear',
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="w-full h-full opacity-30 bg-[radial-gradient(circle,_#ffffff_2px,_transparent_2px)] bg-[length:30px_30px]"
          />
        </div>

        {/* 浮遊するダイス・カードのような要素 */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute w-12 h-12 bg-amber-200 opacity-40 rounded-lg"
            animate={{
              x: [0, 100, 50, -70, 0],
              y: [0, -50, 30, 10, 0],
              rotate: [0, 90, 180, 270, 360],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: 'loop',
            }}
          />
          <motion.div
            className="absolute w-8 h-8 bg-amber-300 opacity-40 rounded-lg left-1/4 top-1/2"
            animate={{
              x: [0, -70, 30, 100, 0],
              y: [0, 30, -40, 20, 0],
              rotate: [0, -120, 60, -180, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              repeatType: 'loop',
            }}
          />
          <motion.div
            className="absolute w-10 h-10 bg-rose-200 opacity-40 rounded-full right-1/4 bottom-1/3"
            animate={{
              x: [0, 80, -50, -30, 0],
              y: [0, -40, 10, 50, 0],
              scale: [1, 1.2, 0.9, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'loop',
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="mb-6 flex flex-wrap justify-center items-center">
              {/* 実験フラスコアイコン - 実験・試すことを表現 */}
              <CatchCopyCard
                text="試して"
                frontColor="#d97706"
                backColor="#9a3412" // より濃い色に変更 (amber-900に近い)
                delay={0.2}
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                }
              />

              {/* レンチアイコン - 修正・調整を表現 */}
              <CatchCopyCard
                text="直して"
                frontColor="#b45309"
                backColor="#78350f" // より濃い色に変更 (amber-900)
                delay={0.4}
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                }
              />

              {/* リフレッシュ/リピートアイコン - 繰り返しプレイを表現 */}
              <CatchCopyCard
                text="また遊ぶ"
                frontColor="#92400e"
                backColor="#854d0e" // より濃い色に変更 (amber-800)
                delay={0.6}
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                }
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* アニメーションするヒーローセクション */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-amber-600 opacity-5 -skew-y-6 transform origin-top-left z-base rounded-3xl"></div>
        <div className="container-fluid w-full max-w-[1800px] mx-auto px-4 py-12 md:py-24 relative z-10">
          <AnimatePresence>
            {isLoaded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="flex flex-col md:flex-row items-center justify-between"
              >
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="w-full md:w-1/3 flex flex-col justify-center items-center text-center"
                >
                  <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold text-amber-900 mb-6 relative"
                  >
                    <span className="relative inline-block">
                      KIBAKO
                      <motion.span
                        className="absolute -bottom-2 left-0 w-full h-2 bg-amber-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ delay: 1, duration: 0.8 }}
                      />
                    </span>
                  </motion.h1>

                  <motion.h2
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="text-xl md:text-2xl font-medium text-amber-800 mb-6"
                  >
                    ボードゲームテストプレイアプリ
                  </motion.h2>

                  <motion.p
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="text-lg text-amber-700 mb-8"
                  >
                    アイデアを素早く試作品に。
                    <br />
                    ボードゲームをオンライン上で作成し、
                    <br />
                    繰り返しテストプレイできます。
                  </motion.p>

                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="hidden md:flex flex-col md:flex-row gap-4 justify-center"
                  >
                    <Link href="/login">
                      <motion.div
                        className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-bold shadow-lg hover:shadow-amber-300/50"
                        whileHover={{
                          scale: 1.05,
                          boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <GiWoodenCrate className="text-xl" />
                        <span>今すぐ始める</span>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="ml-1"
                        >
                          →
                        </motion.div>
                      </motion.div>
                    </Link>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="w-full md:w-2/3 hidden md:block"
                >
                  <div className="rounded-3xl shadow-xl bg-amber-50 p-4 relative">
                    {/* インタラクティブなゲームボード */}
                    <MiniGameBoard className="shadow-inner border border-amber-200" />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 特徴セクション */}
      <motion.div
        style={{ opacity: featuresOpacity, y: featuresY }}
        className="bg-amber-50 py-16 rounded-t-3xl rounded-b-3xl"
      >
        <div className="container-fluid max-w-[1800px] mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-3xl font-bold text-amber-900 text-center mb-12"
          >
            KIBAKO の特徴
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                ),
                title: '簡単な試作品作成',
                description:
                  'カード、トークン、ボードなどのゲーム要素を直感的に作成、編集できます。',
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                ),
                title: '共同作業',
                description:
                  'チームメンバーと一緒に試作品を作成、編集できます。リアルタイムの変更が可能です。',
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                ),
                title: 'テストプレイ',
                description:
                  'バージョンを作成し、プレイルームでゲームを実際にテストできます。',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={cardVariants}
                className="bg-amber-100 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-amber-200"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  className="text-amber-600 text-4xl mb-4 bg-amber-50 p-3 rounded-2xl inline-block"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {feature.icon}
                  </svg>
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-amber-900">
                  {feature.title}
                </h3>
                <p className="text-amber-700">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 使い方セクション */}
      <div className="py-16 relative">
        <div className="absolute inset-0 bg-amber-200 opacity-30 transform -skew-y-3 origin-top z-base rounded-3xl"></div>
        <div className="container-fluid max-w-[1800px] mx-auto px-4 relative z-10">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-3xl font-bold text-amber-900 text-center mb-12"
          >
            使い方
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                num: 1,
                title: 'アカウント作成',
                desc: '簡単にアカウント登録',
              },
              {
                num: 2,
                title: '試作品作成',
                desc: 'ゲーム要素をデザイン',
              },
              { num: 3, title: '共有', desc: 'チームメンバーと共同作業' },
              {
                num: 4,
                title: 'テストプレイ',
                desc: '試作品でゲームをテスト',
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.8 }}
                className="text-center bg-amber-50 p-6 rounded-3xl shadow-sm"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-amber-100 text-amber-600 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4 border-2 border-amber-200 shadow-md"
                >
                  {step.num}
                </motion.div>
                <h3 className="font-semibold mb-2 text-amber-900">
                  {step.title}
                </h3>
                <p className="text-amber-700">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 始める案内セクション */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="bg-amber-800 py-20 relative overflow-hidden rounded-t-3xl"
      >
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="absolute top-0 left-0 w-full h-full opacity-10"
        >
          <div className="absolute top-10 left-10 w-40 h-40 bg-amber-50 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-amber-50 rounded-full"></div>
          <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-amber-50 rounded-full"></div>
        </motion.div>

        <div className="container-fluid max-w-[1800px] mx-auto px-4 relative z-10">
          <div className="text-center">
            <motion.h2
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-3xl md:text-4xl font-bold text-amber-100 mb-6"
            >
              あなたのボードゲームを今すぐ形に
            </motion.h2>
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-xl text-amber-200 mb-10"
            >
              KIBAKOで創造力を解き放ち、あなたのゲームアイデアをプレイ可能な試作品に変えましょう。
            </motion.p>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="hidden md:block"
            >
              <Link href="/login">
                <motion.div
                  className="inline-flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-bold shadow-lg hover:shadow-amber-300/50"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <GiWoodenCrate className="text-xl" />
                  <span>今すぐ始める</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="ml-1"
                  >
                    →
                  </motion.div>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TopPage;
