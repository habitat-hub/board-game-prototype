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
    if (error.response && error.response.status === 401) {
      // 401 エラーの場合はトップページにリダイレクト
      window.location.replace('/');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;