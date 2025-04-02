/**
 * @page apiのリクエストとレスポンスの型定義
 */

import { Prototype, PrototypeVersion, User } from '../models';

/**
 * プロトタイプ一覧取得のレスポンスの型
 */
export type GetPrototypesResponse = Prototype[];

/**
 * プロトタイプ取得のレスポンスの型
 */
export type GetPrototypeResponse = Prototype;

/**
 * プロトタイプバージョン一覧取得のレスポンスの型
 */
export interface GetPrototypeVersionsResponse {
  prototype: Prototype;
  versions: PrototypeVersion[];
}

/**
 * グループが同一のプロトタイプ一覧取得のレスポンスの型
 */
export type GetPrototypeGroupsResponse = {
  prototype: Prototype;
  versions: PrototypeVersion[];
}[];

/**
 * グループにアクセス可能なユーザー一覧取得のレスポンスの型
 */
export type GetAccessibleUsersResponse = User[];
