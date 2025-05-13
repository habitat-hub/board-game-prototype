'use client';

import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const LandingPage: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollYProgress } = useScroll();

  // パララックス効果のための変換値
  const featuresY = useTransform(scrollYProgress, [0.1, 0.3], [100, 0]);
  const featuresOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);

  // ページ読み込み後のアニメーション開始のため
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // カード要素のバリアント
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.8,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 overflow-x-hidden pt-6 md:pt-8">
      {/* キャッチコピーセクション（最上部に配置） */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="py-8 md:py-10 bg-gradient-to-r from-amber-600 to-amber-800 relative overflow-hidden rounded-3xl mx-4 md:mx-6 shadow-lg"
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
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              <motion.span
                className="inline-block"
                whileHover={{ scale: 1.05 }}
              >
                試して
              </motion.span>{' '}
              <motion.span
                className="inline-block"
                whileHover={{ scale: 1.05 }}
              >
                直して
              </motion.span>{' '}
              <motion.span
                className="inline-block"
                whileHover={{ scale: 1.05 }}
              >
                また遊ぶ
              </motion.span>
            </motion.h2>
            <motion.p
              className="mt-3 md:mt-4 text-xl md:text-2xl text-white font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              ボドゲづくりは
              <span className="font-bold text-amber-200 drop-shadow-md">
                KIBAKO
              </span>
              で
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* アニメーションするヒーローセクション */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-amber-600 opacity-5 -skew-y-6 transform origin-top-left z-0 rounded-3xl"></div>
        <div className="container mx-auto px-4 py-12 md:py-24 relative z-10">
          <AnimatePresence>
            {isLoaded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="flex flex-col md:flex-row items-center justify-between"
              >
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="md:w-1/2 mb-10 md:mb-0"
                >
                  <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-5xl md:text-6xl font-bold text-amber-900 mb-6 relative"
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
                    className="text-xl md:text-2xl font-medium text-amber-800 mb-8"
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
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <Link href="/">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 bg-amber-600 text-white rounded-2xl font-medium hover:bg-amber-700 transition text-center shadow-md"
                      >
                        今すぐ始める
                      </motion.div>
                    </Link>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="md:w-1/2"
                >
                  <div className="rounded-3xl shadow-xl bg-amber-50 p-4 relative">
                    {/* ゲームボード画像のアニメーション効果 */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 10,
                      }}
                      className="w-full h-64 bg-amber-100 rounded-2xl flex items-center justify-center overflow-hidden relative"
                    >
                      <motion.div
                        className="absolute inset-0 bg-amber-600 opacity-5"
                        animate={{
                          backgroundPosition: ['0% 0%', '100% 100%'],
                        }}
                        transition={{
                          duration: 20,
                          ease: 'linear',
                          repeat: Infinity,
                          repeatType: 'reverse',
                        }}
                      />

                      {/* 模擬的なゲームボード要素 */}
                      <div className="relative w-4/5 h-4/5 flex">
                        <motion.div
                          animate={{ rotate: [0, 5, 0, -5, 0] }}
                          transition={{ duration: 10, repeat: Infinity }}
                          className="absolute top-5 left-5 w-20 h-32 bg-amber-200 rounded-2xl shadow-md"
                        />
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 5, repeat: Infinity }}
                          className="absolute top-12 right-10 w-16 h-16 bg-rose-300 rounded-full shadow-md"
                        />
                        <motion.div
                          animate={{ x: [0, 10, 0, -10, 0] }}
                          transition={{ duration: 7, repeat: Infinity }}
                          className="absolute bottom-5 left-10 w-24 h-16 bg-amber-300 rounded-2xl shadow-md"
                        />
                        <motion.div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-amber-800 font-medium">
                            ゲームボードのイメージ
                          </p>
                        </motion.div>
                      </div>
                    </motion.div>
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
        <div className="container mx-auto px-4">
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
                  'バージョンを作成し、プレビュールームでゲームを実際にテストできます。',
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
        <div className="absolute inset-0 bg-amber-200 opacity-30 transform -skew-y-3 origin-top z-0 rounded-3xl"></div>
        <div className="container mx-auto px-4 relative z-10">
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

        <div className="container mx-auto px-4 relative z-10">
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
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-amber-200 mb-10"
            >
              KIBAKOで創造力を解き放ち、あなたのゲームアイデアをプレイ可能な試作品に変えましょう。
            </motion.p>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link href="/">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-amber-600 text-white rounded-2xl font-medium hover:bg-amber-700 transition text-center shadow-md"
                >
                  今すぐ始める
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
