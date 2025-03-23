'use client';

import Image from 'next/image';
import React from 'react';

function Login() {
  return (
    <div className="flex items-center justify-center h-full relative overflow-hidden">
      <div className="p-10 rounded border border-gray-300 shadow-md w-1/3 min-w-[450px] text-center min-h-[450px] flex flex-col bg-white relative z-10">
        <h1 className="text-3xl font-bold mb-8 mt-10">KIBAKO</h1>
        <p className="text-gray-600 mb-12">
          ボードゲームプロトタイプの作成アプリ
        </p>
        <h3 className="text-xl font-semibold mb-6">ソーシャルIDでログイン</h3>
        <div className="flex justify-center">
          <button
            className="flex items-center justify-center bg-white border border-gray-300 rounded shadow-sm py-3 px-6 hover:bg-gray-50"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
            }}
          >
            <Image
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Googleでログイン"
              width={24}
              height={24}
              className="mr-3"
            />
            <span className="text-gray-700 font-medium">Googleでログイン</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
