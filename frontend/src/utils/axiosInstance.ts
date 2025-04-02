import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true, // 認証情報を含める
});

// レスポンスインターセプターを設定
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 権限エラーの場合
    if (error.response && error.response.status === 401) {
      // トップページにリダイレクト
      window.location.replace('/');
    }
    // 403 エラーの場合
    if (error.response && error.response.status === 403) {
      // プロトタイプ一覧ページにリダイレクト
      window.location.replace('/prototypes');
    }
    // その他のエラーの場合
    return Promise.reject(error);
  }
);

export default axiosInstance;
