import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userChangePercent: number;
  totalPosts: number;
  newPostsThisMonth: number;
  totalComments: number;
  newCommentsThisMonth: number;
  pendingReports: number;
  resolvedReports: number;
  totalReportsThisMonth: number;
  totalReactions: number;
}

export interface RecentActivity {
  type: string;
  icon: string;
  text: string;
  time: string;
  color: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const adminService = {
  // Lấy thống kê dashboard
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Get dashboard stats error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể lấy thống kê dashboard',
      };
    }
  },

  // Lấy hoạt động gần đây
  getRecentActivities: async (limit: number = 10): Promise<ApiResponse<RecentActivity[]>> => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/admin/recent-activities`, {
        params: { limit },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Get recent activities error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể lấy hoạt động gần đây',
      };
    }
  },
};

export default adminService;
