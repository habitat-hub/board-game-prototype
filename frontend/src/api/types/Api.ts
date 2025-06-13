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
  ImagesDetailData,
  PrototypeGroupsAccessUsersListData,
  PrototypeGroupsCreateData,
  PrototypeGroupsCreatePayload,
  PrototypeGroupsDeleteData,
  PrototypeGroupsDetailData,
  PrototypeGroupsDuplicateCreateData,
  PrototypeGroupsInstanceCreateData,
  PrototypeGroupsInviteCreateData,
  PrototypeGroupsInviteCreatePayload,
  PrototypeGroupsInviteDeleteData,
  PrototypeGroupsListData,
  PrototypeGroupsVersionCreateData,
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
  imagesDelete = (imageId: string, params: RequestParams = {}) =>
    this.request<
      ImagesDeleteData,
      Error400Response | Error404Response | Error500Response
    >({
      path: `/api/images/${imageId}`,
      method: 'DELETE',
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
   * @description ユーザーがアクセス可能なプロトタイプグループの一覧を取得します。
   *
   * @tags PrototypeGroups
   * @name PrototypeGroupsList
   * @summary プロトタイプグループ一覧取得
   * @request GET:/api/prototype-groups
   */
  prototypeGroupsList = (params: RequestParams = {}) =>
    this.request<PrototypeGroupsListData, any>({
      path: `/api/prototype-groups`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * @description 新しいプロトタイプグループを作成します。
   *
   * @tags PrototypeGroups
   * @name PrototypeGroupsCreate
   * @summary プロトタイプグループ作成
   * @request POST:/api/prototype-groups
   */
  prototypeGroupsCreate = (
    data: PrototypeGroupsCreatePayload,
    params: RequestParams = {}
  ) =>
    this.request<
      PrototypeGroupsCreateData,
      Error400Response | Error500Response
    >({
      path: `/api/prototype-groups`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたプロトタイプグループのプロトタイプバージョンを作成します。
   *
   * @tags PrototypeGroups
   * @name PrototypeGroupsVersionCreate
   * @summary プロトタイプバージョン作成
   * @request POST:/api/prototype-groups/{prototypeGroupId}/version
   */
  prototypeGroupsVersionCreate = (
    prototypeGroupId: string,
    params: RequestParams = {}
  ) =>
    this.request<
      PrototypeGroupsVersionCreateData,
      Error404Response | Error500Response
    >({
      path: `/api/prototype-groups/${prototypeGroupId}/version`,
      method: 'POST',
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたプロトタイプグループのプロトタイプインスタンスを作成します。
   *
   * @tags PrototypeGroups
   * @name PrototypeGroupsInstanceCreate
   * @summary プロトタイプインスタンス作成
   * @request POST:/api/prototype-groups/{prototypeGroupId}/instance
   */
  prototypeGroupsInstanceCreate = (
    prototypeGroupId: string,
    params: RequestParams = {}
  ) =>
    this.request<
      PrototypeGroupsInstanceCreateData,
      Error404Response | Error500Response
    >({
      path: `/api/prototype-groups/${prototypeGroupId}/instance`,
      method: 'POST',
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたIDのプロトタイプグループに属するプロトタイプの一覧を取得します。
   *
   * @tags PrototypeGroups
   * @name PrototypeGroupsDetail
   * @summary 特定のグループに属するプロトタイプ一覧取得
   * @request GET:/api/prototype-groups/{prototypeGroupId}
   */
  prototypeGroupsDetail = (
    prototypeGroupId: string,
    params: RequestParams = {}
  ) =>
    this.request<PrototypeGroupsDetailData, Error404Response>({
      path: `/api/prototype-groups/${prototypeGroupId}`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたIDのプロトタイプグループを削除します。
   *
   * @tags PrototypeGroups
   * @name PrototypeGroupsDelete
   * @summary プロトタイプグループ削除
   * @request DELETE:/api/prototype-groups/{prototypeGroupId}
   */
  prototypeGroupsDelete = (
    prototypeGroupId: string,
    params: RequestParams = {}
  ) =>
    this.request<PrototypeGroupsDeleteData, Error404Response>({
      path: `/api/prototype-groups/${prototypeGroupId}`,
      method: 'DELETE',
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたプロトタイプグループにアクセス可能なユーザーを取得します。
   *
   * @tags PrototypeGroups
   * @name PrototypeGroupsAccessUsersList
   * @summary プロトタイプグループへのアクセス権を取得
   * @request GET:/api/prototype-groups/{prototypeGroupId}/accessUsers
   */
  prototypeGroupsAccessUsersList = (
    prototypeGroupId: string,
    params: RequestParams = {}
  ) =>
    this.request<PrototypeGroupsAccessUsersListData, any>({
      path: `/api/prototype-groups/${prototypeGroupId}/accessUsers`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたプロトタイプグループにユーザーを招待します。
   *
   * @tags PrototypeGroups
   * @name PrototypeGroupsInviteCreate
   * @summary ユーザーにプロトタイプへのアクセス権を付与
   * @request POST:/api/prototype-groups/{prototypeGroupId}/invite
   */
  prototypeGroupsInviteCreate = (
    prototypeGroupId: string,
    data: PrototypeGroupsInviteCreatePayload,
    params: RequestParams = {}
  ) =>
    this.request<
      PrototypeGroupsInviteCreateData,
      Error400Response | Error404Response | Error500Response
    >({
      path: `/api/prototype-groups/${prototypeGroupId}/invite`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたプロトタイプグループからユーザーのアクセス権を削除します。
   *
   * @tags PrototypeGroups
   * @name PrototypeGroupsInviteDelete
   * @summary ユーザーのアクセス権を削除
   * @request DELETE:/api/prototype-groups/{prototypeGroupId}/invite/{guestId}
   */
  prototypeGroupsInviteDelete = (
    prototypeGroupId: string,
    guestId: string,
    params: RequestParams = {}
  ) =>
    this.request<
      PrototypeGroupsInviteDeleteData,
      Error400Response | Error404Response | Error500Response
    >({
      path: `/api/prototype-groups/${prototypeGroupId}/invite/${guestId}`,
      method: 'DELETE',
      format: 'json',
      ...params,
    });
  /**
   * @description 指定されたプロトタイプグループを複製します。
   *
   * @tags PrototypeGroups
   * @name PrototypeGroupsDuplicateCreate
   * @summary プロトタイプグループの複製
   * @request POST:/api/prototype-groups/{prototypeGroupId}/duplicate
   */
  prototypeGroupsDuplicateCreate = (
    prototypeGroupId: string,
    params: RequestParams = {}
  ) =>
    this.request<
      PrototypeGroupsDuplicateCreateData,
      Error404Response | Error500Response
    >({
      path: `/api/prototype-groups/${prototypeGroupId}/duplicate`,
      method: 'POST',
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
