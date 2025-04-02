/**
 * @page apiのリクエストとレスポンスの型定義
 */

/**
 * ユーザー情報の型
 */
export interface GetUserResponse {
  id?: string;
  username?: string;
}

/**
 * ログアウトのレスポンスの型
 */
export interface LogoutResponse {
  message: string;
}
