import { Request, Response } from 'express';
import { getConnection } from '../config/database';
import sql from 'mssql';

export const getUserDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const pool = await getConnection();

    // Get user basic info
    const userResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT UserID, Email, FullName, PhoneNumber, Bio, UserStatus, CreatedAt
        FROM Users
        WHERE UserID = @userId
      `);

    if (userResult.recordset.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
      return;
    }

    const user = userResult.recordset[0];

    // Get stats
    const statsResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          (SELECT COUNT(*) FROM Posts WHERE UserID = @userId) AS totalPosts,
          (SELECT COUNT(*) FROM Comments WHERE UserID = @userId) AS totalComments,
          (SELECT COUNT(*) FROM Reactions WHERE UserID = @userId) AS totalReactions,
          (SELECT COUNT(*) FROM Reports WHERE TargetID = @userId AND TargetType = 'User') AS totalReports,
          (SELECT COUNT(*) FROM Warnings WHERE UserID = @userId) AS totalWarnings,
          (SELECT COUNT(*) FROM UserBans WHERE UserID = @userId AND IsActive = 1) AS activeBans
      `);

    const stats = statsResult.recordset[0];

    // Get recent posts with report count
    const postsResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP 10
          p.PostID,
          p.Title,
          p.Content,
          p.CreatedAt,
          CASE WHEN EXISTS (SELECT 1 FROM Reports WHERE TargetID = p.PostID AND TargetType = 'Post') THEN 1 ELSE 0 END AS HasReports,
          (SELECT COUNT(*) FROM Reports WHERE TargetID = p.PostID AND TargetType = 'Post') AS ReportCount
        FROM Posts p
        WHERE p.UserID = @userId
        ORDER BY p.CreatedAt DESC
      `);

    // Get reports against this user
    const reportsResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP 10
          r.ReportID,
          r.Reason,
          r.Status,
          r.CreatedAt,
          r.TargetType,
          CASE 
            WHEN r.TargetType = 'Post' THEN (SELECT Title FROM Posts WHERE PostID = r.TargetID)
            WHEN r.TargetType = 'Comment' THEN (SELECT Content FROM Comments WHERE CommentID = r.TargetID)
            ELSE NULL
          END AS TargetContent
        FROM Reports r
        WHERE r.TargetID = @userId AND r.TargetType = 'User'
        ORDER BY r.CreatedAt DESC
      `);

    // Get warnings
    const warningsResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP 10
          WarningID,
          WarningReason,
          Severity,
          IsActive,
          CreatedAt
        FROM Warnings
        WHERE UserID = @userId
        ORDER BY CreatedAt DESC
      `);

    // Get bans
    const bansResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          BanID,
          BanReason,
          BanType,
          StartDate,
          EndDate,
          IsActive
        FROM UserBans
        WHERE UserID = @userId
        ORDER BY CreatedAt DESC
      `);

    res.json({
      user,
      stats,
      recentPosts: postsResult.recordset,
      reports: reportsResult.recordset,
      warnings: warningsResult.recordset,
      bans: bansResult.recordset,
    });
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng' });
    return;
  }
};
