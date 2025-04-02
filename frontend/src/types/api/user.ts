/**
 * @page apiのリクエストとレスポンスの型定義
 */

import { User } from '../models';

/**
 * ユーザー検索のレスポンスの型
 */
export type GetSearchUsersResponse = User[];
