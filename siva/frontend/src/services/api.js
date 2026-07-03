import axios from 'axios';
import { setToken, logoutUser } from '../redux/authSlice.js';

let storeRef = null;
export const injectStore = (_store) => {
  storeRef = _store;
};

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

API.interceptors.request.use(
  (config) => {
    if (storeRef) {
      const token = storeRef.getState().auth.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/login' &&
      originalRequest.url !== '/auth/refresh-token'
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          'http://localhost:5000/api/auth/refresh-token',
          {},
          { withCredentials: true }
        );
        const { token } = res.data;

        if (storeRef) {
          storeRef.dispatch(setToken(token));
        }

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return API(originalRequest);
      } catch (err) {
        if (storeRef) {
          storeRef.dispatch(logoutUser());
        }
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
