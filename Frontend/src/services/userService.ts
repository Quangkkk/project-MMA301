import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.209:5000/api';

export const userService = {
  // Kiểm tra trạng thái follow
  async checkFollowStatus(userId: number, targetUserId: number, token: string): Promise<boolean> {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}/following/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data.isFollowing;
    } catch (error: any) {
      console.error('Error checking follow status:', error);
      return false;
    }
  },

  // Follow user
  async followUser(userId: number, targetUserId: number, token: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/users/${userId}/follow/${targetUserId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error: any) {
      console.error('Error following user:', error);
      throw new Error(error.response?.data?.message || 'Failed to follow user');
    }
  },

  // Unfollow user
  async unfollowUser(userId: number, targetUserId: number, token: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/users/${userId}/follow/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      throw new Error(error.response?.data?.message || 'Failed to unfollow user');
    }
  },

  // Get active bans của user đang đăng nhập
  async getMyActiveBans(token: string): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/users/bans/my-active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting active bans:', error);
      throw new Error(error.response?.data?.message || 'Failed to get active bans');
    }
  }
};
