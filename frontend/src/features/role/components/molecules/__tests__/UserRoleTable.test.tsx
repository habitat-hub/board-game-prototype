import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import UserRoleTable from '../UserRoleTable';

// Mock useUser to control current user in each test
const mockUserState = {
  user: {
    id: 'current-user-id',
    username: 'current-user',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  setUser: vi.fn(),
  isLoading: false,
};

vi.mock('@/hooks/useUser', () => ({
  useUser: () => mockUserState,
}));

type RoleValue = 'admin' | 'editor' | 'viewer';

const makeUser = (id: string, username: string) => ({
  id,
  username,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
});

const makeUserRole = (
  id: string,
  username: string,
  roles: RoleValue[]
) => ({
  userId: id,
  user: makeUser(id, username),
  roles: roles.map((r) => ({ name: r, description: `${r} role` })),
});

describe('UserRoleTable - empty state', () => {
  it('renders empty state when userRoles is empty and not loading', () => {
    const canRemoveUserRole = vi.fn().mockReturnValue({
      canRemove: false,
      reason: 'No users',
    });

    const { container } = render(
      <UserRoleTable
        userRoles={[]}
        creator={null}
        canRemoveUserRole={canRemoveUserRole}
        onRoleChange={vi.fn()}
        onRemove={vi.fn()}
        loading={false}
        canManageRole={true}
      />
    );

    // Message text
    expect(
      screen.getByText('ユーザー権限が設定されていません')
    ).toBeInTheDocument();
    // Icon (react-icons renders an <svg>)
    expect(container.querySelector('svg')).toBeTruthy();
  });
});

describe('UserRoleTable - role change disabled states', () => {
  const baseUserRole = makeUserRole('user-1', 'user1', ['viewer']);
  const setup = (opts: {
    creatorId?: string | null;
    currentUserId?: string;
    loading?: boolean;
    canManageRole?: boolean;
  }) => {
    const {
      creatorId = null,
      currentUserId = 'someone-else',
      loading = false,
      canManageRole = true,
    } = opts;
    mockUserState.user.id = currentUserId;
    return render(
      <UserRoleTable
        userRoles={[baseUserRole]}
        creator={creatorId ? makeUser(creatorId, 'creator') : null}
        canRemoveUserRole={vi.fn().mockReturnValue({ canRemove: true, reason: '' })}
        onRoleChange={vi.fn()}
        onRemove={vi.fn()}
        loading={loading}
        canManageRole={canManageRole}
      />
    );
  };

  it('disables RoleSelect for creator with proper tooltip', async () => {
    setup({ creatorId: 'user-1', currentUserId: 'other' });
    const btn = screen.getByRole('button', {
      name: 'プロジェクト作成者の権限は変更できません',
    });
    expect(btn).toBeDisabled();
  });

  it('disables RoleSelect for self with proper tooltip', async () => {
    setup({ creatorId: null, currentUserId: 'user-1' });
    const btn = screen.getByRole('button', {
      name: '自分の権限は変更できません',
    });
    expect(btn).toBeDisabled();
  });

  it('disables RoleSelect while loading', async () => {
    setup({ loading: true });
    // There are two buttons with name "処理中...": RoleSelect and Remove.
    // Pick the RoleSelect one (it has aria-haspopup="listbox" / aria-expanded)
    const buttons = screen.getAllByRole('button', { name: '処理中...' });
    const roleSelectBtn = buttons.find((el) => el.getAttribute('aria-haspopup') === 'listbox');
    expect(roleSelectBtn).toBeDefined();
    expect(roleSelectBtn).toBeDisabled();
  });

  it('disables RoleSelect when cannot manage role', async () => {
    setup({ canManageRole: false });
    const btn = screen.getByRole('button', {
      name: '権限を設定できるのはAdminユーザーのみです',
    });
    expect(btn).toBeDisabled();
  });

  it('allows role change when permitted and calls onRoleChange', async () => {
    const onRoleChange = vi.fn();
    mockUserState.user.id = 'different-user';
    render(
      <UserRoleTable
        userRoles={[baseUserRole]}
        creator={null}
        canRemoveUserRole={vi.fn().mockReturnValue({ canRemove: true, reason: '' })}
        onRoleChange={onRoleChange}
        onRemove={vi.fn()}
        loading={false}
        canManageRole={true}
      />
    );

    // Button is enabled and has generic tooltip
    const btn = screen.getByRole('button', { name: '権限を変更' });
    expect(btn).not.toBeDisabled();
    await userEvent.click(btn);

    // Select a different role from the options menu
    const adminOption = await screen.findByRole('option', { name: /Admin/i });
    await userEvent.click(adminOption);

    expect(onRoleChange).toHaveBeenCalledWith('user-1', 'admin');
  });
});

describe('UserRoleTable - remove button states and reasons', () => {
  const userRole = makeUserRole('user-2', 'user2', ['editor']);

  it('enables remove when allowed and calls onRemove', async () => {
    mockUserState.user.id = 'someone-else';
    const onRemove = vi.fn();
    render(
      <UserRoleTable
        userRoles={[userRole]}
        creator={null}
        canRemoveUserRole={vi.fn().mockReturnValue({ canRemove: true, reason: '' })}
        onRoleChange={vi.fn()}
        onRemove={onRemove}
        loading={false}
        canManageRole={true}
      />
    );

    const btn = screen.getByRole('button', { name: '権限を削除' });
    expect(btn).not.toBeDisabled();
    await userEvent.click(btn);
    expect(onRemove).toHaveBeenCalledWith('user-2');
  });

  it('disables remove with reason when canRemove=false', async () => {
    mockUserState.user.id = 'someone-else';
    const onRemove = vi.fn();
    render(
      <UserRoleTable
        userRoles={[userRole]}
        creator={null}
        canRemoveUserRole={vi
          .fn()
          .mockReturnValue({ canRemove: false, reason: '最後のAdminは削除できません' })}
        onRoleChange={vi.fn()}
        onRemove={onRemove}
        loading={false}
        canManageRole={true}
      />
    );

    const btn = screen.getByRole('button', { name: '最後のAdminは削除できません' });
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('disables remove while loading', async () => {
    const onRemove = vi.fn();
    render(
      <UserRoleTable
        userRoles={[userRole]}
        creator={null}
        canRemoveUserRole={vi.fn().mockReturnValue({ canRemove: true, reason: '' })}
        onRoleChange={vi.fn()}
        onRemove={onRemove}
        loading={true}
        canManageRole={true}
      />
    );

    // Select the remove button: it does NOT have aria-haspopup="listbox"
    const buttons = screen.getAllByRole('button', { name: '処理中...' });
    const removeBtn = buttons.find((el) => el.getAttribute('aria-haspopup') !== 'listbox');
    expect(removeBtn).toBeDefined();
    expect(removeBtn).toBeDisabled();
    await userEvent.click(removeBtn!);
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('disables remove when cannot manage role', async () => {
    const onRemove = vi.fn();
    render(
      <UserRoleTable
        userRoles={[userRole]}
        creator={null}
        canRemoveUserRole={vi.fn().mockReturnValue({ canRemove: true, reason: '' })}
        onRoleChange={vi.fn()}
        onRemove={onRemove}
        loading={false}
        canManageRole={false}
      />
    );

    // Title text still shows the default action name
    const btn = screen.getByRole('button', { name: '権限を削除' });
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onRemove).not.toHaveBeenCalled();
  });
});

describe('UserRoleTable - roles fallback', () => {
  it('shows Viewer when roles array is empty', () => {
    const userRoleNoRoles = {
      userId: 'user-3',
      user: makeUser('user-3', 'user3'),
      roles: [],
    };

    render(
      <UserRoleTable
        userRoles={[userRoleNoRoles]}
        creator={null}
        canRemoveUserRole={vi.fn().mockReturnValue({ canRemove: true, reason: '' })}
        onRoleChange={vi.fn()}
        onRemove={vi.fn()}
        loading={false}
        canManageRole={true}
      />
    );

    // RoleSelect current label for default role should be Viewer
    expect(screen.getByText('Viewer')).toBeInTheDocument();
  });
});
