import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.209:5000/api';
const COMMENT_API = `${API_URL}/comments`;

export interface Comment {
  commentId: number;
  postId: number;
  userId: number;
  parentCommentId?: number;
  username: string;
  fullName: string;
  avatarURL: string | null;
  content: string;
  createdAt: string;
  reactions: number;
  userReaction?: string;
  authorId?: number;
  isEdited?: boolean;
}

class CommentService {
  // Lấy comments của post
  async getCommentsByPost(
    postId: number,
    token?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<Comment[]> {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${COMMENT_API}/post/${postId}`, {
        params: { page, limit },
        headers
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  // Thêm comment
  async addComment(
    postId: number,
    content: string,
    token: string,
    parentCommentId?: number
  ): Promise<Comment> {
    try {
      const response = await axios.post(
        `${COMMENT_API}/post/${postId}`,
        { content, parentCommentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error: any) {
      // Throw error với message rõ ràng từ backend
      const errorMessage = error.response?.data?.message || error.message || 'Không thể thêm bình luận';
      const newError: any = new Error(errorMessage);
      newError.status = error.response?.status;
      newError.response = error.response;
      throw newError;
    }
  }

  // Xóa comment
  async deleteComment(commentId: number, token: string): Promise<void> {
    try {
      await axios.delete(`${COMMENT_API}/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // Cập nhật comment
  async updateComment(
    commentId: number,
    content: string,
    token: string
  ): Promise<Comment> {
    try {
      const response = await axios.put(
        `${COMMENT_API}/${commentId}`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Không thể cập nhật bình luận';
      const newError: any = new Error(errorMessage);
      newError.status = error.response?.status;
      newError.response = error.response;
      throw newError;
    }
  }

  // Lấy lịch sử chỉnh sửa comment
  async getCommentEditHistory(commentId: number): Promise<any[]> {
    try {
      const response = await axios.get(`${COMMENT_API}/${commentId}/history`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting comment edit history:', error);
      throw error;
    }
  }
}

export default new CommentService();
