import { getConnection } from '../config/database';
import sql from 'mssql';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userChangePercent: number;
  totalPosts: number;
  newPostsThisMonth: number;
  totalComments: number;
  newCommentsThisMonth: number;
  pendingReports: number;
  resolvedReports: number;
  totalReportsThisMonth: number;
  totalReactions: number;
}

export interface RecentActivity {
  type: string;
  icon: string;
  text: string;
  time: string;
  color: string;
}

export const adminService = {
  // Lấy thống kê dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const pool = await getConnection();

    // Total Users
    const totalUsersResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM dbo.Users WHERE Role != 'Admin'
    `);

    // Active Users (users who posted, commented or reacted in last 30 days)
    const activeUsersResult = await pool.request().query(`
      SELECT COUNT(DISTINCT UserID) as total
      FROM (
        SELECT UserID FROM dbo.Posts WHERE CreatedAt >= DATEADD(day, -30, GETDATE())
        UNION
        SELECT UserID FROM dbo.Comments WHERE CreatedAt >= DATEADD(day, -30, GETDATE())
        UNION
        SELECT UserID FROM dbo.Reactions WHERE CreatedAt >= DATEADD(day, -30, GETDATE())
      ) as ActiveUsers
    `);

    // New Users This Month
    const newUsersResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM dbo.Users 
      WHERE CreatedAt >= DATEADD(month, -1, GETDATE()) AND Role != 'Admin'
    `);

    // New Users Last Month
    const lastMonthUsersResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM dbo.Users 
      WHERE CreatedAt >= DATEADD(month, -2, GETDATE()) 
      AND CreatedAt < DATEADD(month, -1, GETDATE())
      AND Role != 'Admin'
    `);

    // Total Posts
    const totalPostsResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM dbo.Posts
    `);

    // New Posts This Month
    const newPostsResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM dbo.Posts 
      WHERE CreatedAt >= DATEADD(month, -1, GETDATE())
    `);

    // Total Comments
    const totalCommentsResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM dbo.Comments
    `);

    // New Comments This Month
    const newCommentsResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM dbo.Comments 
      WHERE CreatedAt >= DATEADD(month, -1, GETDATE())
    `);

    // Pending Reports (Status = 0)
    const pendingReportsResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM dbo.Reports WHERE Status = 0
    `);

    // Resolved Reports (Status = 1)
    const resolvedReportsResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM dbo.Reports WHERE Status = 1
    `);

    // Total Reports This Month
    const totalReportsResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM dbo.Reports 
      WHERE CreatedAt >= DATEADD(month, -1, GETDATE())
    `);

    // Total Reactions
    const totalReactionsResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM dbo.Reactions
    `);

    // Calculate user change percent
    const newUsers = newUsersResult.recordset[0].total;
    const lastMonthUsers = lastMonthUsersResult.recordset[0].total;
    const userChangePercent = lastMonthUsers > 0 
      ? Math.round(((newUsers - lastMonthUsers) / lastMonthUsers) * 100)
      : 0;

    return {
      totalUsers: totalUsersResult.recordset[0].total,
      activeUsers: activeUsersResult.recordset[0].total,
      newUsersThisMonth: newUsers,
      userChangePercent: userChangePercent,
      totalPosts: totalPostsResult.recordset[0].total,
      newPostsThisMonth: newPostsResult.recordset[0].total,
      totalComments: totalCommentsResult.recordset[0].total,
      newCommentsThisMonth: newCommentsResult.recordset[0].total,
      pendingReports: pendingReportsResult.recordset[0].total,
      resolvedReports: resolvedReportsResult.recordset[0].total,
      totalReportsThisMonth: totalReportsResult.recordset[0].total,
      totalReactions: totalReactionsResult.recordset[0].total,
    };
  },

  // Lấy hoạt động gần đây
  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    const pool = await getConnection();

    const result = await pool.request()
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit) * FROM (
          -- New Posts
          SELECT 
            'post' as type,
            'post-outline' as icon,
            u.FullName + ' đã tạo bài viết mới: "' + LEFT(p.Title, 30) + '..."' as text,
            p.CreatedAt as time,
            '#8b5cf6' as color
          FROM dbo.Posts p
          INNER JOIN dbo.Users u ON p.UserID = u.UserID
          
          UNION ALL
          
          -- New Comments
          SELECT 
            'comment' as type,
            'comment-outline' as icon,
            u.FullName + ' đã bình luận trong bài viết' as text,
            c.CreatedAt as time,
            '#10b981' as color
          FROM dbo.Comments c
          INNER JOIN dbo.Users u ON c.UserID = u.UserID
          
          UNION ALL
          
          -- New Reports
          SELECT 
            'report' as type,
            'flag' as icon,
            u.FullName + ' đã báo cáo ' + 
            CASE r.TargetType 
              WHEN 'Post' THEN 'bài viết'
              WHEN 'Comment' THEN 'bình luận'
              WHEN 'User' THEN 'người dùng'
            END as text,
            r.CreatedAt as time,
            '#ef4444' as color
          FROM dbo.Reports r
          INNER JOIN dbo.Users u ON r.ReporterID = u.UserID
          
          UNION ALL
          
          -- New Users
          SELECT 
            'user' as type,
            'account-plus' as icon,
            u.FullName + ' đã đăng ký tài khoản' as text,
            u.CreatedAt as time,
            '#3b82f6' as color
          FROM dbo.Users u
          WHERE u.Role != 'Admin'
        ) as AllActivities
        ORDER BY time DESC
      `);

    return result.recordset;
  },
};

export default adminService;
