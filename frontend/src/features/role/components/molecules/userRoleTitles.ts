/**
 * Returns tooltip text for the role dropdown.
 * - Prioritizes non-changeable cases.
 */
export const getRoleDropdownTitle = ({
  isCreator,
  isSelf,
  loading,
  canManageRole,
}: {
  isCreator: boolean;
  isSelf: boolean;
  loading: boolean;
  canManageRole: boolean;
}): string => {
  if (isCreator) return 'プロジェクト作成者の権限は変更できません';
  if (isSelf) return '自分の権限は変更できません';
  if (!canManageRole) return '権限を設定できるのはAdminユーザーのみです';
  if (loading) return '処理中...';
  return '権限を変更';
};

/**
 * Returns tooltip text for the remove button.
 */
export const getRemoveButtonTitle = ({
  canRemove,
  removeReason,
  loading,
}: {
  canRemove: boolean;
  removeReason: string;
  loading: boolean;
}): string => {
  if (loading) return '処理中...';
  if (canRemove) return '権限を削除';
  return removeReason;
};

