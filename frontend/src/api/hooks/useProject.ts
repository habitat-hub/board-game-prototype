import { useCallback } from 'react';

import { projectService } from '@/api/endpoints/project';
import {
  ProjectsCreatePayload,
  ProjectsInviteCreatePayload,
  ProjectsVersionsCreatePayload,
} from '@/api/types';

export const useProject = () => {
  /**
   * プロジェクト一覧取得
   */
  const getProjects = useCallback(async () => {
    return await projectService.getProjects();
  }, []);

  /**
   * プロジェクト作成
   */
  const createProject = useCallback(async (data: ProjectsCreatePayload) => {
    return await projectService.createProject(data);
  }, []);

  /**
   * プロトタイプバージョン作成
   */
  const createPrototypeVersion = useCallback(
    async (projectId: string, data: ProjectsVersionsCreatePayload) => {
      return await projectService.createPrototypeVersion(projectId, data);
    },
    []
  );

  /**
   * プロトタイプバージョン削除
   */
  const deletePrototypeVersion = useCallback(
    async (projectId: string, prototypeId: string) => {
      return await projectService.deletePrototypeVersion(
        projectId,
        prototypeId
      );
    },
    []
  );

  /**
   * プロジェクト詳細取得
   */
  const getProject = useCallback(async (projectId: string) => {
    return await projectService.getProject(projectId);
  }, []);

  /**
   * プロジェクト削除
   */
  const deleteProject = useCallback(async (projectId: string) => {
    return await projectService.deleteProject(projectId);
  }, []);

  /**
   * プロジェクトの参加ユーザー取得
   */
  const getAccessUsersByProject = useCallback(async (projectId: string) => {
    return await projectService.getAccessUsersByProject(projectId);
  }, []);

  /**
   * プロジェクトに招待する
   */
  const inviteToProject = useCallback(
    async (projectId: string, data: ProjectsInviteCreatePayload) => {
      return await projectService.inviteToProject(projectId, data);
    },
    []
  );

  /**
   * プロジェクトから招待を削除する
   */
  const deleteInviteFromProject = useCallback(
    async (projectId: string, guestId: string) => {
      return await projectService.deleteInviteFromProject(projectId, guestId);
    },
    []
  );

  /**
   * プロジェクトのロール一覧取得
   */
  const getProjectRoles = useCallback(async (projectId: string) => {
    return await projectService.getProjectRoles(projectId);
  }, []);

  /**
   * プロジェクトにロール追加
   */
  const addRoleToProject = useCallback(
    async (projectId: string, data: { userId: string; roleName: string }) => {
      return await projectService.addRoleToProject(projectId, data);
    },
    []
  );

  /**
   * プロジェクトからロール削除
   */
  const removeRoleFromProject = useCallback(
    async (projectId: string, userId: string) => {
      return await projectService.removeRoleFromProject(projectId, userId);
    },
    []
  );

  /**
   * プロジェクトのロール更新
   */
  const updateRoleInProject = useCallback(
    async (projectId: string, userId: string, data: { roleName: string }) => {
      return await projectService.updateRoleInProject(projectId, userId, data);
    },
    []
  );

  return {
    getProjects,
    createProject,
    getProject,
    getAccessUsersByProject,
    inviteToProject,
    deleteInviteFromProject,
    deleteProject,
    getProjectRoles,
    addRoleToProject,
    removeRoleFromProject,
    updateRoleInProject,
    createPrototypeVersion,
    deletePrototypeVersion,
  };
};
