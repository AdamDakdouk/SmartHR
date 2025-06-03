import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import {
  getAccessToken,
  getRefreshToken,
  storeTokens,
  clearTokens,
} from "@/utils/main-utils";
import { router } from "expo-router";

// Extend axios request config to include _retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface RefreshTokenResponse {
  success: boolean;
  data: {
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  message: string;
}

const api = axios.create({
  baseURL: "http://172.20.10.2:3001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config: CustomAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        console.log("Here refreshing");
        const response = await axios.post<RefreshTokenResponse>(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data.tokens;

        // Store new tokens
        await storeTokens(accessToken, newRefreshToken);

        // Update the authorization header
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        await clearTokens();
        router.replace("/screens/login");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
