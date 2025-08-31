import axios from 'axios';

import { setupInterceptors } from './interceptors';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export const getApiUrl = (path = '') => `${apiUrl}${path}`;

const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

setupInterceptors(axiosInstance);

export default axiosInstance;
