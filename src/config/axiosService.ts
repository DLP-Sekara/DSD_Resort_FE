import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { getLocalStoragedata, setLocalStorageData } from '../helpers/StorageHelper';
import type { APIResponse } from '../types/onBoarding.interfaces';

const baseURL = import.meta.env.VITE_API_URL;

// Create base config
const defaultConfig: AxiosRequestConfig = {
  baseURL,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
  },
  withCredentials: true,
};

// Separate instances
const axiosInstance: AxiosInstance = axios.create({
  ...defaultConfig,
  headers: { ...defaultConfig.headers, 'Content-Type': 'application/json' },
});

const axiosInstanceForm: AxiosInstance = axios.create({
  ...defaultConfig,
  headers: { ...defaultConfig.headers, 'Content-Type': 'multipart/form-data' },
});

// Token injection
const injectToken = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = getLocalStoragedata('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response: any) => {
      return response.data;
    },
    (error) => {
      const apiResponse = error.response?.data;
      const status = error.response?.status || 500;

      // Authentication Errors (Expired token / Invalid access)
      if (status === 401 || status === 403) {
        handleAuthError();
      }

      // Server-side Errors
      else if (status >= 500) {
        handleServerError(apiResponse, error);
      }

      return Promise.reject(
        apiResponse || {
          success: false,
          statusCode: status,
          message: 'Network Error or Server Unreachable',
          data: null,
        },
      );
    },
  );
};

const handleAuthError = () => {
  setLocalStorageData('userData', null);
  setLocalStorageData('token', null);
  window.location.replace('/login');
};

const handleServerError = (apiResponse: APIResponse, error: any) => {
  console.error('CRITICAL_SERVER_ERROR:', apiResponse?.message || error.message);
  window.location.replace(`/server-error?from=${window.location.pathname}`);
};

injectToken(axiosInstance);
injectToken(axiosInstanceForm);

export { axiosInstance, axiosInstanceForm };
