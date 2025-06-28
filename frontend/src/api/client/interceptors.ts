import { AxiosInstance } from 'axios';

// リダイレクト先URL定数
const REDIRECT_URLS = {
  UNAUTHORIZED: '/', // 401: 未認証時のリダイレクト先
  FORBIDDEN: '/projects', // 403: 認可エラー時のリダイレクト先
} as const;

/**
 * 認証エラーハンドリング用のレスポンスインターセプター
 * 401: 未認証 -> / にリダイレクト
 * 403: 認可エラー -> /projects にリダイレクト
 *
 * Next.jsのrouter/navigationが使えない理由：
 * - useRouter: フックなので、React コンポーネント内でしか使えない
 * - redirect: サーバーサイドでしか動作しない
 * - インターセプター: 両方の環境で実行される可能性がある
 * そのため、window.location.hrefを使用してクライアントサイドでのみリダイレクトを実行
 */
export const setupAuthErrorInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;

      if (status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = REDIRECT_URLS.UNAUTHORIZED;
        }
      } else if (status === 403) {
        if (typeof window !== 'undefined') {
          window.location.href = REDIRECT_URLS.FORBIDDEN;
        }
      }

      return Promise.reject(error);
    }
  );
};

/**
 * 全てのインターセプターをセットアップ
 */
export const setupInterceptors = (instance: AxiosInstance) => {
  setupAuthErrorInterceptor(instance);
  // 将来的に他のインターセプターもここに追加
};
