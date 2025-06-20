'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { GiWoodenCrate } from 'react-icons/gi';

import { useAuth } from '@/api/hooks/useAuth';

function Login() {
  const router = useRouter();
  const { getUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ユーザーがログイン済みか確認
    getUser()
      .then((user) => {
        // ユーザーデータが存在する場合はログイン済みと判断
        if (user && user.id) {
          // /groups にリダイレクト
          router.replace('/groups');
        } else {
          // ユーザーがログインしていない場合はローディングを終了
          setIsLoading(false);
        }
      })
      .catch((error) => {
        // エラーがあった場合はログイン画面を表示する
        console.error('Login check error:', error);
        setIsLoading(false);
      });
  }, [getUser, router]);

  // ローディング中は簡単なアピール文を表示
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-amber-50">
        <div className="flex items-center gap-3 mb-6 animate-pulse">
          <GiWoodenCrate className="text-6xl drop-shadow-lg transform -rotate-6 text-amber-600" />
          <h1 className="text-5xl font-bold tracking-wider text-amber-800">
            KIBAKO
          </h1>
        </div>
        <div className="h-1 w-40 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mb-8"></div>
        <p className="text-xl text-amber-700 text-center max-w-md px-4">
          ボードゲームのアイデアを形にし、テストプレイを簡単に。
          <br />
          創造力を解き放つデジタルプレイグラウンド
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center relative overflow-hidden py-16">
      {/* 中央のログインカード */}
      <div className="p-8 rounded-lg border border-amber-200 shadow-xl w-1/3 min-w-[450px] text-center flex flex-col bg-white relative z-10 backdrop-blur-sm bg-opacity-95 m-auto">
        {/* ロゴ部分 */}
        <div className="flex flex-col items-center mb-8 mt-4">
          <div className="flex items-center gap-3 mb-3">
            <GiWoodenCrate className="text-5xl drop-shadow-lg transform -rotate-6 text-amber-600" />
            <h1 className="text-4xl font-bold tracking-wider text-amber-800">
              KIBAKO
            </h1>
          </div>
          <div className="h-1 w-24 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mb-4"></div>
          <p className="text-gray-700">
            ボードゲームの試作品をテストプレイできるサービス
          </p>
        </div>

        {/* ログイン部分 */}
        <div className="bg-amber-50 p-6 rounded-lg border border-amber-100 mt-1 mb-6">
          <h3 className="text-xl font-semibold mb-6 text-amber-800">
            ソーシャルIDでログイン
          </h3>
          <div className="flex justify-center">
            <button
              className="flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm py-4 px-8 hover:bg-amber-50 hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => {
                window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
              }}
            >
              <FaGoogle className="text-[#4285F4] mr-3 text-xl" />
              <span className="text-gray-700 font-medium">
                Googleでログイン
              </span>
            </button>
          </div>
        </div>

        <p className="text-amber-700 mt-3 mb-1 text-sm">
          KIBAKOでボードゲームのアイデアを形にしよう
        </p>
      </div>
    </div>
  );
}

export default Login;
