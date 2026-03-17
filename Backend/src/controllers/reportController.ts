import { Request, Response } from 'express';
import { reportService } from '../services/reportService';
import { userBanService } from '../services/userBanService';

export const reportController = {
  // Tạo report mới
  async createReport(req: Request, res: Response) {
    try {
      const reporterID = (req as any).user?.userId;
      const { targetID, targetType, reason } = req.body;

      if (!reporterID) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Kiểm tra user có bị cấm báo cáo không
      const banStatus = await userBanService.checkUserBans(reporterID);
      if (!banStatus.canReport) {
        return res.status(403).json({
          success: false,
          message: 'Bạn đã bị cấm gửi báo cáo. Vui lòng kiểm tra thông báo để biết thêm chi tiết.'
        });
      }

      if (!targetID || !targetType || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      if (!['Post', 'Comment', 'User'].includes(targetType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target type'
        });
      }

      // Kiểm tra đã report chưa
      const existingReport = await reportService.checkExistingReport(
        reporterID,
        targetID,
        targetType
      );

      if (existingReport) {
        return res.status(400).json({
          success: false,
          message: 'Bạn đã báo cáo nội dung này rồi'
        });
      }

      const report = await reportService.createReport({
        ReporterID: reporterID,
        TargetID: targetID,
        TargetType: targetType,
        Reason: reason
      });

      return res.status(201).json({
        success: true,
        message: 'Báo cáo đã được gửi thành công',
        data: report
      });
    } catch (error: any) {
      console.error('Error in createReport:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create report'
      });
    }
  },

  // Lấy tất cả reports (admin only)
  async getAllReports(req: Request, res: Response) {
    try {
      const status = req.query.status ? parseInt(req.query.status as string) : undefined;

      const reports = await reportService.getAllReports(status as 0 | 1);

      return res.status(200).json({
        success: true,
        data: reports
      });
    } catch (error: any) {
      console.error('Error in getAllReports:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get reports'
      });
    }
  },

  // Cập nhật status report (admin only)
  async updateReportStatus(req: Request, res: Response) {
    try {
      const reportID = parseInt(req.params.reportID);
      const { status } = req.body;

      if (!reportID || status === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      if (![0, 1].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      await reportService.updateReportStatus(reportID, status);

      return res.status(200).json({
        success: true,
        message: 'Report status updated successfully'
      });
    } catch (error: any) {
      console.error('Error in updateReportStatus:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update report status'
      });
    }
  },

  // Lấy reports theo target
  async getReportsByTarget(req: Request, res: Response) {
    try {
      const targetID = parseInt(req.params.targetID);
      const targetType = req.params.targetType;

      if (!targetID || !targetType) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      const reports = await reportService.getReportsByTarget(targetID, targetType);

      return res.status(200).json({
        success: true,
        data: reports
      });
    } catch (error: any) {
      console.error('Error in getReportsByTarget:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get reports'
      });
    }
  },

  // Lấy reports của user hiện tại
  async getMyReports(req: Request, res: Response) {
    try {
      const reporterID = (req as any).user?.userId;

      if (!reporterID) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const reports = await reportService.getReportsByReporter(reporterID);

      return res.status(200).json({
        success: true,
        data: reports
      });
    } catch (error: any) {
      console.error('Error in getMyReports:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get reports'
      });
    }
  }
};
