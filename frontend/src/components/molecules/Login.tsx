'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { FaGoogle, FaDice, FaChessBoard } from 'react-icons/fa';
import { GiWoodenCrate, GiCardAceSpades, GiPuzzle } from 'react-icons/gi';

import { useAuth } from '@/api/hooks/useAuth';
import Button from '@/components/atoms/Button';
import Loading from '@/components/organisms/Loading';

function Login() {
  const router = useRouter();
  const { getUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ユーザーがログイン済みか確認
    getUser()
      .then((user) => {
        // ユーザーデータが存在する場合
        if (user && user.id) {
          // /projects にリダイレクト
          router.replace('/projects');
        }

        setIsLoading(false);
      })
      .catch((error) => {
        // エラーがあった場合はログイン画面を表示する
        console.error('Login check error:', error);
        setIsLoading(false);
      });
  }, [getUser, router]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <div className="p-6 sm:p-8 md:p-12 rounded-lg border border-kibako-secondary/20 shadow-xl w-full max-w-md sm:max-w-lg md:w-1/2 text-center flex flex-col bg-kibako-white mx-auto">
        {/* タイトル */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-wider text-kibako-primary">
          KIBAKO
        </h1>

        {/* ロゴ部分 */}
        <div className="flex items-center justify-center mt-8 sm:mt-12">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* サイコロ */}
            <FaDice className="text-4xl sm:text-6xl text-kibako-primary/60 transform rotate-12" />

            {/* トランプ */}
            <GiCardAceSpades className="text-4xl sm:text-6xl text-kibako-primary/60 transform -rotate-12" />

            {/* メインの木箱アイコン */}
            <GiWoodenCrate className="text-5xl sm:text-7xl drop-shadow-lg text-kibako-accent" />

            {/* パズル */}
            <GiPuzzle className="text-4xl sm:text-6xl text-kibako-primary/60 transform rotate-6" />

            {/* チェスボード */}
            <FaChessBoard className="text-4xl sm:text-6xl text-kibako-primary/60 transform -rotate-6" />
          </div>
        </div>

        {/* サインアップ・ログイン部分 */}
        <div className="flex flex-col gap-4 items-center mt-12 sm:mt-16">
          {/* サインアップボタン */}
          <Button
            variant="accent"
            className="!px-6 !py-4 !text-lg"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
            }}
          >
            <div className="flex items-center gap-3">
              <FaGoogle className="text-2xl" />
              <span>Googleでサインアップ</span>
            </div>
          </Button>

          {/* ログインボタン */}
          <button
            className="rounded-full font-semibold transition-colors bg-transparent text-kibako-primary/70 hover:text-kibako-primary border border-kibako-primary/30 hover:border-kibako-primary/50 px-4 py-2 text-sm"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
            }}
          >
            <div className="flex items-center gap-2">
              <FaGoogle className="text-lg" />
              <span>既にアカウントをお持ちの方はログイン</span>
            </div>
          </button>
        </div>

        {/* サブタイトル */}
        <p className="text-kibako-primary mt-6 sm:mt-8 text-sm sm:text-base">
          KIBAKOでボードゲームの
          <br />
          アイデアを形にしよう
        </p>
      </div>
    </>
  );
}

export default Login;
