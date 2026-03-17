import sql from 'mssql';
import { getConnection } from '../config/database';
import { notificationService } from './notificationService';

export interface Comment {
  commentId: number;
  postId: number;
  userId: number;
  username: string;
  fullName: string;
  avatarURL?: string;
  content: string;
  createdAt: string;
  reactions: number;
  userReaction?: string;
}

class CommentService {
  // Lấy danh sách comments của post
  async getCommentsByPost(
    postId: number,
    userId?: number,
    page: number = 1,
    limit: number = 20
  ): Promise<Comment[]> {
    try {
      const pool = await getConnection();
      const offset = (page - 1) * limit;

      const result = await pool.request()
        .input('postId', sql.Int, postId)
        .input('userId', sql.Int, userId)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit)
        .query(`
          SELECT 
            c.CommentID as commentId,
            c.PostID as postId,
            c.UserID as userId,
            c.ParentCommentID as parentCommentId,
            u.Username as username,
            u.FullName as fullName,
            m.FilePath as avatarURL,
            c.Content as content,
            c.CreatedAt as createdAt,
            p.UserID as authorId,
            (SELECT COUNT(*) FROM dbo.Reactions r WHERE r.TargetID = c.CommentID AND r.TargetType = 'Comment') as reactions,
            ${userId ? `(SELECT TOP 1 ReactionType FROM dbo.Reactions r WHERE r.TargetID = c.CommentID AND r.TargetType = 'Comment' AND r.UserID = @userId)` : 'NULL'} as userReaction,
            CASE WHEN EXISTS (SELECT 1 FROM dbo.CommentEditHistory WHERE CommentID = c.CommentID) THEN 1 ELSE 0 END as isEdited
          FROM dbo.Comments c
          INNER JOIN dbo.Users u ON c.UserID = u.UserID
          LEFT JOIN dbo.Media_Entity_Mapping mem ON mem.EntityType = 'User' AND mem.EntityID = u.UserID AND mem.MediaType = 'avatar'
          LEFT JOIN dbo.Media m ON m.MediaID = mem.MediaID AND m.IsActive = 1
          INNER JOIN dbo.Posts p ON c.PostID = p.PostID
          WHERE c.PostID = @postId
          ORDER BY c.CreatedAt ASC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);

      return result.recordset;
    } catch (error) {
      console.error('Error in getCommentsByPost:', error);
      throw new Error('Failed to get comments');
    }
  }

  // Thêm comment mới
  async addComment(
    postId: number,
    userId: number,
    content: string,
    parentCommentId?: number
  ): Promise<Comment> {
    try {
      const pool = await getConnection();

      const result = await pool.request()
        .input('postId', sql.Int, postId)
        .input('userId', sql.Int, userId)
        .input('content', sql.NVarChar(sql.MAX), content)
        .input('parentCommentId', sql.Int, parentCommentId || null)
        .query(`
          INSERT INTO dbo.Comments (PostID, UserID, ParentCommentID, Content, IsBestAnswer, CreatedAt)
          OUTPUT 
            INSERTED.CommentID as commentId,
            INSERTED.PostID as postId,
            INSERTED.UserID as userId,
            INSERTED.ParentCommentID as parentCommentId,
            INSERTED.Content as content,
            INSERTED.CreatedAt as createdAt
          VALUES (@postId, @userId, @parentCommentId, @content, 0, GETDATE())
        `);

      const comment = result.recordset[0];

      // Lấy thông tin user
      const userResult = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT Username as username, FullName as fullName
          FROM dbo.Users
          WHERE UserID = @userId
        `);

      const fullComment = {
        ...comment,
        ...userResult.recordset[0],
        reactions: 0
      };

      // Create notification if this is a reply
      if (parentCommentId) {
        await notificationService.notifyCommentReply(
          userId,
          parentCommentId,
          userResult.recordset[0].fullName,
          postId
        );
      }

      return fullComment;
    } catch (error) {
      console.error('Error in addComment:', error);
      throw new Error('Failed to add comment');
    }
  }

  // Xóa comment
  async deleteComment(
    commentId: number,
    userId: number
  ): Promise<void> {
    try {
      const pool = await getConnection();

      // Kiểm tra quyền sở hữu comment HOẶC là chủ bài viết
      const checkResult = await pool.request()
        .input('commentId', sql.Int, commentId)
        .input('userId', sql.Int, userId)
        .query(`
          SELECT c.CommentID 
          FROM dbo.Comments c
          LEFT JOIN dbo.Posts p ON c.PostID = p.PostID
          WHERE c.CommentID = @commentId 
            AND (c.UserID = @userId OR p.UserID = @userId)
        `);

      if (checkResult.recordset.length === 0) {
        throw new Error('Unauthorized to delete this comment');
      }

      // Lấy tất cả reply comments (child comments)
      const repliesResult = await pool.request()
        .input('commentId', sql.Int, commentId)
        .query(`
          SELECT CommentID 
          FROM dbo.Comments 
          WHERE ParentCommentID = @commentId
        `);

      const replyIds = repliesResult.recordset.map(r => r.CommentID);
      const allCommentIds = [commentId, ...replyIds];

      // Xóa theo cascade cho tất cả comments (parent + replies)
      for (const id of allCommentIds) {
        // 1. Xóa lịch sử sửa comment
        await pool.request()
          .input('commentId', sql.Int, id)
          .query(`
            DELETE FROM dbo.CommentEditHistory 
            WHERE CommentID = @commentId
          `);

        // 2. Xóa notifications
        await pool.request()
          .input('commentId', sql.Int, id)
          .query(`
            DELETE FROM dbo.Notifications 
            WHERE SourceID = @commentId 
              AND Type IN ('NewComment', 'CommentReply')
          `);

        // 3. Xóa reports
        await pool.request()
          .input('commentId', sql.Int, id)
          .query(`
            DELETE FROM dbo.Reports 
            WHERE TargetID = @commentId AND TargetType = 'Comment'
          `);

        // 4. Xóa reactions
        await pool.request()
          .input('commentId', sql.Int, id)
          .query(`
            DELETE FROM dbo.Reactions 
            WHERE TargetID = @commentId AND TargetType = 'Comment'
          `);
      }

      // 5. Xóa tất cả reply comments trước
      if (replyIds.length > 0) {
        await pool.request()
          .input('commentId', sql.Int, commentId)
          .query(`
            DELETE FROM dbo.Comments 
            WHERE ParentCommentID = @commentId
          `);
      }

      // 6. Xóa comment chính
      await pool.request()
        .input('commentId', sql.Int, commentId)
        .query(`
          DELETE FROM dbo.Comments 
          WHERE CommentID = @commentId
        `);
    } catch (error) {
      console.error('Error in deleteComment:', error);
      throw error;
    }
  }

  // Cập nhật comment
  async updateComment(
    commentId: number,
    userId: number,
    content: string
  ): Promise<Comment> {
    try {
      const pool = await getConnection();

      // Kiểm tra quyền sở hữu
      const checkResult = await pool.request()
        .input('commentId', sql.Int, commentId)
        .input('userId', sql.Int, userId)
        .query(`
          SELECT CommentID, Content 
          FROM dbo.Comments 
          WHERE CommentID = @commentId AND UserID = @userId
        `);

      if (checkResult.recordset.length === 0) {
        throw new Error('Unauthorized to update this comment');
      }

      const oldContent = checkResult.recordset[0].Content;

      // Lưu lịch sử sửa vào CommentEditHistory
      await pool.request()
        .input('commentId', sql.Int, commentId)
        .input('userId', sql.Int, userId)
        .input('oldContent', sql.NVarChar(sql.MAX), oldContent)
        .query(`
          INSERT INTO dbo.CommentEditHistory (CommentID, UserID, OldContent, EditedAt)
          VALUES (@commentId, @userId, @oldContent, GETDATE())
        `);

      // Cập nhật comment
      const result = await pool.request()
        .input('commentId', sql.Int, commentId)
        .input('content', sql.NVarChar(sql.MAX), content)
        .query(`
          UPDATE dbo.Comments 
          SET Content = @content
          OUTPUT 
            INSERTED.CommentID as commentId,
            INSERTED.PostID as postId,
            INSERTED.UserID as userId,
            INSERTED.Content as content,
            INSERTED.CreatedAt as createdAt
          WHERE CommentID = @commentId
        `);

      const comment = result.recordset[0];

      // Lấy thông tin user và reactions
      const detailsResult = await pool.request()
        .input('commentId', sql.Int, commentId)
        .input('userId', sql.Int, userId)
        .query(`
          SELECT 
            u.Username as username,
            u.FullName as fullName,
            (SELECT COUNT(*) FROM dbo.Reactions r WHERE r.TargetID = @commentId AND r.TargetType = 'Comment') as reactions
          FROM dbo.Users u
          WHERE u.UserID = @userId
        `);

      return {
        ...comment,
        ...detailsResult.recordset[0]
      };
    } catch (error) {
      console.error('Error in updateComment:', error);
      throw error;
    }
  }

  // Lấy lịch sử sửa comment
  async getCommentEditHistory(commentId: number): Promise<any[]> {
    try {
      const pool = await getConnection();

      const result = await pool.request()
        .input('commentId', sql.Int, commentId)
        .query(`
          SELECT 
            h.EditHistoryID as editHistoryId,
            h.OldContent as oldContent,
            h.EditedAt as editedAt,
            u.FullName as editedByName
          FROM dbo.CommentEditHistory h
          INNER JOIN dbo.Users u ON h.UserID = u.UserID
          WHERE h.CommentID = @commentId
          ORDER BY h.EditedAt DESC
        `);

      return result.recordset;
    } catch (error) {
      console.error('Error in getCommentEditHistory:', error);
      throw new Error('Failed to get comment edit history');
    }
  }
}

export default new CommentService();
