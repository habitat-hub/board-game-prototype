/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** @example {"message":"正常に処理が完了しました"} */
export interface SuccessResponse {
  /** 処理成功時のメッセージ */
  message: string;
}

/** @example {"error":"リクエストが不正です"} */
export interface Error400Response {
  /** エラーメッセージ */
  error: string;
}

/** @example {"error":"リソースが見つかりません"} */
export interface Error404Response {
  /** エラーメッセージ */
  error: string;
}

/** @example {"error":"予期せぬエラーが発生しました"} */
export interface Error500Response {
  /** エラーメッセージ */
  error: string;
}

export interface Image {
  /** @format uuid */
  id: string;
  displayName: string;
  storagePath: string;
  contentType: string;
  fileSize: number;
  /** @format uuid */
  uploaderUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Part {
  id: number;
  type: 'token' | 'card' | 'hand' | 'deck' | 'area';
  /** @format uuid */
  prototypeId: string;
  position: Record<string, any>;
  width: number;
  height: number;
  order: number;
  frontSide?: 'front' | 'back';
  /** @format uuid */
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartProperty {
  partId: number;
  side: 'front' | 'back';
  name: string;
  description: string;
  color: string;
  textColor: string;
  /** @format uuid */
  imageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  /** @format uuid */
  id: string;
  /** @format uuid */
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prototype {
  /** @format uuid */
  id: string;
  /** @format uuid */
  projectId: string;
  name: string;
  type: 'MASTER' | 'VERSION' | 'INSTANCE';
  versionNumber: number;
  /** @format uuid */
  sourceVersionPrototypeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission {
  roleId: number;
  permissionId: number;
}

export interface User {
  /** @format uuid */
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: number;
  /** @format uuid */
  userId: string;
  roleId: number;
  resourceType: string;
  resourceId: string;
  createdAt: string;
  updatedAt: string;
}

export type LogoutCreateData = SuccessResponse;

export interface UserListData {
  id?: string;
  username?: string;
}

export interface ImagesCreatePayload {
  /**
   * アップロードする画像ファイル
   * @format binary
   */
  image?: File;
}

export type ImagesCreateData = Image;

/** @format binary */
export type ImagesDetailData = File;

export interface ImagesDeleteParams {
  /** プロトタイプID */
  prototypeId: string;
  /** パーツID */
  partId: number;
  /** 面（front または back） */
  side: 'front' | 'back';
  /**
   * 更新をemitするかどうか（デフォルトはfalse）
   * @default false
   */
  emitUpdate: 'true' | 'false';
  /** 削除する画像のID */
  imageId: string;
}

export type ImagesDeleteData = any;

export type ProjectsListData = {
  project?: Project;
  prototypes?: Prototype[];
}[];

export interface ProjectsCreatePayload {
  name?: string;
}

export type ProjectsCreateData = Project;

export interface ProjectsVersionCreatePayload {
  name?: string;
  versionNumber?: number;
}

export type ProjectsVersionCreateData = Prototype;

export interface ProjectsDetailData {
  project?: Project;
  prototypes?: Prototype[];
}

export type ProjectsDeleteData = SuccessResponse;

export type ProjectsAccessUsersListData = User[];

export interface ProjectsInviteCreatePayload {
  /** 招待するユーザーのIDリスト */
  guestIds?: string[];
  /**
   * 付与するロールタイプ（admin：管理者、editor：編集者、viewer：閲覧者）
   * @default "editor"
   */
  roleType?: 'admin' | 'editor' | 'viewer';
}

export type ProjectsInviteCreateData = SuccessResponse;

export type ProjectsInviteDeleteData = SuccessResponse;

export type ProjectsDuplicateCreateData = SuccessResponse;

export type ProjectsMembersListData = {
  userId?: string;
  roles?: {
    name?: string;
    description?: string;
  }[];
}[];

export type ProjectsRolesListData = {
  userId?: string;
  user?: User;
  roles?: {
    name?: string;
    description?: string;
  }[];
}[];

export interface ProjectsRolesCreatePayload {
  userId?: string;
  roleName?: 'admin' | 'editor' | 'viewer';
}

export type ProjectsRolesCreateData = any;

export type ProjectsRolesDeleteData = any;

export interface ProjectsRolesUpdatePayload {
  roleName?: 'admin' | 'editor' | 'viewer';
}

export type ProjectsRolesUpdateData = any;

export interface PrototypesDetailData {
  prototype?: Prototype;
}

export interface PrototypesUpdatePayload {
  name?: string;
  minPlayers?: number;
  maxPlayers?: number;
}

export type PrototypesUpdateData = Prototype;

export type PrototypesDeleteData = SuccessResponse;

export interface UsersSearchListParams {
  /** 検索するユーザー名 */
  username: string;
}

export type UsersSearchListData = User[];

export interface UsersUpdatePayload {
  /** 新しいユーザー名 */
  username: string;
}

export type UsersUpdateData = User;
