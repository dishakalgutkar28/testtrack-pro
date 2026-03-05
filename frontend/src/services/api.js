import axios from "axios";
import config from "../config";

const api = axios.create({
  baseURL: config.API_URL,
});

// Toast notification handler (will be set by App.js)
let toastHandler = null;

export const setToastHandler = (handler) => {
  toastHandler = handler;
};

// Request interceptor to add auth token
api.interceptors.request.use(apiConfig => {
  const token = localStorage.getItem("token");
  if (token) {
    apiConfig.headers.Authorization = `Bearer ${token}`;
  }
  return apiConfig;
});

// Response interceptor to handle token expiration and auth errors
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Show error toast if handler is available
    if (toastHandler && error.response) {
      const message = error.response.data?.error?.message || 
                     error.response.data?.message || 
                     'An error occurred';
      
      // Don't show toast for 401 errors (will redirect to login)
      if (error.response.status !== 401) {
        toastHandler.error(message);
      }
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          console.warn("No refresh token available, redirecting to login");
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("role");
          
          if (toastHandler) {
            toastHandler.warning('Session expired. Please login again.');
          }
          
          window.location.href = "/login";
          return Promise.reject(error);
        }

        console.log("Attempting to refresh token...");
        
        // Try to refresh the token
        const response = await axios.post(`${config.API_URL.replace('/api', '')}/api/refresh-token`, {
          refreshToken
        });

        const newData = response.data;
        
        if (newData.token && newData.refreshToken) {
          // Save new tokens
          localStorage.setItem("token", newData.token);
          localStorage.setItem("refreshToken", newData.refreshToken);
          console.log("Token refreshed successfully");

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newData.token}`;
          return api(originalRequest);
        } else {
          throw new Error("Refresh response missing token data");
        }

      } catch (refreshError) {
        // Refresh failed, logout user
        console.error("Token refresh failed:", refreshError.message);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("role");
        
        if (toastHandler) {
          toastHandler.error('Session expired. Please login again.');
        }
        
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
