import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useRoleManagement } from '../useRoleManagement';

vi.mock('@/hooks/useUser', () => ({
  useUser: () => ({ user: { id: 'current-user', username: 'me' } }),
}));

const getProjectRoles = vi.fn().mockResolvedValue([]);
const addRoleToProject = vi.fn();
const removeRoleFromProject = vi.fn();
const updateRoleInProject = vi.fn();
const getProject = vi.fn().mockResolvedValue({ userId: 'creator-id' });

vi.mock('@/api/hooks/useProject', () => ({
  useProject: () => ({
    getProjectRoles,
    addRoleToProject,
    removeRoleFromProject,
    updateRoleInProject,
    getProject,
  }),
}));

const searchUsers = vi
  .fn()
  .mockResolvedValue([{ id: 'creator-id', username: 'creator' }]);

vi.mock('@/api/hooks/useUsers', () => ({
  useUsers: () => ({
    searchUsers,
  }),
}));

describe('useRoleManagement', () => {
  it('disables deleting your own role', async () => {
    const userRoles = [
      {
        userId: 'current-user',
        user: {
          id: 'current-user',
          username: 'me',
          createdAt: '',
          updatedAt: '',
        },
        roles: [{ name: 'editor', description: '' }],
      },
    ];

    const { result } = renderHook(() => useRoleManagement('project-1'));

    await waitFor(() => {
      const check = result.current.canRemoveUserRole('current-user', userRoles);
      expect(check.reason).not.toBe('ユーザー情報が取得できません');
    });

    const check = result.current.canRemoveUserRole('current-user', userRoles);
    expect(check.canRemove).toBe(false);
    expect(check.reason).toBe('自分の権限は削除できません');
  });
});
