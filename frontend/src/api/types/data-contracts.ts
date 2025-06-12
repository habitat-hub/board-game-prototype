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

export interface Access {
  id: number;
  /** @format uuid */
  prototypeGroupId: string;
  name: string;
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
  prototypeVersionId: string;
  parentId?: number;
  position: Record<string, any>;
  width: number;
  height: number;
  order: number;
  configurableTypeAsChild: string[];
  originalPartId?: number;
  isReversible?: boolean;
  isFlipped?: boolean;
  ownerId?: number;
  canReverseCardOnDeck?: boolean;
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

export interface Player {
  id: number;
  /** @format uuid */
  prototypeVersionId: string;
  /** @format uuid */
  userId?: string;
  playerName: string;
  originalPlayerId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Prototype {
  /** @format uuid */
  id: string;
  /** @format uuid */
  userId: string;
  name: string;
  type: 'EDIT' | 'PREVIEW';
  /** @format uuid */
  masterPrototypeId?: string;
  /** @format uuid */
  groupId: string;
  minPlayers: number;
  maxPlayers: number;
  createdAt: string;
  updatedAt: string;
}

export interface PrototypeGroup {
  /** @format uuid */
  id: string;
  /** @format uuid */
  prototypeId: string;
}

export interface PrototypeVersion {
  /** @format uuid */
  id: string;
  /** @format uuid */
  prototypeId: string;
  versionNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  /** @format uuid */
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccess {
  /** @format uuid */
  userId: string;
  accessId: number;
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

export type ImagesDeleteData = any;

export type PrototypesListData = Prototype[];

export interface PrototypesCreatePayload {
  name?: string;
  playerCount?: number;
}

export type PrototypesCreateData = Prototype;

export type PrototypesDetailData = Prototype;

export interface PrototypesUpdatePayload {
  name?: string;
  minPlayers?: number;
  maxPlayers?: number;
}

export type PrototypesUpdateData = Prototype;

export type PrototypesDeleteData = SuccessResponse;

export interface PrototypesVersionsListData {
  prototype: Prototype;
  versions: PrototypeVersion[];
}

export type PrototypesGroupsDetailData = {
  prototype: Prototype;
  versions: PrototypeVersion[];
}[];

export type PrototypesGroupsAccessUsersListData = User[];

export interface PrototypesGroupsInviteCreatePayload {
  guestIds?: string[];
}

export type PrototypesGroupsInviteCreateData = SuccessResponse;

export type PrototypesGroupsInviteDeleteData = SuccessResponse;

export type PrototypesDuplicateCreateData = SuccessResponse;

export type PrototypesPreviewCreateData = Prototype;

export interface PrototypesVersionsCreatePayload {
  /** 新しいバージョンの説明 */
  description?: string;
}

export type PrototypesVersionsCreateData = SuccessResponse;

export type PrototypesVersionsDeleteData = SuccessResponse;

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
