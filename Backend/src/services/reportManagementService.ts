import sql from 'mssql';
import { getConnection } from '../config/database';
import { ReportWithDetails, ResolveReportRequest } from '../models/Report';

export const reportManagementService = {
  // Lấy tất cả reports (dành cho admin)
  async getAllReports(
    page: number = 1, 
    pageSize: number = 20, 
    status?: 0 | 1,
    targetType?: 'Post' | 'Comment' | 'User'
  ): Promise<{ data: ReportWithDetails[], totalItems: number, totalPages: number }> {
    try {
      const pool = await getConnection();
      const offset = (page - 1) * pageSize;
      
      let whereConditions: string[] = [];
      
      if (status !== undefined) {
        whereConditions.push(`r.Status = ${status}`);
      }
      
      if (targetType) {
        whereConditions.push(`r.TargetType = '${targetType}'`);
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // Get total count
      const countResult = await pool.request()
        .query(`SELECT COUNT(*) as total FROM Reports r ${whereClause}`);
      const totalItems = countResult.recordset[0].total;
      
      // Get paginated data với thông tin chi tiết
      const result = await pool.request()
        .query(`
          SELECT 
            r.*,
            reporter.Username as ReporterUsername,
            reporter.FullName as ReporterFullName,
            admin.Username as AdminUsername,
            admin.FullName as AdminFullName,
            CASE 
              WHEN r.TargetType = 'Post' THEN p.Title
              ELSE NULL
            END as TargetTitle,
            CASE 
              WHEN r.TargetType = 'Post' THEN p.Content
              WHEN r.TargetType = 'Comment' THEN c.Content
              WHEN r.TargetType = 'User' THEN targetUser.FullName
              ELSE NULL
            END as TargetContent,
            CASE 
              WHEN r.TargetType = 'Post' AND p.PostID IS NULL THEN 1
              WHEN r.TargetType = 'Comment' AND c.CommentID IS NULL THEN 1
              WHEN r.TargetType = 'User' AND targetUser.UserID IS NULL THEN 1
              ELSE 0
            END as TargetDeleted
          FROM Reports r
          INNER JOIN Users reporter ON r.ReporterID = reporter.UserID
          LEFT JOIN Users admin ON r.AdminID = admin.UserID
          LEFT JOIN Posts p ON r.TargetType = 'Post' AND r.TargetID = p.PostID
          LEFT JOIN Comments c ON r.TargetType = 'Comment' AND r.TargetID = c.CommentID
          LEFT JOIN Users targetUser ON r.TargetType = 'User' AND r.TargetID = targetUser.UserID
          ${whereClause}
          ORDER BY r.CreatedAt DESC
          OFFSET ${offset} ROWS
          FETCH NEXT ${pageSize} ROWS ONLY
        `);
      
      return {
        data: result.recordset,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize)
      };
    } catch (error: any) {
      console.error('Error getting all reports:', error);
      throw new Error('Failed to get reports');
    }
  },

  // Lấy chi tiết một report
  async getReportById(reportId: number): Promise<ReportWithDetails | null> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('ReportID', sql.Int, reportId)
        .query(`
          SELECT 
            r.*,
            reporter.Username as ReporterUsername,
            reporter.FullName as ReporterFullName,
            reporter.Email as ReporterEmail,
            admin.Username as AdminUsername,
            admin.FullName as AdminFullName,
            CASE 
              WHEN r.TargetType = 'Post' THEN p.Title
              ELSE NULL
            END as TargetTitle,
            CASE 
              WHEN r.TargetType = 'Post' THEN p.Content
              WHEN r.TargetType = 'Comment' THEN c.Content
              WHEN r.TargetType = 'User' THEN targetUser.FullName
              ELSE NULL
            END as TargetContent,
            CASE 
              WHEN r.TargetType = 'Post' AND p.PostID IS NULL THEN 1
              WHEN r.TargetType = 'Comment' AND c.CommentID IS NULL THEN 1
              WHEN r.TargetType = 'User' AND targetUser.UserID IS NULL THEN 1
              ELSE 0
            END as TargetDeleted,
            -- Thông tin về user bị báo cáo (nếu target là Post/Comment)
            CASE 
              WHEN r.TargetType = 'Post' THEN targetPostUser.UserID
              WHEN r.TargetType = 'Comment' THEN targetCommentUser.UserID
              WHEN r.TargetType = 'User' THEN targetUser.UserID
              ELSE NULL
            END as TargetUserID,
            CASE 
              WHEN r.TargetType = 'Post' THEN targetPostUser.Username
              WHEN r.TargetType = 'Comment' THEN targetCommentUser.Username
              WHEN r.TargetType = 'User' THEN targetUser.Username
              ELSE NULL
            END as TargetUsername,
            CASE 
              WHEN r.TargetType = 'Post' THEN targetPostUser.FullName
              WHEN r.TargetType = 'Comment' THEN targetCommentUser.FullName
              WHEN r.TargetType = 'User' THEN targetUser.FullName
              ELSE NULL
            END as TargetUserFullName
          FROM Reports r
          INNER JOIN Users reporter ON r.ReporterID = reporter.UserID
          LEFT JOIN Users admin ON r.AdminID = admin.UserID
          LEFT JOIN Posts p ON r.TargetType = 'Post' AND r.TargetID = p.PostID
          LEFT JOIN Users targetPostUser ON p.UserID = targetPostUser.UserID
          LEFT JOIN Comments c ON r.TargetType = 'Comment' AND r.TargetID = c.CommentID
          LEFT JOIN Users targetCommentUser ON c.UserID = targetCommentUser.UserID
          LEFT JOIN Users targetUser ON r.TargetType = 'User' AND r.TargetID = targetUser.UserID
          WHERE r.ReportID = @ReportID
        `);
      
      return result.recordset[0] || null;
    } catch (error: any) {
      console.error('Error getting report by id:', error);
      throw new Error('Failed to get report');
    }
  },

  // Xử lý report (resolve)
  async resolveReport(reportId: number, adminId: number, data: ResolveReportRequest): Promise<void> {
    const pool = await getConnection();
    const transaction = pool.transaction();
    
    try {
      await transaction.begin();
      
      // 1. Lấy thông tin report để biết TargetUserID
      const reportResult = await transaction.request()
        .input('ReportID', sql.Int, reportId)
        .query(`
          SELECT 
            r.*,
            CASE 
              WHEN r.TargetType = 'Post' THEN p.UserID
              WHEN r.TargetType = 'Comment' THEN c.UserID
              WHEN r.TargetType = 'User' THEN r.TargetID
              ELSE NULL
            END as TargetUserID
          FROM Reports r
          LEFT JOIN Posts p ON r.TargetType = 'Post' AND r.TargetID = p.PostID
          LEFT JOIN Comments c ON r.TargetType = 'Comment' AND r.TargetID = c.CommentID
          WHERE r.ReportID = @ReportID
        `);
      
      const report = reportResult.recordset[0];
      if (!report) {
        throw new Error('Report not found');
      }
      
      const targetUserId = report.TargetUserID;
      
      // 2. Update report status
      await transaction.request()
        .input('ReportID', sql.Int, reportId)
        .input('Status', sql.TinyInt, 1)
        .input('AdminID', sql.Int, adminId)
        .input('AdminResponse', sql.NVarChar, data.AdminResponse)
        .input('ResolvedAt', sql.DateTime, new Date())
        .query(`
          UPDATE Reports 
          SET Status = @Status, AdminID = @AdminID, AdminResponse = @AdminResponse, ResolvedAt = @ResolvedAt
          WHERE ReportID = @ReportID
        `);
      
      let warningId: number | undefined = undefined;
      
      // 3. Tạo warning nếu được yêu cầu
      if (data.CreateWarning && data.WarningDetails && targetUserId) {
        const warningResult = await transaction.request()
          .input('UserID', sql.Int, targetUserId)
          .input('ReportID', sql.Int, reportId)
          .input('AdminID', sql.Int, adminId)
          .input('WarningReason', sql.NVarChar, data.WarningDetails.WarningReason)
          .input('ActionTaken', sql.NVarChar, data.WarningDetails.ActionTaken)
          .input('Severity', sql.TinyInt, data.WarningDetails.Severity)
          .input('IsActive', sql.Bit, 1)
          .input('CreatedAt', sql.DateTime, new Date())
          .query(`
            INSERT INTO Warnings (UserID, ReportID, AdminID, WarningReason, ActionTaken, Severity, IsActive, CreatedAt)
            OUTPUT INSERTED.WarningID
            VALUES (@UserID, @ReportID, @AdminID, @WarningReason, @ActionTaken, @Severity, @IsActive, @CreatedAt)
          `);
        
        warningId = warningResult.recordset[0].WarningID;
      }
      
      // 4. Tạo ban nếu được yêu cầu
      if (data.CreateBan && targetUserId) {
        const startDate = new Date();
        let endDate = null;
        
        if (data.CreateBan.DurationHours && data.CreateBan.DurationHours > 0) {
          endDate = new Date(startDate.getTime() + data.CreateBan.DurationHours * 60 * 60 * 1000);
        }
        
        await transaction.request()
          .input('UserID', sql.Int, targetUserId)
          .input('WarningID', sql.Int, warningId || null)
          .input('AdminID', sql.Int, adminId)
          .input('BanReason', sql.NVarChar, data.CreateBan.BanReason)
          .input('BanType', sql.NVarChar, data.CreateBan.BanType)
          .input('StartDate', sql.DateTime, startDate)
          .input('EndDate', sql.DateTime, endDate)
          .input('IsActive', sql.Bit, 1)
          .input('CreatedAt', sql.DateTime, new Date())
          .query(`
            INSERT INTO UserBans (UserID, WarningID, AdminID, BanReason, BanType, StartDate, EndDate, IsActive, CreatedAt)
            VALUES (@UserID, @WarningID, @AdminID, @BanReason, @BanType, @StartDate, @EndDate, @IsActive, @CreatedAt)
          `);
      }
      
      await transaction.commit();
    } catch (error: any) {
      await transaction.rollback();
      console.error('Error resolving report:', error);
      throw new Error('Failed to resolve report: ' + error.message);
    }
  },

  // Thống kê reports
  async getReportStats(): Promise<any> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .query(`
          SELECT 
            COUNT(*) as totalReports,
            SUM(CASE WHEN Status = 0 THEN 1 ELSE 0 END) as pendingReports,
            SUM(CASE WHEN Status = 1 THEN 1 ELSE 0 END) as resolvedReports,
            SUM(CASE WHEN TargetType = 'Post' THEN 1 ELSE 0 END) as postReports,
            SUM(CASE WHEN TargetType = 'Comment' THEN 1 ELSE 0 END) as commentReports,
            SUM(CASE WHEN TargetType = 'User' THEN 1 ELSE 0 END) as userReports
          FROM Reports
        `);
      
      return result.recordset[0];
    } catch (error: any) {
      console.error('Error getting report stats:', error);
      throw new Error('Failed to get report stats');
    }
  }
};
