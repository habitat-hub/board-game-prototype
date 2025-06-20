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
  prototypeId: string;
  parentId?: number;
  position: Record<string, any>;
  width: number;
  height: number;
  order: number;
  configurableTypeAsChild: string[];
  originalPartId?: number;
  isReversible?: boolean;
  isFlipped?: boolean;
  /** @format uuid */
  ownerId?: string;
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

export interface Prototype {
  /** @format uuid */
  id: string;
  /** @format uuid */
  prototypeGroupId: string;
  name: string;
  type: 'MASTER' | 'VERSION' | 'INSTANCE';
  minPlayers: number;
  maxPlayers: number;
  versionNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface PrototypeGroup {
  /** @format uuid */
  id: string;
  /** @format uuid */
  userId: string;
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

export type PrototypeGroupsListData = {
  prototypeGroup?: PrototypeGroup;
  prototypes?: Prototype[];
}[];

export interface PrototypeGroupsCreatePayload {
  name?: string;
  playerCount?: number;
}

export type PrototypeGroupsCreateData = PrototypeGroup;

export interface PrototypeGroupsVersionCreatePayload {
  name?: string;
  playerCount?: number;
  versionNumber?: number;
}

export type PrototypeGroupsVersionCreateData = Prototype;

export interface PrototypeGroupsInstanceCreatePayload {
  name?: string;
  playerCount?: number;
  versionNumber?: number;
}

export type PrototypeGroupsInstanceCreateData = Prototype;

export interface PrototypeGroupsDetailData {
  prototypeGroup?: PrototypeGroup;
  prototypes?: Prototype[];
}

export type PrototypeGroupsDeleteData = SuccessResponse;

export type PrototypeGroupsAccessUsersListData = User[];

export interface PrototypeGroupsInviteCreatePayload {
  guestIds?: string[];
}

export type PrototypeGroupsInviteCreateData = SuccessResponse;

export type PrototypeGroupsInviteDeleteData = SuccessResponse;

export type PrototypeGroupsDuplicateCreateData = SuccessResponse;

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
