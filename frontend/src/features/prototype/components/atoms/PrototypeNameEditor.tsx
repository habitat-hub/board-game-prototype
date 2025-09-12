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
  /** 表示時に名前を省略表記にするか（デフォルト: true） */
  truncate?: boolean;
  /** ラッパー要素に適用する任意のクラス */
  className?: string;
  /** 左右にクリック領域を“はみ出させる”か（デフォルト: true） */
  bleedX?: boolean;
  /** 表示文字サイズ（デフォルト: 'xs'） */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  /** 太字オプション（デフォルト: 'medium'） */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  /** 編集可能かどうか */
  editable?: boolean;
  /** 編集不可の場合に表示する理由 */
  notEditableReason?: string;
}

export default function PrototypeNameEditor({
  prototypeId,
  name,
  onUpdated,
  truncate = true,
  className,
  bleedX = true,
  size = 'xs',
  weight = 'medium',
  editable = true,
  notEditableReason = '管理者のみ名前を変更できます',
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

  const sizeClass =
    size === 'xs'
      ? 'text-xs'
      : size === 'sm'
        ? 'text-sm'
        : size === 'base'
          ? 'text-base'
          : size === 'lg'
            ? 'text-lg'
            : 'text-xl';

  const weightClass =
    weight === 'normal'
      ? 'font-normal'
      : weight === 'medium'
        ? 'font-medium'
        : weight === 'semibold'
          ? 'font-semibold'
          : 'font-bold';

  if (!editable) {
    const titleText = notEditableReason
      ? `${name} - ${notEditableReason}`
      : name;
    return (
      <div className={`w-full ${className ?? ''}`}>
        <span
          className={`w-full text-left ${sizeClass} ${weightClass} text-kibako-primary rounded-md ${
            bleedX ? 'px-2 -mx-2' : 'px-2'
          } ${
            truncate
              ? 'flex h-8 items-center leading-none truncate'
              : 'block py-1.5 min-h-8 whitespace-normal break-words'
          }`}
          title={titleText}
          aria-label={titleText}
        >
          {name}
        </span>
      </div>
    );
  }

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
    <div className={`w-full ${className ?? ''}`}>
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
            className={`w-full text-kibako-primary ${weightClass} bg-transparent border border-transparent rounded-md py-1.5 min-h-8 focus:outline-none focus:bg-kibako-white focus:border-kibako-primary focus:shadow-sm transition-all ${sizeClass} ${
              bleedX ? 'px-2 -mx-2' : 'px-2'
            }`}
            autoFocus
          />
        </form>
      ) : (
        <button
          type="button"
          className={`block w-full text-left ${sizeClass} ${weightClass} text-kibako-primary cursor-pointer py-1.5 min-h-8 rounded-md hover:bg-kibako-secondary/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kibako-primary focus-visible:ring-offset-2 focus-visible:ring-offset-kibako-white ${
            bleedX ? 'px-2 -mx-2' : 'px-2'
          } ${truncate ? 'truncate' : 'whitespace-normal break-words'}`}
          title={name}
          aria-label={`「${name}」を編集`}
          onClick={() => startEditing(prototypeId, name)}
        >
          {name}
        </button>
      )}
    </div>
  );
}
