import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import UserRoleCard from '../UserRoleCard';

const baseUserRole = {
  userId: 'current-user',
  user: {
    id: 'current-user',
    username: 'me',
    createdAt: '',
    updatedAt: '',
  },
  roles: [{ name: 'editor', description: '' }],
};

describe('UserRoleCard', () => {
  it('disables editing your own role with explanation', () => {
    render(
      <UserRoleCard
        userRole={baseUserRole}
        isCreator={false}
        isSelf={true}
        isLastAdmin={false}
        canRemove={false}
        removeReason="自分の権限は削除できません"
        onEdit={vi.fn()}
        onRemove={vi.fn()}
        loading={false}
        editMode={false}
      />
    );

    const editButton = screen.getByRole('button', {
      name: '自分の権限は変更できません',
    });
    expect(editButton).toBeDisabled();
    expect(editButton).toHaveAttribute('title', '自分の権限は変更できません');
  });

  it('disables deleting your own role with explanation', () => {
    render(
      <UserRoleCard
        userRole={baseUserRole}
        isCreator={false}
        isSelf={true}
        isLastAdmin={false}
        canRemove={false}
        removeReason="自分の権限は削除できません"
        onEdit={vi.fn()}
        onRemove={vi.fn()}
        loading={false}
        editMode={false}
      />
    );

    const deleteButton = screen.getByRole('button', {
      name: '自分の権限は削除できません',
    });
    expect(deleteButton).toBeDisabled();
    expect(deleteButton).toHaveAttribute('title', '自分の権限は削除できません');
  });
});
