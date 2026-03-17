import { Request, Response } from 'express';
import { reportManagementService } from '../services/reportManagementService';

export const reportManagementController = {
  // Lấy tất cả reports (admin)
  async getAllReports(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;
      const status = req.query.status !== undefined ? parseInt(req.query.status as string) as (0 | 1) : undefined;
      const targetType = req.query.targetType as ('Post' | 'Comment' | 'User') | undefined;
      
      const result = await reportManagementService.getAllReports(page, pageSize, status, targetType);
      
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
      console.error('Error in getAllReports:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get reports'
      });
    }
  },

  // Lấy chi tiết một report
  async getReportById(req: Request, res: Response) {
    try {
      const reportId = parseInt(req.params.reportId);
      
      if (!reportId) {
        return res.status(400).json({
          success: false,
          message: 'Report ID is required'
        });
      }
      
      const report = await reportManagementService.getReportById(reportId);
      
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: report
      });
    } catch (error: any) {
      console.error('Error in getReportById:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get report'
      });
    }
  },

  // Xử lý report
  async resolveReport(req: Request, res: Response) {
    try {
      const reportId = parseInt(req.params.reportId);
      const adminId = req.user?.userId;
      
      if (!reportId) {
        return res.status(400).json({
          success: false,
          message: 'Report ID is required'
        });
      }
      
      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      const { AdminResponse, CreateWarning, CreateBan, WarningDetails } = req.body;
      
      if (!AdminResponse) {
        return res.status(400).json({
          success: false,
          message: 'Admin response is required'
        });
      }
      
      await reportManagementService.resolveReport(reportId, adminId, {
        AdminResponse,
        CreateWarning,
        CreateBan,
        WarningDetails
      });
      
      return res.status(200).json({
        success: true,
        message: 'Report resolved successfully'
      });
    } catch (error: any) {
      console.error('Error in resolveReport:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to resolve report'
      });
    }
  },

  // Thống kê reports
  async getReportStats(_req: Request, res: Response) {
    try {
      const stats = await reportManagementService.getReportStats();
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error in getReportStats:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get report stats'
      });
    }
  }
};
