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
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="p-6 sm:p-8 md:p-12 rounded-lg border border-kibako-secondary/20 shadow-xl w-full max-w-md sm:max-w-lg md:w-1/2 text-center flex flex-col bg-kibako-white mx-auto">
        {/* タイトル */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-wider text-kibako-primary">
          KIBAKO
        </h1>

        {/* ロゴ */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mt-8 sm:mt-12">
          <FaDice className="text-4xl sm:text-6xl text-kibako-primary/60 transform rotate-12" />
          <GiCardAceSpades className="text-4xl sm:text-6xl text-kibako-primary/60 transform -rotate-12" />
          <GiWoodenCrate className="text-5xl sm:text-7xl drop-shadow-lg text-kibako-accent" />
          <GiPuzzle className="text-4xl sm:text-6xl text-kibako-primary/60 transform rotate-6" />
          <FaChessBoard className="text-4xl sm:text-6xl text-kibako-primary/60 transform -rotate-6" />
        </div>

        {/* 認証ボタン */}
        <div className="flex flex-col gap-4 items-center mt-12 sm:mt-16">
          <Button
            variant="accent"
            className="!px-6 !py-4 !text-lg"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
            }}
          >
            <div className="flex items-center gap-3">
              <FaGoogle className="text-2xl" />
              <span>Googleで続ける</span>
            </div>
          </Button>
        </div>

        {/* サブタイトル */}
        <p className="text-kibako-primary mt-6 sm:mt-8 text-sm lg:text-base">
          KIBAKOでボードゲームのアイデアを形にしよう
        </p>
      </div>
    </div>
  );
}

export default Login;
