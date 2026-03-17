import { getConnection } from '../config/database';
import sql from 'mssql';

export interface User {
  UserID: number;
  Username: string;
  Email: string;
  FullName: string;
  PhoneNumber?: string;
  Role: string;
  UserStatus: number; // 0: Inactive (Banned), 1: Active
  IsVerify: boolean;
  CreatedAt: Date;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: number;
}

export const userManagementService = {
  // Lấy danh sách users với filters và pagination
  async getAllUsers(
    page: number = 1,
    pageSize: number = 20,
    filters?: UserFilters
  ): Promise<{ users: User[]; total: number }> {
    const pool = await getConnection();
    const offset = (page - 1) * pageSize;

    let whereConditions = ['Role != @adminRole'];
    const params: any = {
      adminRole: 'Admin',
      offset: offset,
      pageSize: pageSize
    };

    // Search filter
    if (filters?.search) {
      whereConditions.push('(Username LIKE @search OR Email LIKE @search OR FullName LIKE @search OR PhoneNumber LIKE @search)');
      params.search = `%${filters.search}%`;
    }

    // Role filter
    if (filters?.role) {
      whereConditions.push('Role = @role');
      params.role = filters.role;
    }

    // Status filter
    if (filters?.status !== undefined) {
      whereConditions.push('UserStatus = @status');
      params.status = filters.status;
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM dbo.Users 
      ${whereClause}
    `;

    const request = pool.request();
    Object.keys(params).forEach(key => {
      if (key !== 'offset' && key !== 'pageSize') {
        request.input(key, params[key]);
      }
    });

    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;

    // Get users
    const usersQuery = `
      SELECT 
        UserID,
        Username,
        Email,
        FullName,
        PhoneNumber,
        Role,
        UserStatus,
        IsVerify,
        CreatedAt
      FROM dbo.Users
      ${whereClause}
      ORDER BY CreatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @pageSize ROWS ONLY
    `;

    const request2 = pool.request();
    Object.keys(params).forEach(key => {
      request2.input(key, params[key]);
    });

    const usersResult = await request2.query(usersQuery);

    return {
      users: usersResult.recordset,
      total: total
    };
  },

  // Ban user (set UserStatus = 0)
  async banUser(userId: number): Promise<void> {
    const pool = await getConnection();

    await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE dbo.Users
        SET UserStatus = 0
        WHERE UserID = @userId AND Role != 'Admin'
      `);
  },

  // Unban user (set UserStatus = 1)
  async unbanUser(userId: number): Promise<void> {
    const pool = await getConnection();

    await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE dbo.Users
        SET UserStatus = 1
        WHERE UserID = @userId
      `);
  },

  // Delete user (soft delete)
  async deleteUser(userId: number): Promise<void> {
    const pool = await getConnection();

    // Xóa tất cả dữ liệu liên quan của user
    await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        -- Xóa posts của user
        DELETE FROM dbo.Posts WHERE UserID = @userId;
        
        -- Xóa comments của user
        DELETE FROM dbo.Comments WHERE UserID = @userId;
        
        -- Xóa reactions của user
        DELETE FROM dbo.Reactions WHERE UserID = @userId;
        
        -- Xóa reports của user
        DELETE FROM dbo.Reports WHERE ReporterID = @userId;
        
        -- Xóa notifications của user
        DELETE FROM dbo.Notifications WHERE UserID = @userId;
        
        -- Xóa follows của user
        DELETE FROM dbo.Follows WHERE FollowerID = @userId OR (TargetID = @userId AND Type = 'User');
        
        -- Cuối cùng xóa user
        DELETE FROM dbo.Users WHERE UserID = @userId AND Role != 'Admin';
      `);
  },

  // Get user statistics
  async getUserStats(userId: number): Promise<{
    totalPosts: number;
    totalComments: number;
    totalReactions: number;
  }> {
    const pool = await getConnection();

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          (SELECT COUNT(*) FROM dbo.Posts WHERE UserID = @userId) as totalPosts,
          (SELECT COUNT(*) FROM dbo.Comments WHERE UserID = @userId) as totalComments,
          (SELECT COUNT(*) FROM dbo.Reactions WHERE UserID = @userId) as totalReactions
      `);

    return result.recordset[0];
  }
};

export default userManagementService;
