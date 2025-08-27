'use client';

import React from 'react';

import { usePrototypes } from '@/api/hooks/usePrototypes';
import useInlineEdit from '@/hooks/useInlineEdit';

interface PrototypeNameEditorProps {
  prototypeId: string;
  name: string;
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

    await updatePrototypeMutation.mutateAsync({
      prototypeId,
      data: { name: newName.trim() },
    });
    onUpdated(newName.trim());
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
        <h2
          className="text-xs font-medium truncate text-wood-darkest cursor-text"
          title={name}
          onClick={() => startEditing(prototypeId, name)}
        >
          {name}
        </h2>
      )}
    </div>
  );
}

