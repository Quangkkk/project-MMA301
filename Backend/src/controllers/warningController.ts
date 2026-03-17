import { Request, Response } from 'express';
import { warningService } from '../services/warningService';

export const warningController = {
  // Tạo cảnh báo mới
  async createWarning(req: Request, res: Response) {
    try {
      const adminId = req.user?.userId;
      
      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      const { UserID, ReportID, WarningReason, ActionTaken, Severity } = req.body;
      
      if (!UserID || !WarningReason || !ActionTaken || !Severity) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }
      
      const warning = await warningService.createWarning(adminId, {
        UserID,
        ReportID,
        WarningReason,
        ActionTaken,
        Severity
      });
      
      return res.status(201).json({
        success: true,
        message: 'Warning created successfully',
        data: warning
      });
    } catch (error: any) {
      console.error('Error in createWarning:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create warning'
      });
    }
  },

  // Lấy cảnh báo của user
  async getUserWarnings(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      const warnings = await warningService.getUserWarnings(userId);
      
      return res.status(200).json({
        success: true,
        data: warnings
      });
    } catch (error: any) {
      console.error('Error in getUserWarnings:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get warnings'
      });
    }
  },

  // Lấy tất cả cảnh báo (admin)
  async getAllWarnings(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
      
      const result = await warningService.getAllWarnings(page, pageSize, isActive);
      
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
      console.error('Error in getAllWarnings:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get warnings'
      });
    }
  },

  // Vô hiệu hóa cảnh báo
  async deactivateWarning(req: Request, res: Response) {
    try {
      const warningId = parseInt(req.params.warningId);
      
      if (!warningId) {
        return res.status(400).json({
          success: false,
          message: 'Warning ID is required'
        });
      }
      
      await warningService.deactivateWarning(warningId);
      
      return res.status(200).json({
        success: true,
        message: 'Warning deactivated successfully'
      });
    } catch (error: any) {
      console.error('Error in deactivateWarning:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to deactivate warning'
      });
    }
  }
};
