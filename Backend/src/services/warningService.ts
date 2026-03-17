import sql from 'mssql';
import { getConnection } from '../config/database';
import { Warning, CreateWarningRequest } from '../models/Warning';
import { notificationService } from './notificationService';

export const warningService = {
  // Tạo cảnh báo mới
  async createWarning(adminId: number, data: CreateWarningRequest): Promise<Warning> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('UserID', sql.Int, data.UserID)
        .input('ReportID', sql.Int, data.ReportID || null)
        .input('AdminID', sql.Int, adminId)
        .input('WarningReason', sql.NVarChar, data.WarningReason)
        .input('ActionTaken', sql.NVarChar, data.ActionTaken)
        .input('Severity', sql.TinyInt, data.Severity)
        .input('IsActive', sql.Bit, 1)
        .input('CreatedAt', sql.DateTime, new Date())
        .query(`
          INSERT INTO Warnings (UserID, ReportID, AdminID, WarningReason, ActionTaken, Severity, IsActive, CreatedAt)
          OUTPUT INSERTED.*
          VALUES (@UserID, @ReportID, @AdminID, @WarningReason, @ActionTaken, @Severity, @IsActive, @CreatedAt)
        `);
      
      const warning = result.recordset[0];

      // Tạo notification cho user bị cảnh báo
      const severityText = ['Nhẹ', 'Trung bình', 'Nghiêm trọng'][data.Severity - 1] || 'Không xác định';
      const message = `Bạn đã nhận cảnh báo mức độ ${severityText}. Lý do: ${data.WarningReason}. Hành động: ${data.ActionTaken}`;
      
      await notificationService.createNotification({
        UserID: data.UserID,
        SourceID: warning.WarningID,
        Type: 'Warning',
        Message: message
      });
      
      return warning;
    } catch (error: any) {
      console.error('Error creating warning:', error);
      throw new Error('Failed to create warning');
    }
  },

  // Lấy tất cả cảnh báo của một user
  async getUserWarnings(userId: number): Promise<Warning[]> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .query(`
          SELECT 
            w.*,
            u.Username as UserName,
            u.FullName as UserFullName,
            a.Username as AdminName,
            r.Reason as ReportReason
          FROM Warnings w
          INNER JOIN Users u ON w.UserID = u.UserID
          INNER JOIN Users a ON w.AdminID = a.UserID
          LEFT JOIN Reports r ON w.ReportID = r.ReportID
          WHERE w.UserID = @UserID
          ORDER BY w.CreatedAt DESC
        `);
      
      return result.recordset;
    } catch (error: any) {
      console.error('Error getting user warnings:', error);
      throw new Error('Failed to get user warnings');
    }
  },

  // Lấy tất cả cảnh báo (admin)
  async getAllWarnings(page: number = 1, pageSize: number = 20, isActive?: boolean): Promise<{ data: Warning[], totalItems: number, totalPages: number }> {
    try {
      const pool = await getConnection();
      const offset = (page - 1) * pageSize;
      
      let whereClause = '';
      if (isActive !== undefined) {
        whereClause = `WHERE w.IsActive = ${isActive ? 1 : 0}`;
      }
      
      // Get total count
      const countResult = await pool.request()
        .query(`SELECT COUNT(*) as total FROM Warnings w ${whereClause}`);
      const totalItems = countResult.recordset[0].total;
      
      // Get paginated data
      const result = await pool.request()
        .query(`
          SELECT 
            w.*,
            u.Username as UserName,
            u.FullName as UserFullName,
            a.Username as AdminName,
            r.Reason as ReportReason
          FROM Warnings w
          INNER JOIN Users u ON w.UserID = u.UserID
          INNER JOIN Users a ON w.AdminID = a.UserID
          LEFT JOIN Reports r ON w.ReportID = r.ReportID
          ${whereClause}
          ORDER BY w.CreatedAt DESC
          OFFSET ${offset} ROWS
          FETCH NEXT ${pageSize} ROWS ONLY
        `);
      
      return {
        data: result.recordset,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize)
      };
    } catch (error: any) {
      console.error('Error getting all warnings:', error);
      throw new Error('Failed to get warnings');
    }
  },

  // Vô hiệu hóa cảnh báo
  async deactivateWarning(warningId: number): Promise<void> {
    try {
      const pool = await getConnection();
      
      await pool.request()
        .input('WarningID', sql.Int, warningId)
        .query(`
          UPDATE Warnings 
          SET IsActive = 0
          WHERE WarningID = @WarningID
        `);
    } catch (error: any) {
      console.error('Error deactivating warning:', error);
      throw new Error('Failed to deactivate warning');
    }
  }
};
