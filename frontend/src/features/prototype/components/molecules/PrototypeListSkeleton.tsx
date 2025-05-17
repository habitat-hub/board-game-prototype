import React from 'react';

const PrototypeListSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto mt-16 relative">
      {/* タイトル (スケルトン) */}
      <div className="h-10 w-48 bg-slate-200 rounded mx-auto mb-8 animate-pulse"></div>

      {/* プロトタイプ一覧 (スケルトン) */}
      <div className="shadow-2xl rounded-2xl overflow-hidden bg-content border border-wood-lightest/20">
        <div className="w-full">
          {/* テーブルヘッダー (スケルトン) */}
          <div className="bg-content-secondary border-b border-wood-lightest/30 p-4 flex">
            <div className="w-4/12 h-6 bg-slate-200 rounded animate-pulse"></div>
            <div className="w-2/12 h-6 bg-slate-200 rounded animate-pulse ml-4"></div>
            <div className="w-2/12 h-6 bg-slate-200 rounded animate-pulse ml-4"></div>
            <div className="w-2/12 h-6 bg-slate-200 rounded animate-pulse ml-4"></div>
            <div className="w-2/12 h-6 bg-slate-200 rounded animate-pulse ml-4"></div>
          </div>

          {/* テーブルボディ (スケルトン) */}
          <div className="divide-y divide-wood-lightest/20">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex p-4 items-center">
                <div className="w-4/12 h-6 bg-slate-200 rounded animate-pulse"></div>
                <div className="w-1/12 h-6 bg-slate-200 rounded animate-pulse ml-4"></div>
                <div className="w-2/12 h-6 bg-slate-200 rounded animate-pulse ml-4"></div>
                <div className="w-2/12 h-6 bg-slate-200 rounded animate-pulse ml-4"></div>
                <div className="w-2/12 flex justify-center">
                  <div className="w-20 h-8 bg-slate-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 新規プロトタイプ作成ボタン (スケルトン) */}
      <div className="mt-6 flex justify-center">
        <div className="w-64 h-12 bg-slate-200 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default PrototypeListSkeleton;
