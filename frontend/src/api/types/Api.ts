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

import {
  Error400Response,
  Error404Response,
  Error500Response,
  ImagesCreateData,
  ImagesCreatePayload,
  ImagesDeleteData,
  ImagesDeleteParams,
  ImagesDetailData,
  ProjectsAccessUsersListData,
  ProjectsCreateData,
  ProjectsCreatePayload,
  ProjectsDeleteData,
  ProjectsDetailData,
  ProjectsDuplicateCreateData,
  ProjectsInviteCreateData,
  ProjectsInviteCreatePayload,
  ProjectsInviteDeleteData,
  ProjectsListData,
  ProjectsMembersListData,
  ProjectsRolesCreateData,
  ProjectsRolesCreatePayload,
  ProjectsRolesDeleteData,
  ProjectsRolesListData,
  ProjectsRolesUpdateData,
  ProjectsRolesUpdatePayload,
  ProjectsVersionCreateData,
  ProjectsVersionCreatePayload,
  PrototypesDeleteData,
  PrototypesDetailData,
  PrototypesUpdateData,
  PrototypesUpdatePayload,
  UsersSearchListData,
  UsersSearchListParams,
  UsersUpdateData,
  UsersUpdatePayload,
} from './data-contracts';
import { ContentType, HttpClient, RequestParams } from './http-client';

