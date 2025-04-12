import axios from 'axios';

import { setupResponseInterceptor } from './interceptors';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

setupResponseInterceptor(axiosInstance);

export default axiosInstance;
