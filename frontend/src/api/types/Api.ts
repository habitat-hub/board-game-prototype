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
  PrototypesCreateData,
  PrototypesCreatePayload,
  PrototypesDeleteData,
  PrototypesDetailData,
  PrototypesDuplicateCreateData,
  PrototypesGroupsAccessUsersListData,
  PrototypesGroupsDetailData,
  PrototypesGroupsInviteCreateData,
  PrototypesGroupsInviteCreatePayload,
  PrototypesGroupsInviteDeleteData,
  PrototypesListData,
  PrototypesPreviewCreateData,
  PrototypesUpdateData,
  PrototypesUpdatePayload,
  PrototypesVersionsCreateData,
  PrototypesVersionsCreatePayload,
  PrototypesVersionsDeleteData,
  PrototypesVersionsListData,
  UsersSearchListData,
  UsersSearchListParams,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

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
   * @description ユーザーがアクセス可能なプロトタイプの一覧を取得します。
   *
   * @tags Prototypes
   * @name PrototypesList
   * @summary プロトタイプ一覧取得
   * @request GET:/api/prototypes
   */
  prototypesList = (params: RequestParams = {}) =>
    this.request<PrototypesListData, any>({
      path: `/api/prototypes`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description 新しいプロトタイプを作成します。
   *
   * @tags Prototypes
   * @name PrototypesCreate
   * @summary プロトタイプ作成
   * @request POST:/api/prototypes
   */
  prototypesCreate = (
    data: PrototypesCreatePayload,
    params: RequestParams = {},
  ) =>
    this.request<PrototypesCreateData, Error400Response | Error500Response>({
      path: `/api/prototypes`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description 指定されたIDのプロトタイプを取得します。
   *
   * @tags Prototypes
   * @name PrototypesDetail
   * @summary プロトタイプ取得
   * @request GET:/api/prototypes/{prototypeId}
   */
  prototypesDetail = (prototypeId: string, params: RequestParams = {}) =>
    this.request<PrototypesDetailData, Error404Response>({
      path: `/api/prototypes/${prototypeId}`,
      method: "GET",
      format: "json",
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
    params: RequestParams = {},
  ) =>
    this.request<PrototypesUpdateData, Error404Response>({
      path: `/api/prototypes/${prototypeId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      format: "json",
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
      method: "DELETE",
      format: "json",
      ...params,
    });
  /**
   * @description 指定されたプロトタイプのバージョン一覧を取得します。
   *
   * @tags Prototypes
   * @name PrototypesVersionsList
   * @summary プロトタイプバージョン一覧取得
   * @request GET:/api/prototypes/{prototypeId}/versions
   */
  prototypesVersionsList = (prototypeId: string, params: RequestParams = {}) =>
    this.request<PrototypesVersionsListData, Error404Response>({
      path: `/api/prototypes/${prototypeId}/versions`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description 指定されたグループに属するプロトタイプの一覧を作成日の古い順で取得します。
   *
   * @tags Prototypes
   * @name PrototypesGroupsDetail
   * @summary グループのプロトタイプ一覧取得
   * @request GET:/api/prototypes/groups/{groupId}
   */
  prototypesGroupsDetail = (groupId: string, params: RequestParams = {}) =>
    this.request<PrototypesGroupsDetailData, any>({
      path: `/api/prototypes/groups/${groupId}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description 指定されたグループにアクセス可能なユーザーを取得します。
   *
   * @tags Prototypes
   * @name PrototypesGroupsAccessUsersList
   * @summary グループへのアクセス権を取得
   * @request GET:/api/prototypes/groups/{groupId}/accessUsers
   */
  prototypesGroupsAccessUsersList = (
    groupId: string,
    params: RequestParams = {},
  ) =>
    this.request<PrototypesGroupsAccessUsersListData, any>({
      path: `/api/prototypes/groups/${groupId}/accessUsers`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description 指定されたグループにユーザーを招待します。
   *
   * @tags Prototypes
   * @name PrototypesGroupsInviteCreate
   * @summary ユーザーにプロトタイプへのアクセス権を付与
   * @request POST:/api/prototypes/groups/{groupId}/invite
   */
  prototypesGroupsInviteCreate = (
    groupId: string,
    data: PrototypesGroupsInviteCreatePayload,
    params: RequestParams = {},
  ) =>
    this.request<
      PrototypesGroupsInviteCreateData,
      Error400Response | Error404Response | Error500Response
    >({
      path: `/api/prototypes/groups/${groupId}/invite`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description 指定されたグループからユーザーのアクセス権を削除します。
   *
   * @tags Prototypes
   * @name PrototypesGroupsInviteDelete
   * @summary ユーザーのアクセス権を削除
   * @request DELETE:/api/prototypes/groups/{groupId}/invite/{guestId}
   */
  prototypesGroupsInviteDelete = (
    groupId: string,
    guestId: string,
    params: RequestParams = {},
  ) =>
    this.request<
      PrototypesGroupsInviteDeleteData,
      Error400Response | Error404Response | Error500Response
    >({
      path: `/api/prototypes/groups/${groupId}/invite/${guestId}`,
      method: "DELETE",
      format: "json",
      ...params,
    });
  /**
   * @description 指定されたプロトタイプを複製します。
   *
   * @tags Prototypes
   * @name PrototypesDuplicateCreate
   * @summary プロトタイプの複製
   * @request POST:/api/prototypes/{prototypeId}/duplicate
   */
  prototypesDuplicateCreate = (
    prototypeId: string,
    params: RequestParams = {},
  ) =>
    this.request<
      PrototypesDuplicateCreateData,
      Error404Response | Error500Response
    >({
      path: `/api/prototypes/${prototypeId}/duplicate`,
      method: "POST",
      format: "json",
      ...params,
    });
  /**
   * @description 指定されたプロトタイプのプレビュー版を作成します。
   *
   * @tags Prototypes
   * @name PrototypesPreviewCreate
   * @summary プレビュー版作成
   * @request POST:/api/prototypes/{prototypeId}/preview
   */
  prototypesPreviewCreate = (prototypeId: string, params: RequestParams = {}) =>
    this.request<
      PrototypesPreviewCreateData,
      Error404Response | Error500Response
    >({
      path: `/api/prototypes/${prototypeId}/preview`,
      method: "POST",
      format: "json",
      ...params,
    });
  /**
   * @description 指定されたプロトタイプのバージョンを作成します。
   *
   * @tags Prototypes
   * @name PrototypesVersionsCreate
   * @summary バージョン作成
   * @request POST:/api/prototypes/{prototypeId}/versions/{prototypeVersionId}
   */
  prototypesVersionsCreate = (
    prototypeId: string,
    prototypeVersionId: string,
    data: PrototypesVersionsCreatePayload,
    params: RequestParams = {},
  ) =>
    this.request<
      PrototypesVersionsCreateData,
      Error400Response | Error404Response | Error500Response
    >({
      path: `/api/prototypes/${prototypeId}/versions/${prototypeVersionId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description 指定されたプロトタイプのバージョンを削除します。マスターバージョン（0.0.0）は削除できません。
   *
   * @tags Prototypes
   * @name PrototypesVersionsDelete
   * @summary バージョン削除
   * @request DELETE:/api/prototypes/{prototypeId}/versions/{prototypeVersionId}
   */
  prototypesVersionsDelete = (
    prototypeId: string,
    prototypeVersionId: string,
    params: RequestParams = {},
  ) =>
    this.request<
      PrototypesVersionsDeleteData,
      Error400Response | Error404Response | Error500Response
    >({
      path: `/api/prototypes/${prototypeId}/versions/${prototypeVersionId}`,
      method: "DELETE",
      format: "json",
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
    params: RequestParams = {},
  ) =>
    this.request<UsersSearchListData, any>({
      path: `/api/users/search`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
}
