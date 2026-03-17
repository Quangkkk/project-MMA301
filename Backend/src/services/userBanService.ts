import sql from 'mssql';
import { getConnection } from '../config/database';
import { UserBan, CreateBanRequest, ActiveBansResponse } from '../models/UserBan';
import { notificationService } from './notificationService';

export const userBanService = {
  // Tạo lệnh cấm mới
  async createBan(adminId: number, data: CreateBanRequest): Promise<UserBan> {
    try {
      const pool = await getConnection();
      
      const startDate = new Date();
      let endDate = null;
      
      // Tính end date nếu có duration
      if (data.DurationHours && data.DurationHours > 0) {
        endDate = new Date(startDate.getTime() + data.DurationHours * 60 * 60 * 1000);
      }
      
      const result = await pool.request()
        .input('UserID', sql.Int, data.UserID)
        .input('WarningID', sql.Int, data.WarningID || null)
        .input('AdminID', sql.Int, adminId)
        .input('BanReason', sql.NVarChar, data.BanReason)
        .input('BanType', sql.NVarChar, data.BanType)
        .input('StartDate', sql.DateTime, startDate)
        .input('EndDate', sql.DateTime, endDate)
        .input('IsActive', sql.Bit, 1)
        .input('CreatedAt', sql.DateTime, new Date())
        .query(`
          INSERT INTO UserBans (UserID, WarningID, AdminID, BanReason, BanType, StartDate, EndDate, IsActive, CreatedAt)
          OUTPUT INSERTED.*
          VALUES (@UserID, @WarningID, @AdminID, @BanReason, @BanType, @StartDate, @EndDate, @IsActive, @CreatedAt)
        `);
      
      const ban = result.recordset[0];

      // Tạo notification cho user bị ban
      const banTypeMap: { [key: string]: string } = {
        'POST': 'đăng bài',
        'COMMENT': 'bình luận',
        'REPORT': 'báo cáo',
        'FULL': 'sử dụng hệ thống'
      };
      
      const durationText = data.DurationHours 
        ? `trong ${Math.floor(data.DurationHours / 24)} ngày` 
        : 'vĩnh viễn';
      
      const message = `Bạn đã bị cấm ${banTypeMap[data.BanType] || data.BanType} ${durationText}. Lý do: ${data.BanReason}`;
      
      await notificationService.createNotification({
        UserID: data.UserID,
        SourceID: ban.BanID,
        Type: 'Ban',
        Message: message
      });
      
      return ban;
    } catch (error: any) {
      console.error('Error creating ban:', error);
      throw new Error('Failed to create ban');
    }
  },

  // Kiểm tra quyền của user (có bị cấm không)
  async checkUserBans(userId: number): Promise<ActiveBansResponse> {
    try {
      const pool = await getConnection();
      const now = new Date();
      
      // Tự động vô hiệu hóa các ban đã hết hạn
      await pool.request()
        .input('Now', sql.DateTime, now)
        .query(`
          UPDATE UserBans 
          SET IsActive = 0
          WHERE IsActive = 1 
          AND EndDate IS NOT NULL 
          AND EndDate < @Now
        `);
      
      // Lấy các ban đang active
      const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .input('Now', sql.DateTime, now)
        .query(`
          SELECT 
            ub.*,
            u.Username as UserName,
            u.FullName as UserFullName,
            a.Username as AdminName
          FROM UserBans ub
          INNER JOIN Users u ON ub.UserID = u.UserID
          INNER JOIN Users a ON ub.AdminID = a.UserID
          WHERE ub.UserID = @UserID 
          AND ub.IsActive = 1
          AND (ub.EndDate IS NULL OR ub.EndDate > @Now)
        `);
      
      const bans: UserBan[] = result.recordset;
      
      const response: ActiveBansResponse = {
        canPost: true,
        canComment: true,
        canReport: true,
        isFullyBanned: false,
        bans
      };
      
      // Kiểm tra từng loại ban
      for (const ban of bans) {
        if (ban.BanType === 'POST' || ban.BanType === 'FULL') {
          response.canPost = false;
        }
        if (ban.BanType === 'COMMENT' || ban.BanType === 'FULL') {
          response.canComment = false;
        }
        if (ban.BanType === 'REPORT' || ban.BanType === 'FULL') {
          response.canReport = false;
        }
        if (ban.BanType === 'FULL') {
          response.isFullyBanned = true;
        }
      }
      
      return response;
    } catch (error: any) {
      console.error('Error checking user bans:', error);
      throw new Error('Failed to check user bans');
    }
  },

  // Thu hồi lệnh cấm
  async revokeBan(banId: number, adminId: number): Promise<void> {
    try {
      const pool = await getConnection();
      
      await pool.request()
        .input('BanID', sql.Int, banId)
        .input('RevokedBy', sql.Int, adminId)
        .input('RevokedAt', sql.DateTime, new Date())
        .query(`
          UPDATE UserBans 
          SET IsActive = 0, RevokedBy = @RevokedBy, RevokedAt = @RevokedAt
          WHERE BanID = @BanID
        `);
    } catch (error: any) {
      console.error('Error revoking ban:', error);
      throw new Error('Failed to revoke ban');
    }
  },

  // Lấy tất cả bans (admin)
  async getAllBans(page: number = 1, pageSize: number = 20, isActive?: boolean): Promise<{ data: UserBan[], totalItems: number, totalPages: number }> {
    try {
      const pool = await getConnection();
      const offset = (page - 1) * pageSize;
      
      // Auto-deactivate expired bans
      await pool.request()
        .input('Now', sql.DateTime, new Date())
        .query(`
          UPDATE UserBans 
          SET IsActive = 0
          WHERE IsActive = 1 
          AND EndDate IS NOT NULL 
          AND EndDate < @Now
        `);
      
      let whereClause = '';
      if (isActive !== undefined) {
        whereClause = `WHERE ub.IsActive = ${isActive ? 1 : 0}`;
      }
      
      // Get total count
      const countResult = await pool.request()
        .query(`SELECT COUNT(*) as total FROM UserBans ub ${whereClause}`);
      const totalItems = countResult.recordset[0].total;
      
      // Get paginated data
      const result = await pool.request()
        .query(`
          SELECT 
            ub.*,
            u.Username as UserName,
            u.FullName as UserFullName,
            a.Username as AdminName,
            r.Username as RevokedByName
          FROM UserBans ub
          INNER JOIN Users u ON ub.UserID = u.UserID
          INNER JOIN Users a ON ub.AdminID = a.UserID
          LEFT JOIN Users r ON ub.RevokedBy = r.UserID
          ${whereClause}
          ORDER BY ub.CreatedAt DESC
          OFFSET ${offset} ROWS
          FETCH NEXT ${pageSize} ROWS ONLY
        `);
      
      return {
        data: result.recordset,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize)
      };
    } catch (error: any) {
      console.error('Error getting all bans:', error);
      throw new Error('Failed to get bans');
    }
  },

  // Lấy bans của một user
  async getUserBans(userId: number): Promise<UserBan[]> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .query(`
          SELECT 
            ub.*,
            u.Username as UserName,
            u.FullName as UserFullName,
            a.Username as AdminName,
            r.Username as RevokedByName
          FROM UserBans ub
          INNER JOIN Users u ON ub.UserID = u.UserID
          INNER JOIN Users a ON ub.AdminID = a.UserID
          LEFT JOIN Users r ON ub.RevokedBy = r.UserID
          WHERE ub.UserID = @UserID
          ORDER BY ub.CreatedAt DESC
        `);
      
      return result.recordset;
    } catch (error: any) {
      console.error('Error getting user bans:', error);
      throw new Error('Failed to get user bans');
    }
  },

  // Cập nhật ban
  async updateBan(banId: number, data: { durationHours: number; banType: string }): Promise<void> {
    try {
      const pool = await getConnection();
      
      // Lấy thông tin ban hiện tại
      const currentBanResult = await pool.request()
        .input('BanID', sql.Int, banId)
        .query(`
          SELECT * FROM UserBans WHERE BanID = @BanID
        `);
      
      if (currentBanResult.recordset.length === 0) {
        throw new Error('Ban not found');
      }
      
      const currentBan = currentBanResult.recordset[0];
      
      // Tính end date mới
      const startDate = new Date(currentBan.StartDate);
      const endDate = new Date(startDate.getTime() + data.durationHours * 60 * 60 * 1000);
      
      // Update ban
      await pool.request()
        .input('BanID', sql.Int, banId)
        .input('BanType', sql.NVarChar, data.banType)
        .input('EndDate', sql.DateTime, endDate)
        .query(`
          UPDATE UserBans 
          SET BanType = @BanType, EndDate = @EndDate
          WHERE BanID = @BanID
        `);
    } catch (error: any) {
      console.error('Error updating ban:', error);
      throw new Error(error.message || 'Failed to update ban');
    }
  }
};
