import { useState, useCallback } from 'react';

/**
 * インライン編集機能を提供するカスタムフック
 * テキストの編集状態管理、編集開始/完了/キャンセル、キーボードイベント処理などを含む
 */
export const useInlineEdit = () => {
  // 編集中のアイテムIDを管理
  const [editingId, setEditingId] = useState<string>('');
  // 編集中の値を保持
  const [editedValue, setEditedValue] = useState<string>('');

  /**
   * 編集モードを開始する
   * @param id 編集対象のID
   * @param currentValue 現在の値
   */
  const startEditing = useCallback(
    (id: string, currentValue: string) => {
      if (editingId === id) {
        // 同じ項目を再度押した場合は編集モードを解除
        setEditingId('');
      } else {
        // 編集モードにする
        setEditingId(id);
        setEditedValue(currentValue);
      }
    },
    [editingId]
  );

  /**
   * 編集をキャンセルする
   */
  const cancelEditing = useCallback(() => {
    setEditingId('');
    setEditedValue('');
  }, []);

  /**
   * 編集完了の処理
   * @param onComplete 編集完了時のコールバック関数
   * @param validator バリデーション関数（オプショナル）
   */
  const completeEditing = useCallback(
    async (
      onComplete: (value: string) => Promise<void> | void,
      validator?: (value: string) => string | null
    ) => {
      // バリデーション
      if (validator) {
        const error = validator(editedValue);
        if (error) {
          alert(error);
          return;
        }
      }

      await onComplete(editedValue.trim());
      // 成功時は編集モードを解除
      setEditingId('');
      setEditedValue('');
    },
    [editedValue]
  );

  /**
   * キーボードイベントハンドラー
   * @param event キーボードイベント
   * @param onComplete 編集完了時のコールバック関数
   * @param validator バリデーション関数（オプショナル）
   */
  const handleKeyDown = useCallback(
    async (
      event: React.KeyboardEvent<HTMLInputElement>,
      onComplete: (value: string) => Promise<void> | void,
      validator?: (value: string) => string | null
    ) => {
      if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
        event.preventDefault();
        try {
          await completeEditing(onComplete, validator);
        } catch (error) {
          // エラーは上位コンポーネントで処理されることを想定
          console.error('Error completing edit:', error);
        }
      } else if (event.key === 'Escape') {
        cancelEditing();
      }
    },
    [completeEditing, cancelEditing]
  );

  /**
   * フォーム送信ハンドラー
   * @param event フォームイベント
   * @param onComplete 編集完了時のコールバック関数
   * @param validator バリデーション関数（オプショナル）
   */
  const handleSubmit = useCallback(
    async (
      event: React.FormEvent<HTMLFormElement>,
      onComplete: (value: string) => Promise<void> | void,
      validator?: (value: string) => string | null
    ) => {
      event.preventDefault();
      try {
        await completeEditing(onComplete, validator);
      } catch (error) {
        // エラーは上位コンポーネントで処理されることを想定
        console.error('Error completing edit:', error);
      }
    },
    [completeEditing]
  );

  /**
   * フォーカスアウト時のハンドラー
   * @param onComplete 編集完了時のコールバック関数
   * @param validator バリデーション関数（オプショナル）
   */
  const handleBlur = useCallback(
    async (
      onComplete: (value: string) => Promise<void> | void,
      validator?: (value: string) => string | null
    ) => {
      try {
        await completeEditing(onComplete, validator);
      } catch (error) {
        // エラーは上位コンポーネントで処理されることを想定
        console.error('Error completing edit:', error);
      }
    },
    [completeEditing]
  );

  /**
   * 指定されたIDが編集中かどうかを判定
   * @param id 判定対象のID
   * @returns 編集中の場合true
   */
  const isEditing = useCallback(
    (id: string) => {
      return editingId === id;
    },
    [editingId]
  );

  return {
    // 状態
    editingId,
    editedValue,
    setEditedValue,

    // 判定関数
    isEditing,

    // アクション関数
    startEditing,
    cancelEditing,
    completeEditing,

    // イベントハンドラー
    handleKeyDown,
    handleSubmit,
    handleBlur,
  };
};

export default useInlineEdit;
