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

/** @example {"error":"認証が必要です"} */
export interface Error401Response {
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
  frontSide?: 'front' | 'back' | null;
  ownerId?: string | null;
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
  imageId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string | null;
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
  sourceVersionPrototypeId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string | null;
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

export interface UsersNeedTutorialListData {
  /** チュートリアルを表示すべきかどうか */
  needTutorial: boolean;
}

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

export type ProjectsListData = {
  project?: Project & {
    owner?: {
      /** @format uuid */
      id?: string;
      username?: string;
    } | null;
    permissions?: {
      canRead: boolean;
      canWrite: boolean;
      canDelete: boolean;
      canManage: boolean;
    };
  };
  prototypes?: (Prototype & {
    parts?: (Part & {
      partProperties?: (PartProperty & {
        image?: Image;
      })[];
    })[];
  })[];
}[];

export interface ProjectsCreatePayload {
  name?: string;
}

export type ProjectsCreateData = Project;

export interface ProjectsVersionsCreatePayload {
  /** プロトタイプ名 */
  name: string;
}

export interface ProjectsVersionsCreateData {
  version?: Prototype;
  instance?: Prototype;
}

export type ProjectsVersionsDeleteData = SuccessResponse;

export type ProjectsDetailData = Project & {
  prototypes?: Prototype[];
};

export type ProjectsDeleteData = SuccessResponse;

export type ProjectsAccessUsersListData = User[];

export interface ProjectsInviteCreatePayload {
  /** 招待するユーザーのIDリスト */
  guestIds?: string[];
  /**
   * 付与するロールタイプ（Admin, Editor, Viewer）
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

export interface DonationsOptionsListData {
  /**
   * 寄付に使用する通貨
   * @example "jpy"
   */
  currency?: string;
  options?: {
    /**
     * 利用可能な寄付金額（JPY）
     * @example 500
     */
    amount?: number;
    /**
     * Stripe Price ID
     * @example "price_test_jpy_500"
     */
    priceId?: string;
  }[];
}

export interface DonationsCheckoutSessionCreatePayload {
  /**
   * 寄付金額（JPY）
   * @example 500
   */
  amount: number;
}

export interface DonationsCheckoutSessionCreateData {
  /**
   * Stripe CheckoutセッションID
   * @example "cs_test_123"
   */
  sessionId?: string;
  /**
   * Stripe CheckoutセッションURL
   * @format uri
   * @example "https://checkout.stripe.com/test-session"
   */
  url?: string;
}

export type LogoutCreateData = SuccessResponse;

export interface UserListData {
  id?: string;
  username?: string;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from 'axios';
import axios from 'axios';

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, 'data' | 'params' | 'url' | 'responseType'> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  'body' | 'method' | 'query' | 'path'
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, 'data' | 'cancelToken'> {
  securityWorker?: (
    securityData: SecurityDataType | null
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = 'application/json',
  FormData = 'multipart/form-data',
  UrlEncoded = 'application/x-www-form-urlencoded',
  Text = 'text/plain',
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>['securityWorker'];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || '',
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === 'object' && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem)
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === 'boolean' ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === 'object'
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== 'string'
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { 'Content-Type': type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Board Game Prototype API
 * @version 1.0.0
 *
 * ## 概要
 * このAPIは、ボードゲームプロトタイプの作成と管理を行うためのものです。
 *
 * ## 認証
 * - 基本的にAPIエンドポイントは認証が必要です
 * - アプリケーションを起動し、Google OAuth2.0を使用した認証を行なってください（Swagger UIでは認証ができません）
 * - 認証後、Cookieにセッション情報が保存されます
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * @description ユーザー名でユーザーを検索します。
     *
     * @tags Users
     * @name UsersSearchList
     * @summary ユーザー検索
     * @request GET:/api/users/search
     */
    usersSearchList: (
      query: UsersSearchListParams,
      params: RequestParams = {}
    ) =>
      this.request<UsersSearchListData, any>({
        path: `/api/users/search`,
        method: 'GET',
        query: query,
        format: 'json',
        ...params,
      }),

    /**
     * @description ユーザー名を更新します。
     *
     * @tags Users
     * @name UsersUpdate
     * @summary ユーザー情報更新
     * @request PUT:/api/users/{userId}
     */
    usersUpdate: (
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
      }),

    /**
     * @description 指定されたユーザーがチュートリアルを表示すべきか判定します。
     *
     * @tags Users
     * @name UsersNeedTutorialList
     * @summary チュートリアル必要判定
     * @request GET:/api/users/{userId}/need-tutorial
     */
    usersNeedTutorialList: (userId: string, params: RequestParams = {}) =>
      this.request<UsersNeedTutorialListData, void>({
        path: `/api/users/${userId}/need-tutorial`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * @description 指定されたIDのプロトタイプを取得します。
     *
     * @tags Prototypes
     * @name PrototypesDetail
     * @summary 特定のプロトタイプ取得
     * @request GET:/api/prototypes/{prototypeId}
     */
    prototypesDetail: (prototypeId: string, params: RequestParams = {}) =>
      this.request<PrototypesDetailData, Error404Response>({
        path: `/api/prototypes/${prototypeId}`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * @description 指定されたIDのプロトタイプを更新します。
     *
     * @tags Prototypes
     * @name PrototypesUpdate
     * @summary プロトタイプ更新
     * @request PUT:/api/prototypes/{prototypeId}
     */
    prototypesUpdate: (
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
      }),

    /**
     * @description 指定されたIDのプロトタイプを削除します。
     *
     * @tags Prototypes
     * @name PrototypesDelete
     * @summary プロトタイプ削除
     * @request DELETE:/api/prototypes/{prototypeId}
     */
    prototypesDelete: (prototypeId: string, params: RequestParams = {}) =>
      this.request<PrototypesDeleteData, Error404Response>({
        path: `/api/prototypes/${prototypeId}`,
        method: 'DELETE',
        format: 'json',
        ...params,
      }),

    /**
     * @description ユーザーがアクセス可能なプロジェクトの一覧を取得します。
     *
     * @tags Projects
     * @name ProjectsList
     * @summary プロジェクト一覧取得
     * @request GET:/api/projects
     */
    projectsList: (params: RequestParams = {}) =>
      this.request<ProjectsListData, any>({
        path: `/api/projects`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * @description 新しいプロジェクトを作成します。
     *
     * @tags Projects
     * @name ProjectsCreate
     * @summary プロジェクト作成
     * @request POST:/api/projects
     */
    projectsCreate: (data: ProjectsCreatePayload, params: RequestParams = {}) =>
      this.request<ProjectsCreateData, Error400Response | Error500Response>({
        path: `/api/projects`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description 指定されたプロジェクトのプロトタイプルーム（VERSIONとINSTANCE）を作成します。
     *
     * @tags Projects
     * @name ProjectsVersionsCreate
     * @summary プロトタイプルーム作成
     * @request POST:/api/projects/{projectId}/versions
     */
    projectsVersionsCreate: (
      projectId: string,
      data: ProjectsVersionsCreatePayload,
      params: RequestParams = {}
    ) =>
      this.request<
        ProjectsVersionsCreateData,
        Error400Response | Error404Response | Error500Response
      >({
        path: `/api/projects/${projectId}/versions`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description 指定されたプロジェクトのプロトタイプルーム（VERSIONとINSTANCE）を削除します。
     *
     * @tags Projects
     * @name ProjectsVersionsDelete
     * @summary プロトタイプルーム削除
     * @request DELETE:/api/projects/{projectId}/versions/{prototypeId}
     */
    projectsVersionsDelete: (
      projectId: string,
      prototypeId: string,
      params: RequestParams = {}
    ) =>
      this.request<
        ProjectsVersionsDeleteData,
        Error404Response | Error500Response
      >({
        path: `/api/projects/${projectId}/versions/${prototypeId}`,
        method: 'DELETE',
        format: 'json',
        ...params,
      }),

    /**
     * @description 指定されたIDのプロジェクトの詳細情報と、そのプロジェクトに属するプロトタイプの一覧を取得します。
     *
     * @tags Projects
     * @name ProjectsDetail
     * @summary 特定のプロジェクトの詳細とプロトタイプ一覧取得
     * @request GET:/api/projects/{projectId}
     */
    projectsDetail: (projectId: string, params: RequestParams = {}) =>
      this.request<ProjectsDetailData, Error404Response>({
        path: `/api/projects/${projectId}`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * @description 指定されたIDのプロジェクトを削除します。
     *
     * @tags Projects
     * @name ProjectsDelete
     * @summary プロジェクト削除
     * @request DELETE:/api/projects/{projectId}
     */
    projectsDelete: (projectId: string, params: RequestParams = {}) =>
      this.request<ProjectsDeleteData, Error404Response>({
        path: `/api/projects/${projectId}`,
        method: 'DELETE',
        format: 'json',
        ...params,
      }),

    /**
     * @description 指定されたプロジェクトにアクセス可能なユーザーを取得します。
     *
     * @tags Projects
     * @name ProjectsAccessUsersList
     * @summary プロジェクトへのアクセス権を取得
     * @request GET:/api/projects/{projectId}/access-users
     */
    projectsAccessUsersList: (projectId: string, params: RequestParams = {}) =>
      this.request<ProjectsAccessUsersListData, any>({
        path: `/api/projects/${projectId}/access-users`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * @description 指定されたプロジェクトにユーザーを招待します。Adminロール（またはMANAGE権限）を持つユーザーのみが利用できます。
     *
     * @tags Projects
     * @name ProjectsInviteCreate
     * @summary ユーザーにプロジェクトへのアクセス権を付与
     * @request POST:/api/projects/{projectId}/invite
     */
    projectsInviteCreate: (
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
      }),

    /**
     * @description 指定されたプロジェクトからユーザーのアクセス権を削除します。Adminロール（またはMANAGE権限）を持つユーザーのみが利用できます。
     *
     * @tags Projects
     * @name ProjectsInviteDelete
     * @summary ユーザーのアクセス権を削除
     * @request DELETE:/api/projects/{projectId}/invite/{guestId}
     */
    projectsInviteDelete: (
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
      }),

    /**
     * @description 指定されたプロジェクトを複製します。書き込みまたはAdmin権限が必要です。
     *
     * @tags Projects
     * @name ProjectsDuplicateCreate
     * @summary プロジェクトの複製
     * @request POST:/api/projects/{projectId}/duplicate
     */
    projectsDuplicateCreate: (projectId: string, params: RequestParams = {}) =>
      this.request<
        ProjectsDuplicateCreateData,
        Error404Response | Error500Response
      >({
        path: `/api/projects/${projectId}/duplicate`,
        method: 'POST',
        format: 'json',
        ...params,
      }),

    /**
     * @description プロジェクトのメンバーとそのロールを取得します。
     *
     * @tags Projects
     * @name ProjectsMembersList
     * @summary プロジェクトのメンバー一覧取得
     * @request GET:/api/projects/{projectId}/members
     */
    projectsMembersList: (projectId: string, params: RequestParams = {}) =>
      this.request<ProjectsMembersListData, any>({
        path: `/api/projects/${projectId}/members`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * @description プロジェクトのユーザーロール一覧を取得します。
     *
     * @tags Projects
     * @name ProjectsRolesList
     * @summary プロジェクトのロール一覧取得
     * @request GET:/api/projects/{projectId}/roles
     */
    projectsRolesList: (projectId: string, params: RequestParams = {}) =>
      this.request<ProjectsRolesListData, any>({
        path: `/api/projects/${projectId}/roles`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * @description ユーザーにプロジェクトのロールを割り当てます。
     *
     * @tags Projects
     * @name ProjectsRolesCreate
     * @summary プロジェクトにロールを追加
     * @request POST:/api/projects/{projectId}/roles
     */
    projectsRolesCreate: (
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
      }),

    /**
     * @description ユーザーからプロジェクトのロールを削除します。
     *
     * @tags Projects
     * @name ProjectsRolesDelete
     * @summary プロジェクトからロールを削除
     * @request DELETE:/api/projects/{projectId}/roles/{userId}
     */
    projectsRolesDelete: (
      projectId: string,
      userId: string,
      params: RequestParams = {}
    ) =>
      this.request<ProjectsRolesDeleteData, void>({
        path: `/api/projects/${projectId}/roles/${userId}`,
        method: 'DELETE',
        ...params,
      }),

    /**
     * @description ユーザーのプロジェクトロールを変更します。
     *
     * @tags Projects
     * @name ProjectsRolesUpdate
     * @summary プロジェクトのロールを更新
     * @request PUT:/api/projects/{projectId}/roles/{userId}
     */
    projectsRolesUpdate: (
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
      }),

    /**
     * @description S3に画像をアップロードし、画像のメタデータを保存します。
     *
     * @tags Images
     * @name ImagesCreate
     * @summary 画像アップロード
     * @request POST:/api/images
     */
    imagesCreate: (data: ImagesCreatePayload, params: RequestParams = {}) =>
      this.request<
        ImagesCreateData,
        Error400Response | Error401Response | Error500Response
      >({
        path: `/api/images`,
        method: 'POST',
        body: data,
        type: ContentType.FormData,
        format: 'json',
        ...params,
      }),

    /**
     * @description S3から指定された画像を取得し、画像データを直接返します。
     *
     * @tags Images
     * @name ImagesDetail
     * @summary 画像取得
     * @request GET:/api/images/{imageId}
     */
    imagesDetail: (imageId: string, params: RequestParams = {}) =>
      this.request<
        ImagesDetailData,
        | Error400Response
        | Error401Response
        | Error404Response
        | Error500Response
      >({
        path: `/api/images/${imageId}`,
        method: 'GET',
        format: 'blob',
        ...params,
      }),

    /**
     * @description S3から指定された画像を削除します。
     *
     * @tags Images
     * @name ImagesDelete
     * @summary 画像削除
     * @request DELETE:/api/images/{imageId}
     */
    imagesDelete: (
      { imageId, ...query }: ImagesDeleteParams,
      params: RequestParams = {}
    ) =>
      this.request<
        ImagesDeleteData,
        | Error400Response
        | Error401Response
        | Error404Response
        | Error500Response
      >({
        path: `/api/images/${imageId}`,
        method: 'DELETE',
        query: query,
        ...params,
      }),

    /**
     * @description Stripeで利用可能な寄付金額と対応するPrice IDを取得します。
     *
     * @tags Donations
     * @name DonationsOptionsList
     * @summary 寄付オプション一覧の取得
     * @request GET:/api/donations/options
     */
    donationsOptionsList: (params: RequestParams = {}) =>
      this.request<DonationsOptionsListData, Error500Response>({
        path: `/api/donations/options`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * @description 選択された寄付金額でStripe Checkoutセッションを作成します。
     *
     * @tags Donations
     * @name DonationsCheckoutSessionCreate
     * @summary 寄付用Stripe Checkoutセッションの作成
     * @request POST:/api/donations/checkout-session
     */
    donationsCheckoutSessionCreate: (
      data: DonationsCheckoutSessionCreatePayload,
      params: RequestParams = {}
    ) =>
      this.request<
        DonationsCheckoutSessionCreateData,
        Error400Response | Error500Response
      >({
        path: `/api/donations/checkout-session`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),
  };
  auth = {
    /**
     * @description Googleアカウントを使用してログインします。
     *
     * @tags Auth
     * @name GoogleList
     * @summary Googleログイン
     * @request GET:/auth/google
     */
    googleList: (params: RequestParams = {}) =>
      this.request<any, void>({
        path: `/auth/google`,
        method: 'GET',
        ...params,
      }),

    /**
     * @description GoogleログインのコールバックURL。
     *
     * @tags Auth
     * @name GoogleCallbackList
     * @summary Googleログインコールバック
     * @request GET:/auth/google/callback
     */
    googleCallbackList: (params: RequestParams = {}) =>
      this.request<any, void>({
        path: `/auth/google/callback`,
        method: 'GET',
        ...params,
      }),

    /**
     * @description 現在のセッションを終了し、ユーザーをログアウトします。
     *
     * @tags Auth
     * @name LogoutCreate
     * @summary ログアウト
     * @request POST:/auth/logout
     */
    logoutCreate: (params: RequestParams = {}) =>
      this.request<LogoutCreateData, Error500Response>({
        path: `/auth/logout`,
        method: 'POST',
        format: 'json',
        ...params,
      }),

    /**
     * @description 現在ログインしているユーザーの情報を取得します。
     *
     * @tags Auth
     * @name UserList
     * @summary ユーザー情報取得
     * @request GET:/auth/user
     */
    userList: (params: RequestParams = {}) =>
      this.request<UserListData, any>({
        path: `/auth/user`,
        method: 'GET',
        format: 'json',
        ...params,
      }),
  };
}
