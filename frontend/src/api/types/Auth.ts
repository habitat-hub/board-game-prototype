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
  Error500Response,
  LogoutCreateData,
  UserListData,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Auth<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Googleアカウントを使用してログインします。
   *
   * @tags Auth
   * @name GoogleList
   * @summary Googleログイン
   * @request GET:/auth/google
   */
  googleList = (params: RequestParams = {}) =>
    this.request<any, void>({
      path: `/auth/google`,
      method: "GET",
      ...params,
    });
  /**
   * @description GoogleログインのコールバックURL。
   *
   * @tags Auth
   * @name GoogleCallbackList
   * @summary Googleログインコールバック
   * @request GET:/auth/google/callback
   */
  googleCallbackList = (params: RequestParams = {}) =>
    this.request<any, void>({
      path: `/auth/google/callback`,
      method: "GET",
      ...params,
    });
  /**
   * @description 現在のセッションを終了し、ユーザーをログアウトします。
   *
   * @tags Auth
   * @name LogoutCreate
   * @summary ログアウト
   * @request POST:/auth/logout
   */
  logoutCreate = (params: RequestParams = {}) =>
    this.request<LogoutCreateData, Error500Response>({
      path: `/auth/logout`,
      method: "POST",
      format: "json",
      ...params,
    });
  /**
   * @description 現在ログインしているユーザーの情報を取得します。
   *
   * @tags Auth
   * @name UserList
   * @summary ユーザー情報取得
   * @request GET:/auth/user
   */
  userList = (params: RequestParams = {}) =>
    this.request<UserListData, any>({
      path: `/auth/user`,
      method: "GET",
      format: "json",
      ...params,
    });
}
