'use client';

import React from 'react';

import { usePrototypes } from '@/api/hooks/usePrototypes';
import useInlineEdit from '@/hooks/useInlineEdit';

interface PrototypeNameEditorProps {
  /** プロトタイプID */
  prototypeId: string;
  /** 表示用のプロトタイプ名 */
  name: string;
  /** 名前更新完了時に親へ新しい名前を通知するコールバック */
  onUpdated: (newName: string) => void;
}

export default function PrototypeNameEditor({
  prototypeId,
  name,
  onUpdated,
}: PrototypeNameEditorProps) {
  const { useUpdatePrototype } = usePrototypes();
  const updatePrototypeMutation = useUpdatePrototype();
  const {
    editedValue,
    setEditedValue,
    isEditing,
    startEditing,
    handleKeyDown,
    handleSubmit,
    handleBlur,
  } = useInlineEdit();

  const isNameEditing = isEditing(prototypeId);

  const handleComplete = async (newName: string) => {
    // 変更がない場合は何もしない
    if (newName.trim() === name) return;

    try {
      await updatePrototypeMutation.mutateAsync({
        prototypeId,
        data: { name: newName.trim() },
      });
      onUpdated(newName.trim());
    } catch (e) {
      alert('名前の更新に失敗しました。時間をおいて再度お試しください。');
      throw e;
    }
  };

  const validate = (value: string): string | null => {
    if (!value.trim()) {
      return 'プロトタイプ名を入力してください';
    }
    return null;
  };

  return (
    <div className="w-full">
      {isNameEditing ? (
        <form
          onSubmit={(e) => handleSubmit(e, handleComplete, validate)}
          className="w-full"
        >
          <input
            type="text"
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            onBlur={() => handleBlur(handleComplete, validate)}
            onKeyDown={(e) => handleKeyDown(e, handleComplete, validate)}
            className="w-full text-wood-darkest font-medium bg-transparent border border-transparent rounded-md px-1 -mx-1 focus:outline-none focus:bg-white focus:border-header focus:shadow-sm transition-all text-xs"
            autoFocus
          />
        </form>
      ) : (
        <h2 className="text-xs font-medium text-wood-darkest">
          {/* 表示モード（ボタンで編集開始） */}
          <button
            type="button"
            className="w-full text-left truncate cursor-pointer px-1 -mx-1 rounded-md hover:bg-wood-lightest transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-header focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            title={name}
            aria-label={`「${name}」を編集`}
            onClick={() => startEditing(prototypeId, name)}
          >
            {name}
          </button>
        </h2>
      )}
    </div>
  );
}
