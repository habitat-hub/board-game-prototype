import axiosInstance from '../client';
import {
  Prototype,
  Project,
  ProjectsCreatePayload,
  ProjectsInviteCreatePayload,
  User,
  ProjectsVersionsCreatePayload,
  ProjectsVersionsCreateData,
} from '../types';

export const projectService = {
  /**
   * プロジェクト一覧取得
   */
  getProjects: async (): Promise<
    Array<{
      project: Project;
      prototypes: Array<Prototype>;
    }>
  > => {
    const response = await axiosInstance.get('/api/projects');
    return response.data;
  },
  /**
   * プロジェクト作成
   */
  createProject: async (
    data: ProjectsCreatePayload
  ): Promise<{
    project: Project;
    prototypes: Array<Prototype>;
  }> => {
    const response = await axiosInstance.post('/api/projects', data);
    return response.data;
  },
  /**
   * プロジェクト複製
   * @param projectId 複製元プロジェクトID
   * @returns 新規プロジェクトとそのマスタープロトタイプ
   */
  duplicateProject: async (
    projectId: string
  ): Promise<{ project: Project; prototypes: Array<Prototype> }> => {
    try {
      const response = await axiosInstance.post(
        `/api/projects/${projectId}/duplicate`
      );
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status as number | undefined;
      const msg = error?.response?.data?.message ?? error?.message ?? '';
      const note = status ? ` (HTTP ${status})` : '';
      throw new Error(`プロジェクトの複製に失敗しました${note}: ${String(msg)}`);
    }
  },
  /**
   * プロトタイプバージョン作成
   */
  createPrototypeVersion: async (
    projectId: string,
    data: ProjectsVersionsCreatePayload
  ): Promise<ProjectsVersionsCreateData> => {
    const response = await axiosInstance.post(
      `/api/projects/${projectId}/versions`,
      data
    );
    return response.data;
  },
  /**
   * プロトタイプバージョン削除
   */
  deletePrototypeVersion: async (
    projectId: string,
    prototypeId: string
  ): Promise<void> => {
    const response = await axiosInstance.delete(
      `/api/projects/${projectId}/versions/${prototypeId}`
    );
    return response.data;
  },
  /**
   * プロジェクトに属するプロトタイプ一覧取得
   */
  getProject: async (
    projectId: string
  ): Promise<Project & { prototypes: Array<Prototype> }> => {
    const response = await axiosInstance.get(`/api/projects/${projectId}`);
    return response.data;
  },
  /**
   * プロジェクト削除
   */
  deleteProject: async (projectId: string): Promise<void> => {
    const response = await axiosInstance.delete(`/api/projects/${projectId}`);
    return response.data;
  },
  /**
   * プロジェクトの参加ユーザー取得
   */
  getAccessUsersByProject: async (projectId: string): Promise<User[]> => {
    const response = await axiosInstance.get(
      `/api/projects/${projectId}/access-users`
    );
    return response.data;
  },
  /**
   * プロジェクトに招待する
   */
  inviteToProject: async (
    projectId: string,
    data: ProjectsInviteCreatePayload
  ): Promise<void> => {
    const response = await axiosInstance.post(
      `/api/projects/${projectId}/invite`,
      data
    );
    return response.data;
  },

  /**
   * プロジェクトから招待を削除する
   */
  deleteInviteFromProject: async (
    projectId: string,
    guestId: string
  ): Promise<void> => {
    const response = await axiosInstance.delete(
      `/api/projects/${projectId}/invite/${guestId}`
    );
    return response.data;
  },

  /**
   * プロジェクトのロール一覧取得
   */
  getProjectRoles: async (
    projectId: string
  ): Promise<
    Array<{
      userId: string;
      user: User;
      roles: Array<{ name: string; description: string }>;
    }>
  > => {
    const response = await axiosInstance.get(
      `/api/projects/${projectId}/roles`
    );
    return response.data;
  },

  /**
   * プロジェクトにロール追加
   */
  addRoleToProject: async (
    projectId: string,
    data: { userId: string; roleName: string }
  ): Promise<void> => {
    const response = await axiosInstance.post(
      `/api/projects/${projectId}/roles`,
      data
    );
    return response.data;
  },

  /**
   * プロジェクトからロール削除
   */
  removeRoleFromProject: async (
    projectId: string,
    userId: string
  ): Promise<void> => {
    const response = await axiosInstance.delete(
      `/api/projects/${projectId}/roles/${userId}`
    );
    return response.data;
  },

  /**
   * プロジェクトのロール更新
   */
  updateRoleInProject: async (
    projectId: string,
    userId: string,
    data: { roleName: string }
  ): Promise<void> => {
    const response = await axiosInstance.put(
      `/api/projects/${projectId}/roles/${userId}`,
      data
    );
    return response.data;
  },
};
