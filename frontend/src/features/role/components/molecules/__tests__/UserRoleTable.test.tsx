import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { vi } from 'vitest';

import { ROLE_LABELS } from '@/constants/roles';
import type { RoleValue } from '@/features/role/types';

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

const makeUser = (id: string, username: string) => ({
  id,
  username,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
});

type RoleName = RoleValue | string;

const makeUserRole = (id: string, username: string, roles: RoleName[]) => ({
  userId: id,
  user: makeUser(id, username),
  roles: roles.map((r) => ({
    name: r as RoleValue,
    description: `${r} role`,
  })),
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
        canRemoveUserRole={vi
          .fn()
          .mockReturnValue({ canRemove: true, reason: '' })}
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
    const roleSelectBtn = buttons.find(
      (el) => el.getAttribute('aria-haspopup') === 'listbox'
    );
    expect(roleSelectBtn).toBeDefined();
    expect(roleSelectBtn).toBeDisabled();
  });

  it('disables RoleSelect when cannot manage role', async () => {
    setup({ canManageRole: false });
    const btn = screen.getByRole('button', {
      name: '権限を設定できるのは管理者権限を持つユーザーのみです',
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
        canRemoveUserRole={vi
          .fn()
          .mockReturnValue({ canRemove: true, reason: '' })}
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
    const adminOption = await screen.findByRole('option', {
      name: ROLE_LABELS.admin,
    });
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
        canRemoveUserRole={vi
          .fn()
          .mockReturnValue({ canRemove: true, reason: '' })}
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
        canRemoveUserRole={vi.fn().mockReturnValue({
          canRemove: false,
          reason: '最後の管理者の権限は削除できません',
        })}
        onRoleChange={vi.fn()}
        onRemove={onRemove}
        loading={false}
        canManageRole={true}
      />
    );

    const btn = screen.getByRole('button', {
      name: '最後の管理者の権限は削除できません',
    });
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
        canRemoveUserRole={vi
          .fn()
          .mockReturnValue({ canRemove: true, reason: '' })}
        onRoleChange={vi.fn()}
        onRemove={onRemove}
        loading={true}
        canManageRole={true}
      />
    );

    // Select the remove button: it does NOT have aria-haspopup="listbox"
    const buttons = screen.getAllByRole('button', { name: '処理中...' });
    const removeBtn = buttons.find(
      (el) => el.getAttribute('aria-haspopup') !== 'listbox'
    );
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
        canRemoveUserRole={vi
          .fn()
          .mockReturnValue({ canRemove: true, reason: '' })}
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
  it('shows 閲覧者 when roles array is empty', () => {
    const userRoleNoRoles = {
      userId: 'user-3',
      user: makeUser('user-3', 'user3'),
      roles: [],
    };

    render(
      <UserRoleTable
        userRoles={[userRoleNoRoles]}
        creator={null}
        canRemoveUserRole={vi
          .fn()
          .mockReturnValue({ canRemove: true, reason: '' })}
        onRoleChange={vi.fn()}
        onRemove={vi.fn()}
        loading={false}
        canManageRole={true}
      />
    );

    // RoleSelect current label for default role should be the viewer label
    expect(screen.getByText(ROLE_LABELS.viewer)).toBeInTheDocument();
  });
});

describe('UserRoleTable - sorting order', () => {
  it('sorts rows by creator, privilege, and name regardless of input order', () => {
    const creatorEntry = makeUserRole('user-creator', 'Creator', ['viewer']);
    const creator = creatorEntry.user;
    const mixedAdmin = makeUserRole('user-mixed', 'Apollo', [
      'viewer',
      'admin',
    ]);
    const adminOnly = makeUserRole('user-admin', 'Zeus', ['admin']);
    const editorOnly = makeUserRole('user-editor', 'Echo', ['editor']);
    const viewerLower = makeUserRole('user-viewer-alpha', 'alpha', ['viewer']);
    const viewerUpper = makeUserRole('user-viewer-bravo', 'Bravo', ['viewer']);
    const unknownRole = makeUserRole('user-unknown', 'Beta', ['guest']);

    const shuffledUserRoles = [
      viewerUpper,
      unknownRole,
      editorOnly,
      creatorEntry,
      viewerLower,
      adminOnly,
      mixedAdmin,
    ];

    render(
      <UserRoleTable
        userRoles={shuffledUserRoles}
        creator={creator}
        canRemoveUserRole={vi
          .fn()
          .mockReturnValue({ canRemove: true, reason: '' })}
        onRoleChange={vi.fn()}
        onRemove={vi.fn()}
        loading={false}
        canManageRole={true}
      />
    );

    const [, bodyRowGroup] = screen.getAllByRole('rowgroup');
    const rows = within(bodyRowGroup).getAllByRole('row');
    const usernames = rows.map((row) => {
      const firstCell = within(row).getAllByRole('cell')[0];
      const textContent = (firstCell.textContent ?? '').trim();
      let normalized = textContent;
      if (normalized.length > 1) {
        const [firstChar, secondChar] = [normalized[0], normalized[1]];
        if (
          firstChar &&
          secondChar &&
          firstChar.toLocaleUpperCase() === secondChar.toLocaleUpperCase()
        ) {
          normalized = normalized.slice(1);
        }
      }

      return normalized.split('その他')[0].trim();
    });

    expect(usernames).toEqual([
      'Creator',
      'Apollo',
      'Zeus',
      'Echo',
      'alpha',
      'Bravo',
      'Beta',
    ]);
  });
});
