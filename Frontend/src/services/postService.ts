import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.209:5000/api';

export interface Post {
  postId: number;
  title: string;
  content: string;
  userId: number;
  username: string;
  fullName: string;
  avatarURL: string | null;
  createdAt: string;
  tags: string[];
  reactions: number;
  comments: number;
  views: number;
  images?: string[];
}

export interface UserStats {
  totalPosts: number;
  totalComments: number;
  totalReactions: number;
  ranking: number;
  rankPercentage: number;
}

export interface Tag {
  tagId: number;
  tagName: string;
  postCount: number;
}

export const postService = {
  // Lấy danh sách posts
  async getPosts(page: number = 1, limit: number = 20, tagId?: number): Promise<{ posts: Post[]; hasMore: boolean }> {
    try {
      const params: any = { page, limit };
      if (tagId) params.tagId = tagId;

      const response = await axios.get(`${API_URL}/posts`, { params });
      
      return {
        posts: response.data.data,
        hasMore: response.data.pagination.hasMore
      };
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch posts');
    }
  },

  // Lấy posts thịnh hành
  async getTrendingPosts(limit: number = 20): Promise<Post[]> {
    try {
      const response = await axios.get(`${API_URL}/posts/trending`, {
        params: { limit }
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching trending posts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch trending posts');
    }
  },

  // Lấy posts từ người đang follow
  async getFollowingPosts(userId: number, token: string, page: number = 1, limit: number = 20): Promise<{ posts: Post[]; hasMore: boolean }> {
    try {
      const response = await axios.get(`${API_URL}/posts/following/${userId}`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return {
        posts: response.data.data,
        hasMore: response.data.pagination.hasMore
      };
    } catch (error: any) {
      console.error('Error fetching following posts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch following posts');
    }
  },

  // Lấy posts đã lưu
  async getSavedPosts(userId: number, token: string, page: number = 1, limit: number = 20): Promise<{ posts: Post[]; hasMore: boolean }> {
    try {
      const response = await axios.get(`${API_URL}/posts/saved/${userId}`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return {
        posts: response.data.data,
        hasMore: response.data.pagination.hasMore
      };
    } catch (error: any) {
      console.error('Error fetching saved posts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch saved posts');
    }
  },

  // Lấy thống kê user
  async getUserStats(userId: number, token: string): Promise<UserStats> {
    try {
      const response = await axios.get(`${API_URL}/posts/users/${userId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user stats');
    }
  },

  // Lấy tags phổ biến
  async getPopularTags(limit: number = 10): Promise<Tag[]> {
    try {
      const response = await axios.get(`${API_URL}/posts/tags/popular`, {
        params: { limit }
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching popular tags:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch popular tags');
    }
  },

  // Lấy tất cả bài viết của một user
  async getUserPosts(userId: number, page: number = 1, limit: number = 20): Promise<Post[]> {
    try {
      const response = await axios.get(`${API_URL}/posts/user/${userId}`, {
        params: { page, limit }
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching user posts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user posts');
    }
  },

  // Tạo bài viết mới
  async createPost(postData: { title: string; content: string; tags: string[]; mediaIds?: number[] }, token: string): Promise<Post> {
    try {
      const response = await axios.post(`${API_URL}/posts`, postData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create post');
    }
  },

  // Upload images
  async uploadImages(images: FormData, token: string): Promise<{ mediaId: number; url: string; fileName: string }[]> {
    try {
      const response = await axios.post(`${API_URL}/media/upload`, images, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error uploading images:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload images');
    }
  },

  // Xóa bài viết
  async deletePost(postId: number, token: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error: any) {
      console.error('Error deleting post:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete post');
    }
  },

  // Cập nhật bài viết
  async updatePost(postId: number, postData: { title: string; content: string; tags: string[] }, token: string): Promise<Post> {
    try {
      const response = await axios.put(`${API_URL}/posts/${postId}`, postData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating post:', error);
      throw new Error(error.response?.data?.message || 'Failed to update post');
    }
  }
};
