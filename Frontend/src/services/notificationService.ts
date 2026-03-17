import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.209:5000/api/notifications';

export interface Notification {
  NotificationID: number;
  UserID: number;
  SourceID: number;
  Type: string;
  Message: string;
  IsRead: boolean;
  CreatedAt: string;
}

export const notificationService = {
  async getNotifications(limit: number = 20): Promise<Notification[]> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data.count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  async markAsRead(notificationId: number): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.put(`${API_BASE_URL}/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.put(`${API_BASE_URL}/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
};
