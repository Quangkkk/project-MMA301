import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.209:5000/api/chat';

// Lấy tất cả conversations
export const getConversations = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.get(`${API_URL}/conversations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error getting conversations:', error.response?.data || error.message);
    throw error;
  }
};

// Tạo hoặc lấy conversation với user khác
export const createOrGetConversation = async (otherUserId: number) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.post(
      `${API_URL}/conversations`,
      { otherUserId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error('Error creating conversation:', error.response?.data || error.message);
    throw error;
  }
};

// Lấy messages của conversation
export const getMessages = async (conversationId: number, limit: number = 50, offset: number = 0) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.get(`${API_URL}/conversations/${conversationId}/messages`, {
      params: { limit, offset },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error getting messages:', error.response?.data || error.message);
    throw error;
  }
};

// Gửi message
export const sendMessage = async (conversationId: number, content: string, attachmentURL?: string) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.post(
      `${API_URL}/conversations/${conversationId}/messages`,
      { content, attachmentURL },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error('Error sending message:', error.response?.data || error.message);
    throw error;
  }
};

// Đánh dấu tin nhắn đã đọc
export const markMessagesAsRead = async (conversationId: number) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    await axios.put(
      `${API_URL}/conversations/${conversationId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error: any) {
    console.error('Error marking messages as read:', error.response?.data || error.message);
    throw error;
  }
};
