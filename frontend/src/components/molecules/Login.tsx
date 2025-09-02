'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { FaGoogle, FaDice, FaChessBoard } from 'react-icons/fa';
import { GiWoodenCrate, GiCardAceSpades, GiPuzzle } from 'react-icons/gi';

import { getApiUrl } from '@/api/client';
import { useAuth } from '@/api/hooks/useAuth';
import LinkButton from '@/components/atoms/LinkButton';
import Loading from '@/components/organisms/Loading';

function Login() {
  const router = useRouter();
  const { getUser } = useAuth();

  useEffect(() => {
    if (getUser.isSuccess && getUser.data?.id) {
      router.replace('/projects');
    }
    if (getUser.isError) {
      console.error('Login check error:', getUser.error);
    }
  }, [getUser.data, getUser.isError, getUser.isSuccess, getUser.error, router]);

  if (getUser.isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="p-6 sm:p-8 md:p-12 rounded-lg border border-kibako-secondary/20 shadow-xl w-full max-w-md sm:max-w-lg md:w-1/2 text-center flex flex-col bg-kibako-white mx-auto">
        {/* タイトル */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-wider text-kibako-primary">
          KIBAKO
        </h1>

        {/* アイコン */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mt-8 sm:mt-12">
          <FaDice className="text-4xl sm:text-6xl text-kibako-primary/60 transform rotate-12" />
          <GiCardAceSpades className="text-4xl sm:text-6xl text-kibako-primary/60 transform -rotate-12" />
          <GiWoodenCrate className="text-5xl sm:text-7xl drop-shadow-lg text-kibako-accent" />
          <GiPuzzle className="text-4xl sm:text-6xl text-kibako-primary/60 transform rotate-6" />
          <FaChessBoard className="text-4xl sm:text-6xl text-kibako-primary/60 transform -rotate-6" />
        </div>

        {/* 認証ボタン */}
        <div className="flex flex-col gap-4 items-center mt-12 sm:mt-16">
          <LinkButton
            variant="accent"
            className="!px-6 !py-4 !text-lg"
            href={getApiUrl('/auth/google')}
          >
            <div className="flex items-center gap-3">
              <FaGoogle className="text-2xl" />
              <span>Googleで続ける</span>
            </div>
          </LinkButton>
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
