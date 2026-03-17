import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export interface CreateReportDTO {
  targetID: number;
  targetType: 'Post' | 'Comment' | 'User';
  reason: string;
}

export interface Report {
  ReportID: number;
  ReporterID: number;
  TargetID: number;
  TargetType: 'Post' | 'Comment' | 'User';
  Reason: string;
  Status: 0 | 1;
  CreatedAt: string;
  TargetTitle?: string;
  TargetContent?: string;
  TargetDeleted?: boolean;
}

const reportService = {
  // Tạo report mới
  async createReport(data: CreateReportDTO): Promise<{ success: boolean; message: string; data?: Report }> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/reports`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Không thể gửi báo cáo';
      const newError: any = new Error(errorMessage);
      newError.status = error.response?.status;
      newError.response = error.response;
      throw newError;
    }
  },

  // Lấy tất cả reports (admin)
  async getAllReports(status?: 0 | 1): Promise<{ success: boolean; data: Report[] }> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const url = status !== undefined ? `${API_URL}/reports?status=${status}` : `${API_URL}/reports`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Failed to get reports' };
    }
  },

  // Cập nhật status report (admin)
  async updateReportStatus(reportID: number, status: 0 | 1): Promise<{ success: boolean; message: string }> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/reports/${reportID}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Failed to update report status' };
    }
  },

  // Lấy reports của user hiện tại
  async getMyReports(): Promise<{ success: boolean; data: Report[] }> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/reports/my-reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Failed to get my reports' };
    }
  }
};

export default reportService;