export class Api<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description S3に画像をアップロードし、画像のメタデータを保存します。
   *
   * @tags Images
   * @name ImagesCreate
   * @summary 画像アップロード
   * @request POST:/api/images
   */
  imagesCreate = (data: ImagesCreatePayload, params: RequestParams = {}) =>
    this.request<ImagesCreateData, Error400Response | Error500Response>({
      path: `/api/images`,
      method: 'POST',
      body: data,
      type: ContentType.FormData,
      format: 'json',
      ...params,
    });
  /**
   * @description S3から指定された画像を取得し、画像データを直接返します。
   *
   * @tags Images
   * @name ImagesDetail
   * @summary 画像取得
   * @request GET:/api/images/{imageId}
   */
  imagesDetail = (imageId: string, params: RequestParams = {}) =>
    this.request<
      ImagesDetailData,
      Error400Response | Error404Response | Error500Response
    >({
      path: `/api/images/${imageId}`,
      method: 'GET',
      format: 'blob',
      ...params,
    });
  /**
   * @description S3から指定された画像を削除します。
   *
   * @tags Images
   * @name ImagesDelete
   * @summary 画像削除
   * @request DELETE:/api/images/{imageId}
   */
  imagesDelete = (
    { imageId, ...query }: ImagesDeleteParams,
    params: RequestParams = {}
  ) =>
    this.request<
      ImagesDeleteData,
      Error400Response | Error404Response | Error500Response
    >({
      path: `/api/images/${imageId}`,
      method: 'DELETE',
      query: query,
      ...params,
    });
  /**
   * @description ユーザーがアクセス可能なプロジェクトの一覧を取得します。
   *
   * @tags Projects
   * @name ProjectsList
   * @summary プロジェクト一覧取得
   * @request GET:/api/projects
   */
  projectsList = (params: RequestParams = {}) =>
    this.request<ProjectsListData, any>({
      path: `/api/projects`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * @description 新しいプロジェクトを作成します。
   *
   * @tags Projects
   * @name ProjectsCreate
   * @summary プロジェクト作成
   * @request POST:/api/projects
   */
  projectsCreate = (data: ProjectsCreatePayload, params: RequestParams = {}) =>
    this.request<ProjectsCreateData, Error400Response | Error500Response>({
      path: `/api/projects`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたプロジェクトのプロトタイプバージョンを作成します。
   *
   * @tags Projects
   * @name ProjectsVersionCreate
   * @summary プロトタイプバージョン作成
   * @request POST:/api/projects/{projectId}/version
   */
  projectsVersionCreate = (
    projectId: string,
    data: ProjectsVersionCreatePayload,
    params: RequestParams = {}
  ) =>
    this.request<
      ProjectsVersionCreateData,
      Error404Response | Error500Response
    >({
      path: `/api/projects/${projectId}/version`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたIDのプロジェクトに属するプロトタイプの一覧を取得します。
   *
   * @tags Projects
   * @name ProjectsDetail
   * @summary 特定のプロジェクトに属するプロトタイプ一覧取得
   * @request GET:/api/projects/{projectId}
   */
  projectsDetail = (projectId: string, params: RequestParams = {}) =>
    this.request<ProjectsDetailData, Error404Response>({
      path: `/api/projects/${projectId}`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたIDのプロジェクトを削除します。
   *
   * @tags Projects
   * @name ProjectsDelete
   * @summary プロジェクト削除
   * @request DELETE:/api/projects/{projectId}
   */
  projectsDelete = (projectId: string, params: RequestParams = {}) =>
    this.request<ProjectsDeleteData, Error404Response>({
      path: `/api/projects/${projectId}`,
      method: 'DELETE',
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたプロジェクトにアクセス可能なユーザーを取得します。
   *
   * @tags Projects
   * @name ProjectsAccessUsersList
   * @summary プロジェクトへのアクセス権を取得
   * @request GET:/api/projects/{projectId}/access-users
   */
  projectsAccessUsersList = (projectId: string, params: RequestParams = {}) =>
    this.request<ProjectsAccessUsersListData, any>({
      path: `/api/projects/${projectId}/access-users`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたプロジェクトにユーザーを招待します。
   *
   * @tags Projects
   * @name ProjectsInviteCreate
   * @summary ユーザーにプロジェクトへのアクセス権を付与
   * @request POST:/api/projects/{projectId}/invite
   */
  projectsInviteCreate = (
    projectId: string,
    data: ProjectsInviteCreatePayload,
    params: RequestParams = {}
  ) =>
    this.request<
      ProjectsInviteCreateData,
      Error400Response | Error404Response | Error500Response
    >({
      path: `/api/projects/${projectId}/invite`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたプロジェクトからユーザーのアクセス権を削除します。
   *
   * @tags Projects
   * @name ProjectsInviteDelete
   * @summary ユーザーのアクセス権を削除
   * @request DELETE:/api/projects/{projectId}/invite/{guestId}
   */
  projectsInviteDelete = (
    projectId: string,
    guestId: string,
    params: RequestParams = {}
  ) =>
    this.request<
      ProjectsInviteDeleteData,
      Error400Response | Error404Response | Error500Response
    >({
      path: `/api/projects/${projectId}/invite/${guestId}`,
      method: 'DELETE',
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたプロジェクトを複製します。
   *
   * @tags Projects
   * @name ProjectsDuplicateCreate
   * @summary プロジェクトの複製
   * @request POST:/api/projects/{projectId}/duplicate
   */
  projectsDuplicateCreate = (projectId: string, params: RequestParams = {}) =>
    this.request<
      ProjectsDuplicateCreateData,
      Error404Response | Error500Response
    >({
      path: `/api/projects/${projectId}/duplicate`,
      method: 'POST',
      format: 'json',
      ...params,
    });
  /**
   * @description プロジェクトのメンバーとそのロールを取得します。
   *
   * @tags Projects
   * @name ProjectsMembersList
   * @summary プロジェクトのメンバー一覧取得
   * @request GET:/api/projects/{projectId}/members
   */
  projectsMembersList = (projectId: string, params: RequestParams = {}) =>
    this.request<ProjectsMembersListData, any>({
      path: `/api/projects/${projectId}/members`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * @description プロジェクトのユーザーロール一覧を取得します。
   *
   * @tags Projects
   * @name ProjectsRolesList
   * @summary プロジェクトのロール一覧取得
   * @request GET:/api/projects/{projectId}/roles
   */
  projectsRolesList = (projectId: string, params: RequestParams = {}) =>
    this.request<ProjectsRolesListData, any>({
      path: `/api/projects/${projectId}/roles`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * @description ユーザーにプロジェクトのロールを割り当てます。
   *
   * @tags Projects
   * @name ProjectsRolesCreate
   * @summary プロジェクトにロールを追加
   * @request POST:/api/projects/{projectId}/roles
   */
  projectsRolesCreate = (
    projectId: string,
    data: ProjectsRolesCreatePayload,
    params: RequestParams = {}
  ) =>
    this.request<ProjectsRolesCreateData, void>({
      path: `/api/projects/${projectId}/roles`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description ユーザーからプロジェクトのロールを削除します。
   *
   * @tags Projects
   * @name ProjectsRolesDelete
   * @summary プロジェクトからロールを削除
   * @request DELETE:/api/projects/{projectId}/roles/{userId}
   */
  projectsRolesDelete = (
    projectId: string,
    userId: string,
    params: RequestParams = {}
  ) =>
    this.request<ProjectsRolesDeleteData, void>({
      path: `/api/projects/${projectId}/roles/${userId}`,
      method: 'DELETE',
      ...params,
    });
  /**
   * @description ユーザーのプロジェクトロールを変更します。
   *
   * @tags Projects
   * @name ProjectsRolesUpdate
   * @summary プロジェクトのロールを更新
   * @request PUT:/api/projects/{projectId}/roles/{userId}
   */
  projectsRolesUpdate = (
    projectId: string,
    userId: string,
    data: ProjectsRolesUpdatePayload,
    params: RequestParams = {}
  ) =>
    this.request<ProjectsRolesUpdateData, void>({
      path: `/api/projects/${projectId}/roles/${userId}`,
      method: 'PUT',
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description 指定されたIDのプロトタイプを取得します。
   *
   * @tags Prototypes
   * @name PrototypesDetail
   * @summary 特定のプロトタイプ取得
   * @request GET:/api/prototypes/{prototypeId}
   */
  prototypesDetail = (prototypeId: string, params: RequestParams = {}) =>
    this.request<PrototypesDetailData, Error404Response>({
      path: `/api/prototypes/${prototypeId}`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたIDのプロトタイプを更新します。
   *
   * @tags Prototypes
   * @name PrototypesUpdate
   * @summary プロトタイプ更新
   * @request PUT:/api/prototypes/{prototypeId}
   */
  prototypesUpdate = (
    prototypeId: string,
    data: PrototypesUpdatePayload,
    params: RequestParams = {}
  ) =>
    this.request<PrototypesUpdateData, Error404Response>({
      path: `/api/prototypes/${prototypeId}`,
      method: 'PUT',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたIDのプロトタイプを削除します。
   *
   * @tags Prototypes
   * @name PrototypesDelete
   * @summary プロトタイプ削除
   * @request DELETE:/api/prototypes/{prototypeId}
   */
  prototypesDelete = (prototypeId: string, params: RequestParams = {}) =>
    this.request<PrototypesDeleteData, Error404Response>({
      path: `/api/prototypes/${prototypeId}`,
      method: 'DELETE',
      format: 'json',
      ...params,
    });
  /**
   * @description ユーザー名でユーザーを検索します。
   *
   * @tags Users
   * @name UsersSearchList
   * @summary ユーザー検索
   * @request GET:/api/users/search
   */
  usersSearchList = (
    query: UsersSearchListParams,
    params: RequestParams = {}
  ) =>
    this.request<UsersSearchListData, any>({
      path: `/api/users/search`,
      method: 'GET',
      query: query,
      format: 'json',
      ...params,
    });
  /**
   * @description ユーザー名を更新します。
   *
   * @tags Users
   * @name UsersUpdate
   * @summary ユーザー情報更新
   * @request PUT:/api/users/{userId}
   */
  usersUpdate = (
    userId: string,
    data: UsersUpdatePayload,
    params: RequestParams = {}
  ) =>
    this.request<UsersUpdateData, void>({
      path: `/api/users/${userId}`,
      method: 'PUT',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params,
    });
}
