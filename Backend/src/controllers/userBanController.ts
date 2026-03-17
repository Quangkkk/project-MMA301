import { Request, Response } from 'express';
import { userBanService } from '../services/userBanService';

export const userBanController = {
  // Tạo lệnh cấm mới
  async createBan(req: Request, res: Response) {
    try {
      const adminId = req.user?.userId;
      
      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      const { UserID, WarningID, BanReason, BanType, DurationHours } = req.body;
      
      if (!UserID || !BanReason || !BanType) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }
      
      const ban = await userBanService.createBan(adminId, {
        UserID,
        WarningID,
        BanReason,
        BanType,
        DurationHours
      });
      
      return res.status(201).json({
        success: true,
        message: 'Ban created successfully',
        data: ban
      });
    } catch (error: any) {
      console.error('Error in createBan:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create ban'
      });
    }
  },

  // Kiểm tra quyền của user
  async checkUserBans(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      const banStatus = await userBanService.checkUserBans(userId);
      
      return res.status(200).json({
        success: true,
        data: banStatus
      });
    } catch (error: any) {
      console.error('Error in checkUserBans:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to check user bans'
      });
    }
  },

  // Thu hồi lệnh cấm
  async revokeBan(req: Request, res: Response) {
    try {
      const banId = parseInt(req.params.banId);
      const adminId = req.user?.userId;
      
      if (!banId) {
        return res.status(400).json({
          success: false,
          message: 'Ban ID is required'
        });
      }
      
      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      await userBanService.revokeBan(banId, adminId);
      
      return res.status(200).json({
        success: true,
        message: 'Ban revoked successfully'
      });
    } catch (error: any) {
      console.error('Error in revokeBan:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to revoke ban'
      });
    }
  },

  // Lấy tất cả bans (admin)
  async getAllBans(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
      
      const result = await userBanService.getAllBans(page, pageSize, isActive);
      
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page,
          pageSize,
          totalItems: result.totalItems,
          totalPages: result.totalPages
        }
      });
    } catch (error: any) {
      console.error('Error in getAllBans:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get bans'
      });
    }
  },

  // Lấy bans của một user
  async getUserBans(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      const bans = await userBanService.getUserBans(userId);
      
      return res.status(200).json({
        success: true,
        data: bans
      });
    } catch (error: any) {
      console.error('Error in getUserBans:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user bans'
      });
    }
  },

  // Lấy active bans của user đang đăng nhập (cho modal thông báo)
  async getMyActiveBans(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      const banStatus = await userBanService.checkUserBans(userId);
      
      // Chỉ trả về bans đang active
      const activeBans = banStatus.bans.map(ban => ({
        BanID: ban.BanID,
        BanType: ban.BanType,
        BanReason: ban.BanReason,
        StartDate: ban.StartDate,
        EndDate: ban.EndDate,
        AdminName: ban.AdminName || 'Admin'
      }));
      
      return res.status(200).json({
        success: true,
        data: {
          canPost: banStatus.canPost,
          canComment: banStatus.canComment,
          canReport: banStatus.canReport,
          isFullyBanned: banStatus.isFullyBanned,
          activeBans
        }
      });
    } catch (error: any) {
      console.error('Error in getMyActiveBans:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get active bans'
      });
    }
  },

  // Cập nhật ban
  async updateBan(req: Request, res: Response) {
    try {
      const banId = parseInt(req.params.banId);
      const adminId = req.user?.userId;
      const { durationHours, banType } = req.body;
      
      if (!banId) {
        return res.status(400).json({
          success: false,
          message: 'Ban ID is required'
        });
      }
      
      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (!durationHours || !banType) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: durationHours and banType'
        });
      }

      if (!['POST', 'COMMENT', 'REPORT', 'FULL'].includes(banType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ban type'
        });
      }
      
      await userBanService.updateBan(banId, { durationHours, banType });
      
      return res.status(200).json({
        success: true,
        message: 'Ban updated successfully'
      });
    } catch (error: any) {
      console.error('Error in updateBan:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update ban'
      });
    }
  }
};
