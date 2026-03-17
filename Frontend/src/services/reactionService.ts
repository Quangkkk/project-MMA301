import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export interface ReactionSummary {
  targetId: number;
  targetType: string;
  reactions: {
    type: string;
    count: number;
  }[];
  userReaction?: string;
}

export interface ReactionUser {
  reactionId: number;
  reactionType: string;
  createdAt: string;
  userId: number;
  username: string;
  fullName: string;
  avatarURL: string | null;
}

class ReactionService {
  // Thêm/cập nhật reaction
  async addReaction(
    targetId: number,
    targetType: 'Post' | 'Comment',
    reactionType: string,
    token: string
  ): Promise<any> {
    const response = await axios.post(
      `${API_BASE_URL}/reactions`,
      {
        targetId,
        targetType,
        reactionType
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  }

  // Xóa reaction
  async removeReaction(
    targetId: number,
    targetType: 'Post' | 'Comment',
    token: string
  ): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/reactions/${targetType}/${targetId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }

  // Lấy tổng hợp reactions
  async getReactionSummary(
    targetId: number,
    targetType: 'Post' | 'Comment',
    token?: string
  ): Promise<ReactionSummary> {
    const response = await axios.get(
      `${API_BASE_URL}/reactions/${targetType}/${targetId}/summary`,
      token ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      } : undefined
    );
    return response.data.data;
  }

  // Lấy danh sách users đã react
  async getReactionUsers(
    targetId: number,
    targetType: 'Post' | 'Comment',
    reactionType?: string,
    limit: number = 50
  ): Promise<ReactionUser[]> {
    const params: any = { limit };
    if (reactionType) {
      params.reactionType = reactionType;
    }

    const response = await axios.get(
      `${API_BASE_URL}/reactions/${targetType}/${targetId}/users`,
      { params }
    );
    return response.data.data;
  }
}

export default new ReactionService();
