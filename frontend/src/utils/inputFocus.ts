/**
 * 現在フォーカスされている要素が入力フィールドかどうかを判定する
 * @returns 入力フィールドにフォーカスがある場合はtrue
 */
export function isInputFieldFocused(): boolean {
  const active = document.activeElement;
  const tag = active && (active.tagName || '').toUpperCase();

  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    active?.hasAttribute('contenteditable') === true
  );
}
