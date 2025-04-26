'use client';

import Link from 'next/link';
import React from 'react';
import { FaPlus } from 'react-icons/fa6';
import { GiWoodenSign } from 'react-icons/gi';

/**
 * プロトタイプが存在しない場合に表示するコンポーネント
 * 新規プロトタイプ作成へのリンクを含む
 */
const EmptyPrototypeList: React.FC = () => {
  return (
    <div className="flex flex-col h-full justify-center items-center relative mt-32">
      <div className="text-wood-light">
        <GiWoodenSign className="w-[600px] h-[600px]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <p className="text-4xl text-wood-darkest text-center w-full mb-12">
          最初のプロトタイプを
          <br />
          作成しましょう
        </p>
        <Link
          href="/prototypes/create"
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-header via-header-light to-header text-content py-4 px-8 rounded-full hover:from-header-light hover:via-header hover:to-header-light transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group text-xl font-bold animate-pulse"
          title="新規プロトタイプを作成"
        >
          <FaPlus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          <span>KIBAKOの世界へ飛び込む！</span>
        </Link>
      </div>
    </div>
  );
};

export default EmptyPrototypeList;
