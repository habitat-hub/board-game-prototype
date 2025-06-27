'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { FaGoogle, FaDice, FaChessBoard } from 'react-icons/fa';
import { GiWoodenCrate, GiCardAceSpades, GiPuzzle } from 'react-icons/gi';

import { useAuth } from '@/api/hooks/useAuth';

import Button from '../atoms/Button';
import Loading from '../organisms/Loading';

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
          // /groups にリダイレクト
          router.replace('/groups');
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
      <div className="p-12 rounded-lg border border-kibako-secondary/20 shadow-xl w-1/4 text-center flex flex-col bg-kibako-tertiary">
        {/* タイトル */}
        <h1 className="text-4xl font-bold tracking-wider text-kibako-primary">
          KIBAKO
        </h1>

        {/* ロゴ部分 */}
        <div className="flex items-center justify-center mt-12">
          <div className="flex items-center gap-5">
            {/* サイコロ */}
            <FaDice className="text-6xl text-kibako-primary/60 transform rotate-12" />

            {/* トランプ */}
            <GiCardAceSpades className="text-6xl text-kibako-primary/60 transform -rotate-12" />

            {/* メインの木箱アイコン */}
            <GiWoodenCrate className="text-7xl drop-shadow-lg text-kibako-accent" />

            {/* パズル */}
            <GiPuzzle className="text-6xl text-kibako-primary/60 transform rotate-6" />

            {/* チェスボード */}
            <FaChessBoard className="text-6xl text-kibako-primary/60 transform -rotate-6" />
          </div>
        </div>

        {/* ログイン部分 */}
        <div className="flex justify-center mt-16">
          <Button
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
            }}
          >
            <div className="flex items-center gap-2">
              <FaGoogle className="text-xl" />
              <span>Googleでログイン</span>
            </div>
          </Button>
        </div>

        {/* サブタイトル */}
        <p className="text-kibako-primary mt-8 text-base">
          KIBAKOでボードゲームのアイデアを形にしよう
        </p>
      </div>
    </>
  );
}

export default Login;
