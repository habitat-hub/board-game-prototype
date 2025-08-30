import React from 'react';
import { GiWoodenCrate } from 'react-icons/gi';
import { RiLoaderLine } from 'react-icons/ri';

/**
 * EmptyProjectStateのProps
 */
type EmptyProjectStateProps = {
  // 作成中フラグ
  isCreating: boolean;
  // 作成ボタンクリック時の処理
  onCreatePrototype: () => void;
};

/**
 * プロトタイプリストが空の場合の表示コンポーネント
 */
export const EmptyProjectState: React.FC<EmptyProjectStateProps> = ({
  isCreating,
  onCreatePrototype,
}) => {
  return (
    <div className="fixed inset-0 z-10">
      <button
        onClick={onCreatePrototype}
        disabled={isCreating}
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-row items-center justify-center gap-4 px-14 py-8 rounded-3xl shadow-[0_10px_40px_0_rgba(0,0,0,0.45),0_2px_8px_0_rgba(0,0,0,0.25)] bg-kibako-primary text-kibako-white text-2xl font-bold transition-all duration-200 border-4 border-kibako-accent hover:bg-kibako-accent hover:text-kibako-primary hover:scale-105 hover:shadow-[0_16px_56px_0_rgba(0,0,0,0.55),0_4px_16px_0_rgba(0,0,0,0.30)] active:scale-95 focus:outline-none focus:ring-4 focus:ring-kibako-accent/40 select-none ${isCreating ? 'opacity-80 cursor-not-allowed' : ''}`}
        style={{ minWidth: 360, minHeight: 100 }}
        title="新規プロトタイプを作成する"
      >
        {/* ローディング状態のアイコン */}
        {isCreating ? (
          <RiLoaderLine
            className="w-14 h-14 animate-spin text-kibako-primary bg-kibako-accent rounded-full p-2 shadow-lg"
            aria-hidden="true"
          />
        ) : (
          /* 通常状態のアイコン */
          <GiWoodenCrate
            className="w-20 h-20 text-kibako-accent drop-shadow-xl transform -rotate-6 bg-white rounded-2xl p-2 shadow-lg border-2 border-kibako-accent"
            aria-hidden="true"
          />
        )}
        {/* ボタンテキスト */}
        <span className="text-2xl font-bold tracking-wide drop-shadow-sm">
          {isCreating ? '作成中...' : 'KIBAKOの世界へ飛び込む！'}
        </span>
      </button>
    </div>
  );
};
