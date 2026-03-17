import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginRequest, RegisterRequest, LoginResponse, RegisterResponse } from '../types/auth.types';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  /**
   * Đăng nhập
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', data);
      
      if (response.data.success && response.data.data?.token) {
        // Lưu token vào AsyncStorage
        await AsyncStorage.setItem('authToken', response.data.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error('Không thể kết nối đến server');
    }
  },

  /**
   * Đăng ký
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await api.post<RegisterResponse>('/auth/register', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error('Không thể kết nối đến server');
    }
  },

  /**
   * Đăng xuất
   */
  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  },

  /**
   * Lấy thông tin user hiện tại
   */
  async getMe() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Kiểm tra đã đăng nhập chưa
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  },

  /**
   * Lấy token
   */
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }
};
