'use client';

import React from 'react';

const ShareLinkButton: React.FC = () => {
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        // ユーザーが共有をキャンセルした場合は何もしない
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('リンクをコピーしました');
      } catch {
        alert('リンクのコピーに失敗しました');
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="underline text-xs text-blue-600 ml-1"
    >
      PCにリンクを送る
    </button>
  );
};

export default ShareLinkButton;
