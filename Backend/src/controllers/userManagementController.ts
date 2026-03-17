import { Request, Response } from 'express';
import { userManagementService, UserFilters } from '../services/userManagementService';

export const userManagementController = {
  // Lấy danh sách users
  async getAllUsers(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;

      const filters: UserFilters = {};
      if (req.query.search) filters.search = req.query.search as string;
      if (req.query.role) filters.role = req.query.role as string;
      if (req.query.status !== undefined) filters.status = parseInt(req.query.status as string);

      const { users, total } = await userManagementService.getAllUsers(page, pageSize, filters);

      return res.status(200).json({
        success: true,
        data: users,
        pagination: {
          page,
          pageSize,
          totalItems: total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error: any) {
      console.error('Error in getAllUsers:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get users'
      });
    }
  },

  // Ban user
  async banUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      await userManagementService.banUser(userId);

      return res.status(200).json({
        success: true,
        message: 'User banned successfully'
      });
    } catch (error: any) {
      console.error('Error in banUser:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to ban user'
      });
    }
  },

  // Unban user
  async unbanUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      await userManagementService.unbanUser(userId);

      return res.status(200).json({
        success: true,
        message: 'User unbanned successfully'
      });
    } catch (error: any) {
      console.error('Error in unbanUser:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to unban user'
      });
    }
  },

  // Delete user
  async deleteUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      await userManagementService.deleteUser(userId);

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      console.error('Error in deleteUser:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete user'
      });
    }
  },

  // Get user stats
  async getUserStats(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const stats = await userManagementService.getUserStats(userId);

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error in getUserStats:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user stats'
      });
    }
  }
};
