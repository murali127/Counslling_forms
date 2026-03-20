import axios from 'axios';
import axiosRetry from 'axios-retry';

// Centralized Axios client that injects the auth token and uses an env-based base URL
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000, // 10 seconds timeout
});

// Configure automatic retries for idempotent requests (GET, HEAD, OPTIONS, PUT, DELETE) 
// or network errors / 5xx errors.
axiosRetry(apiClient, { 
  retries: 3, 
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED';
  }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error message for frontend consumption
    let customError = error;
    
    if (error.response) {
      // Server answered with a status outside of 2xx
      const serverMessage = error.response.data?.error || error.response.data?.message || 'Server error occurred';
      customError.message = typeof serverMessage === 'string' ? serverMessage : JSON.stringify(serverMessage);
      
      if (error.response.status === 401) {
        if (error.response.data && (
          error.response.data.error === 'Token has expired' || 
          error.response.data.error === 'Token is not valid' || 
          error.response.data.error === 'User not found'
        )) {
          localStorage.clear();
          // Optional: redirect to login here, e.g. window.location.href = '/' if not already there
          if (window.location.pathname !== '/' && window.location.pathname !== '/signup') {
            window.location.href = '/';
          }
        }
      }

      if (error.response.status === 403) {
        const policyError = String(error.response.data?.error || '').toLowerCase();
        const shouldForceLogout = (
          policyError.includes('login window') ||
          policyError.includes('login is currently closed') ||
          policyError.includes('year of study is not configured')
        );

        if (shouldForceLogout) {
          localStorage.clear();
          if (window.location.pathname !== '/' && window.location.pathname !== '/signup') {
            window.location.href = '/';
          }
        }
      }
    } else if (error.request) {
      // The request was made but no response was received (or it timed out)
      customError.message = error.code === 'ECONNABORTED' 
        ? 'Request timed out. Please try again.' 
        : 'Network error. Please check your connection.';
    } else {
      // Something happened in setting up the request
      customError.message = error.message || 'An unexpected error occurred';
    }

    return Promise.reject(customError);
  }
);

export default apiClient;
