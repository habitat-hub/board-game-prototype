'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IoArrowBack, IoTrash } from 'react-icons/io5';
import { RiLoaderLine } from 'react-icons/ri';

import { projectService } from '@/api/endpoints/project';
import { useProject } from '@/api/hooks/useProject';
import { Prototype, Project } from '@/api/types';
import KibakoButton from '@/components/atoms/KibakoButton';
import Loading from '@/components/organisms/Loading';
import { useUser } from '@/hooks/useUser';

const DeletePrototypeConfirmation = () => {
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
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

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
        const admin = roles.some(
          (r) =>
            r.userId === user?.id &&
            r.roles.some((role) => role.name === 'admin')
        );
        setIsAdmin(admin);
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

  const handleDelete = async () => {
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
          <div>
            <div className="text-sm text-kibako-primary/60">ルーム数</div>
            <div className="text-lg font-medium">{roomCount}</div>
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
            disabled={!isAdmin || isDeleting}
            title={!isAdmin ? '管理者権限が必要です' : undefined}
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
        {!isAdmin && (
          <p className="text-kibako-primary/70 text-sm mt-4">
            プロジェクトを削除するには管理者権限が必要です。
          </p>
        )}
      </div>
    </div>
  );
};

export default DeletePrototypeConfirmation;
