import { AxiosInstance } from 'axios';

export const setupResponseInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        window.location.replace('/');
      }
      if (error.response?.status === 403) {
        window.location.replace('/prototypes');
      }
      return Promise.reject(error);
    }
  );
};
