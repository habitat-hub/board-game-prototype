import { AxiosInstance } from 'axios';
import Router from 'next/router';

export const setupResponseInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        Router.push('/about');
      }
      if (error.response?.status === 403) {
        Router.push('/prototypes');
      }
      return Promise.reject(error);
    }
  );
};
