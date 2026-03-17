import sql from 'mssql';
import { getConnection } from '../config/database';
import { Notification, CreateNotificationDTO } from '../models';

export const notificationService = {
  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationDTO): Promise<void> {
    const pool = await getConnection();
    
    await pool.request()
      .input('userId', sql.Int, data.UserID)
      .input('sourceId', sql.Int, data.SourceID)
      .input('type', sql.NVarChar(50), data.Type)
      .input('message', sql.NVarChar(sql.MAX), data.Message)
      .query(`
        INSERT INTO Notifications (UserID, SourceID, Type, Message, IsRead, CreatedAt)
        VALUES (@userId, @sourceId, @type, @message, 0, GETDATE())
      `);
  },

  /**
   * Create notification for comment reply
   */
  async notifyCommentReply(
    targetUserId: number,
    commentId: number,
    replierName: string,
    postId: number
  ): Promise<void> {
    const pool = await getConnection();
    
    // Don't notify if user replies to themselves
    const replierResult = await pool.request()
      .input('commentId', sql.Int, commentId)
      .query(`
        SELECT UserID FROM Comments WHERE CommentID = @commentId
      `);
    
    if (replierResult.recordset.length > 0) {
      const originalCommentUserId = replierResult.recordset[0].UserID;
      
      if (originalCommentUserId === targetUserId) {
        return; // Don't notify self
      }

      await this.createNotification({
        UserID: originalCommentUserId,
        SourceID: postId,
        Type: 'CommentReply',
        Message: `${replierName} đã trả lời bình luận của bạn`
      });
    }
  },

  /**
   * Get notifications for a user with post/comment details
   */
  async getUserNotifications(userId: number, limit: number = 20): Promise<Notification[]> {
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          n.NotificationID,
          n.UserID,
          n.SourceID,
          n.Type,
          n.Message,
          n.IsRead,
          n.CreatedAt,
          p.Title as PostTitle,
          c.Content as CommentContent,
          u.FullName as ActorName,
          ub.BanType,
          ub.BanReason,
          ub.EndDate as BanEndDate
        FROM Notifications n
        LEFT JOIN Posts p ON n.SourceID = p.PostID AND n.Type IN ('NewReaction', 'NewComment', 'CommentReply')
        LEFT JOIN Comments c ON n.SourceID = c.PostID AND n.Type IN ('NewComment', 'CommentReply')
        LEFT JOIN UserBans ub ON n.SourceID = ub.BanID AND n.Type = 'Ban'
        LEFT JOIN Users u ON (
          (n.Type = 'NewFollower' AND n.SourceID = u.UserID)
          OR (n.Type IN ('NewReaction', 'NewComment', 'CommentReply') AND c.UserID = u.UserID)
        )
        WHERE n.UserID = @userId
        ORDER BY n.CreatedAt DESC
      `);

    // Format messages with more details
    return result.recordset.map((notification: any) => {
      let detailedMessage = notification.Message;
      
      if (notification.Type === 'NewReaction' && notification.PostTitle) {
        detailedMessage = `${notification.Message} - Bài viết: "${notification.PostTitle}"`;
      } else if (notification.Type === 'NewComment' && notification.PostTitle && notification.CommentContent) {
        detailedMessage = `${notification.Message} - Bài viết: "${notification.PostTitle}" - Nội dung: "${notification.CommentContent.substring(0, 50)}..."`;
      } else if (notification.Type === 'CommentReply' && notification.PostTitle && notification.CommentContent) {
        detailedMessage = `${notification.Message} - Bài viết: "${notification.PostTitle}" - Nội dung: "${notification.CommentContent.substring(0, 50)}..."`;
      }
      // Notification type 'Ban' already has complete message from createBan, no need to modify
      
      return {
        NotificationID: notification.NotificationID,
        UserID: notification.UserID,
        SourceID: notification.SourceID,
        Type: notification.Type,
        Message: detailedMessage,
        IsRead: notification.IsRead,
        CreatedAt: notification.CreatedAt
      };
    });
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const pool = await getConnection();
    
    await pool.request()
      .input('notificationId', sql.Int, notificationId)
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE Notifications
        SET IsRead = 1
        WHERE NotificationID = @notificationId AND UserID = @userId
      `);
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: number): Promise<void> {
    const pool = await getConnection();
    
    await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE Notifications
        SET IsRead = 1
        WHERE UserID = @userId AND IsRead = 0
      `);
  },

  /**
   * Get unread count
   */
  async getUnreadCount(userId: number): Promise<number> {
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT COUNT(*) as count
        FROM Notifications
        WHERE UserID = @userId AND IsRead = 0
      `);

    return result.recordset[0].count;
  }
};
