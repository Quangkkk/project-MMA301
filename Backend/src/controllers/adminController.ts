import { Request, Response } from 'express';
import { adminService } from '../services/adminService';

export const adminController = {
  // Lấy thống kê dashboard
  async getDashboardStats(_req: Request, res: Response) {
    try {
      const stats = await adminService.getDashboardStats();
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error in getDashboardStats:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get dashboard stats'
      });
    }
  },

  // Lấy hoạt động gần đây
  async getRecentActivities(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await adminService.getRecentActivities(limit);
      
      return res.status(200).json({
        success: true,
        data: activities
      });
    } catch (error: any) {
      console.error('Error in getRecentActivities:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get recent activities'
      });
    }
  },
};
