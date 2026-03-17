import { getConnection } from '../config/database';
import sql from 'mssql';
import { CreateReportDTO, Report, ReportWithDetails } from '../models/Report';

export const reportService = {
  // Tạo report mới
  async createReport(data: CreateReportDTO): Promise<Report> {
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('reporterID', sql.Int, data.ReporterID)
      .input('targetID', sql.Int, data.TargetID)
      .input('targetType', sql.NVarChar, data.TargetType)
      .input('reason', sql.NVarChar, data.Reason)
      .query(`
        INSERT INTO dbo.Reports (ReporterID, TargetID, TargetType, Reason, Status, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@reporterID, @targetID, @targetType, @reason, 0, GETDATE())
      `);

    return result.recordset[0];
  },

  // Kiểm tra user đã report chưa
  async checkExistingReport(reporterID: number, targetID: number, targetType: string): Promise<boolean> {
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('reporterID', sql.Int, reporterID)
      .input('targetID', sql.Int, targetID)
      .input('targetType', sql.NVarChar, targetType)
      .query(`
        SELECT COUNT(*) as count
        FROM dbo.Reports
        WHERE ReporterID = @reporterID 
          AND TargetID = @targetID 
          AND TargetType = @targetType
      `);

    return result.recordset[0].count > 0;
  },

  // Lấy danh sách reports (cho admin)
  async getAllReports(status?: 0 | 1): Promise<ReportWithDetails[]> {
    const pool = await getConnection();
    
    let query = `
      SELECT 
        r.*,
        u.Username as ReporterUsername,
        u.FullName as ReporterFullName,
        CASE 
          WHEN r.TargetType = 'User' THEN tu.Username
          WHEN r.TargetType = 'Post' THEN pu.Username
          WHEN r.TargetType = 'Comment' THEN cu.Username
        END as TargetUsername,
        CASE 
          WHEN r.TargetType = 'User' THEN tu.FullName
          WHEN r.TargetType = 'Post' THEN pu.FullName
          WHEN r.TargetType = 'Comment' THEN cu.FullName
        END as TargetFullName
      FROM dbo.Reports r
      INNER JOIN dbo.Users u ON r.ReporterID = u.UserID
      LEFT JOIN dbo.Users tu ON r.TargetID = tu.UserID AND r.TargetType = 'User'
      LEFT JOIN dbo.Posts p ON r.TargetID = p.PostID AND r.TargetType = 'Post'
      LEFT JOIN dbo.Users pu ON p.UserID = pu.UserID
      LEFT JOIN dbo.Comments c ON r.TargetID = c.CommentID AND r.TargetType = 'Comment'
      LEFT JOIN dbo.Users cu ON c.UserID = cu.UserID
    `;

    if (status !== undefined) {
      query += ` WHERE r.Status = @status`;
    }

    query += ` ORDER BY r.CreatedAt DESC`;

    const request = pool.request();
    if (status !== undefined) {
      request.input('status', sql.Int, status);
    }

    const result = await request.query(query);
    return result.recordset;
  },

  // Cập nhật status report
  async updateReportStatus(reportID: number, status: 0 | 1): Promise<void> {
    const pool = await getConnection();
    
    await pool.request()
      .input('reportID', sql.Int, reportID)
      .input('status', sql.Int, status)
      .query(`
        UPDATE dbo.Reports
        SET Status = @status
        WHERE ReportID = @reportID
      `);
  },

  // Lấy reports theo targetID và targetType
  async getReportsByTarget(targetID: number, targetType: string): Promise<ReportWithDetails[]> {
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('targetID', sql.Int, targetID)
      .input('targetType', sql.NVarChar, targetType)
      .query(`
        SELECT 
          r.*,
          u.Username as ReporterUsername,
          u.FullName as ReporterFullName
        FROM dbo.Reports r
        INNER JOIN dbo.Users u ON r.ReporterID = u.UserID
        WHERE r.TargetID = @targetID AND r.TargetType = @targetType
        ORDER BY r.CreatedAt DESC
      `);

    return result.recordset;
  },

  // Lấy reports của một user
  async getReportsByReporter(reporterID: number): Promise<ReportWithDetails[]> {
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('reporterID', sql.Int, reporterID)
      .query(`
        SELECT 
          r.*,
          u.Username as ReporterUsername,
          u.FullName as ReporterFullName,
          CASE 
            WHEN r.TargetType = 'Post' THEN p.Title
            ELSE NULL
          END as TargetTitle,
          CASE 
            WHEN r.TargetType = 'Post' THEN p.Content
            WHEN r.TargetType = 'Comment' THEN c.Content
            ELSE NULL
          END as TargetContent,
          CASE 
            WHEN r.TargetType = 'Post' AND p.PostID IS NULL THEN 1
            WHEN r.TargetType = 'Comment' AND c.CommentID IS NULL THEN 1
            WHEN r.TargetType = 'User' AND tu.UserID IS NULL THEN 1
            ELSE 0
          END as TargetDeleted
        FROM dbo.Reports r
        INNER JOIN dbo.Users u ON r.ReporterID = u.UserID
        LEFT JOIN dbo.Posts p ON r.TargetType = 'Post' AND r.TargetID = p.PostID
        LEFT JOIN dbo.Comments c ON r.TargetType = 'Comment' AND r.TargetID = c.CommentID
        LEFT JOIN dbo.Users tu ON r.TargetType = 'User' AND r.TargetID = tu.UserID
        WHERE r.ReporterID = @reporterID
        ORDER BY r.CreatedAt DESC
      `);

    return result.recordset;
  }
};
