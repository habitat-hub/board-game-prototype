'use client';

import React from 'react';
import { IoShareOutline } from 'react-icons/io5';

import KibakoButton from '@/components/atoms/KibakoButton';

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
    <KibakoButton
      type="button"
      onClick={handleShare}
      variant="accent"
      size="sm"
      className="mt-1 gap-2"
    >
      <IoShareOutline className="h-4 w-4" />
      <span>KIBAKOを共有する</span>
    </KibakoButton>
  );
};

export default ShareLinkButton;
