'use client';

import { useParams, useRouter } from 'next/navigation';
import { ReactElement, useEffect, useState } from 'react';
import { IoArrowBack, IoTrash } from 'react-icons/io5';
import { RiLoaderLine } from 'react-icons/ri';

import { projectService } from '@/api/endpoints/project';
import { useProject } from '@/api/hooks/useProject';
import { Prototype, Project } from '@/api/types';
import KibakoButton from '@/components/atoms/KibakoButton';
import UserRoleList from '@/components/molecules/UserRoleList';
import Loading from '@/components/organisms/Loading';
import { PERMISSION_ACTIONS, RoleType } from '@/constants/roles';
import type { ConnectedUser } from '@/features/prototype/types/livePrototypeInformation';
import { useUser } from '@/hooks/useUser';
import formatDate from '@/utils/dateFormat';
import { can } from '@/utils/permissions';

/**
 * プロトタイプ削除確認画面コンポーネント。
 * 対象プロジェクト / プロトタイプ情報を取得し、Adminのみ削除操作を実行できます。
 * 未ログイン時はログインページへリダイレクトします。
 *
 * @returns JSX.Element 削除確認画面
 */
const DeletePrototypeConfirmation = (): ReactElement => {
  const router = useRouter();
  const { user } = useUser();
  const { projectId } = useParams<{ projectId: string }>();
  const { deleteProject, getProjectRoles } = useProject();
  const [project, setProject] = useState<Project | null>(null);
  const [masterPrototype, setMasterPrototype] = useState<Prototype | null>(
    null
  );
  const [partCount, setPartCount] = useState<number>(0);
  const [roomCount, setRoomCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [canDelete, setCanDelete] = useState<boolean>(false);
  const [creatorName, setCreatorName] = useState<string>('');
  const [roleUsers, setRoleUsers] = useState<ConnectedUser[]>([]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const projects = await projectService.getProjects();
        const current = projects.find((p) => p.project.id === projectId);
        if (current) {
          setProject(current.project);
          const prototypes = current.prototypes as (Prototype & {
            parts?: unknown[];
          })[];
          const master =
            prototypes.find(({ type }) => type === 'MASTER') || null;
          setMasterPrototype(master);
          setPartCount(master?.parts?.length ?? 0);
          setRoomCount(
            prototypes.filter(({ type }) => type === 'INSTANCE').length
          );
        }
        const roles = await getProjectRoles(projectId);
        const deletable = roles.some(
          (r) =>
            r.userId === user?.id &&
            r.roles.some((role) =>
              can(role.name as RoleType, PERMISSION_ACTIONS.DELETE)
            )
        );
        setCanDelete(deletable);
        setRoleUsers(
          roles.map((r) => ({
            userId: r.userId,
            username: r.user?.username ?? '',
            roleName: r.roles[0]?.name,
          }))
        );
        if (current) {
          const creator = roles.find(
            (r) => r.userId === current.project.userId
          );
          setCreatorName(creator?.user?.username ?? '');
        }
      } catch (err) {
        setError('プロトタイプの取得に失敗しました');
        console.error('Error fetching prototype:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!user) {
      router.push('/login'); // 未ログインの場合はログインページへリダイレクト
    } else {
      fetchProject();
    }
  }, [projectId, getProjectRoles, user, router]);

  /** プロジェクト削除処理 */
  const handleDelete = async (): Promise<void> => {
    try {
      setIsDeleting(true);
      await deleteProject(projectId);
      router.push('/projects');
    } catch (err) {
      setError('プロトタイプの削除に失敗しました');
      console.error('Error deleting prototype:', err);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="p-6 overflow-visible rounded-xl bg-gradient-to-r from-kibako-white via-kibako-white to-kibako-tertiary shadow-lg border border-kibako-tertiary/30">
          <div className="mb-4 text-kibako-primary">{error}</div>
          <KibakoButton onClick={() => router.back()}>戻る</KibakoButton>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="p-6 overflow-visible rounded-xl bg-gradient-to-r from-kibako-white via-kibako-white to-kibako-tertiary shadow-lg border border-kibako-tertiary/30 text-center">
          <div className="text-kibako-primary/70 mb-4">
            プロジェクトが見つかりません
          </div>
          <KibakoButton onClick={() => router.push('/projects')}>
            プロジェクト一覧へ戻る
          </KibakoButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-16 relative px-4">
      <div className="sticky top-20 z-sticky bg-transparent backdrop-blur-sm flex items-center gap-3 mb-8 py-4 rounded-lg">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-kibako-tertiary rounded-full transition-colors"
          title="戻る"
        >
          <IoArrowBack className="h-5 w-5 text-kibako-primary hover:text-kibako-primary transition-colors" />
        </button>
        <h1 className="text-3xl text-kibako-primary font-bold mb-0">
          プロジェクトを削除
        </h1>
      </div>

      <div className="p-6 overflow-visible rounded-xl bg-gradient-to-r from-kibako-white via-kibako-white to-kibako-tertiary shadow-lg border border-kibako-tertiary/30">
        <div className="mb-6 rounded-lg bg-kibako-tertiary/20 p-4 border border-kibako-secondary/30 text-kibako-primary/80">
          <p className="mb-2">
            <span className="font-bold">注意:</span> 削除操作は取り消せません。
          </p>
          <p>このプロジェクトに関連する全てのデータが完全に削除されます。</p>
        </div>

        <div className="bg-kibako-secondary/10 p-6 rounded-lg mb-8 border border-kibako-secondary/20">
          <h2 className="text-xl font-semibold mb-4">削除するプロジェクト</h2>
          <div className="mb-4">
            <div className="text-sm text-kibako-primary/60">プロジェクト名</div>
            <div className="text-lg font-medium">{masterPrototype?.name}</div>
          </div>
          <div className="mb-4">
            <div className="text-sm text-kibako-primary/60">パーツ数</div>
            <div className="text-lg font-medium">{partCount}</div>
          </div>
          <div className="mb-4">
            <div className="text-sm text-kibako-primary/60">ルーム数</div>
            <div className="text-lg font-medium">{roomCount}</div>
          </div>
          <div className="mb-4">
            <div className="text-sm text-kibako-primary/60">作成者</div>
            <div className="text-lg font-medium">{creatorName}</div>
          </div>
          <div className="mb-4">
            <div className="text-sm text-kibako-primary/60">作成日時</div>
            <div className="text-lg font-medium">
              {masterPrototype
                ? formatDate(masterPrototype.createdAt, true)
                : ''}
            </div>
          </div>
          <div>
            <div className="text-sm text-kibako-primary/60">
              権限を持つユーザー
            </div>
            {roleUsers.length > 0 ? (
              <UserRoleList users={roleUsers} />
            ) : (
              <div className="text-kibako-primary/60 text-sm">
                権限を持つユーザーがいません
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between gap-4">
          <KibakoButton
            className="flex-1"
            variant="outline"
            onClick={() => router.back()}
            disabled={isDeleting}
          >
            キャンセル
          </KibakoButton>
          <KibakoButton
            className="flex-1 flex items-center justify-center gap-2"
            variant="danger"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
            title={!canDelete ? 'Admin権限が必要です' : undefined}
          >
            {isDeleting ? (
              <>
                <RiLoaderLine className="w-5 h-5 animate-spin" />
                <span className="text-sm">削除する</span>
              </>
            ) : (
              <>
                <IoTrash className="w-5 h-5" />
                <span className="text-sm">削除する</span>
              </>
            )}
          </KibakoButton>
        </div>
        {!canDelete && (
          <p className="text-kibako-primary/70 text-sm mt-4">
            プロジェクトを削除するにはAdmin権限が必要です。
          </p>
        )}
      </div>
    </div>
  );
};

export default DeletePrototypeConfirmation;
