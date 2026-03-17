import api from '../config/api';

export const mediaService = {
  getMediaByEntity: async (entityType: string, entityId: number, token: string) => {
    try {
      const response = await api.get(`/media/entity/${entityType}/${entityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = response.data.data || response.data;
      
      // Map backend format to frontend format
      return data.map((media: any) => ({
        mediaId: media.MediaID,
        mediaUrl: media.FilePath,
      }));
    } catch (error: any) {
      console.error('Get media error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Không thể tải ảnh');
    }
  },

  deleteMedia: async (mediaId: number, token: string) => {
    try {
      const response = await api.delete(`/media/${mediaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể xóa ảnh');
    }
  },
};
