import { getConnection } from '../config/database';
import sql from 'mssql';

export interface Reaction {
  reactionId: number;
  userId: number;
  targetId: number;
  targetType: 'Post' | 'Comment';
  reactionType: 'Like' | 'Love' | 'Haha' | 'Wow' | 'Sad' | 'Angry';
  createdAt: Date;
}

export interface ReactionSummary {
  targetId: number;
  targetType: string;
  reactions: {
    type: string;
    count: number;
  }[];
  userReaction?: string;
}

class ReactionService {
  // Thêm hoặc cập nhật reaction
  async addReaction(
    userId: number,
    targetId: number,
    targetType: 'Post' | 'Comment',
    reactionType: string
  ): Promise<Reaction> {
    try {
      const pool = await getConnection();

      // Kiểm tra xem user đã react chưa
      const existingReaction = await pool.request()
        .input('userId', sql.Int, userId)
        .input('targetId', sql.Int, targetId)
        .input('targetType', sql.VarChar(50), targetType)
        .query(`
          SELECT ReactionID, ReactionType 
          FROM dbo.Reactions 
          WHERE UserID = @userId 
            AND TargetID = @targetId 
            AND TargetType = @targetType
        `);

      if (existingReaction.recordset.length > 0) {
        // Nếu reaction type giống nhau thì xóa (unlike)
        if (existingReaction.recordset[0].ReactionType === reactionType) {
          await pool.request()
            .input('reactionId', sql.Int, existingReaction.recordset[0].ReactionID)
            .query('DELETE FROM dbo.Reactions WHERE ReactionID = @reactionId');
          
          throw new Error('REACTION_REMOVED');
        } else {
          // Cập nhật reaction type mới
          await pool.request()
            .input('reactionId', sql.Int, existingReaction.recordset[0].ReactionID)
            .input('reactionType', sql.VarChar(50), reactionType)
            .query(`
              UPDATE dbo.Reactions 
              SET ReactionType = @reactionType, CreatedAt = GETDATE()
              WHERE ReactionID = @reactionId
            `);

          const result = await pool.request()
            .input('reactionId', sql.Int, existingReaction.recordset[0].ReactionID)
            .query('SELECT * FROM dbo.Reactions WHERE ReactionID = @reactionId');

          return this.mapReaction(result.recordset[0]);
        }
      }

      // Thêm reaction mới
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('targetId', sql.Int, targetId)
        .input('targetType', sql.VarChar(50), targetType)
        .input('reactionType', sql.VarChar(50), reactionType)
        .query(`
          INSERT INTO dbo.Reactions (UserID, TargetID, TargetType, ReactionType, CreatedAt)
          OUTPUT INSERTED.*
          VALUES (@userId, @targetId, @targetType, @reactionType, GETDATE())
        `);

      return this.mapReaction(result.recordset[0]);
    } catch (error: any) {
      if (error.message === 'REACTION_REMOVED') {
        throw error;
      }
      console.error('Error in addReaction:', error);
      throw new Error('Failed to add reaction');
    }
  }

  // Xóa reaction
  async removeReaction(
    userId: number,
    targetId: number,
    targetType: 'Post' | 'Comment'
  ): Promise<void> {
    try {
      const pool = await getConnection();

      await pool.request()
        .input('userId', sql.Int, userId)
        .input('targetId', sql.Int, targetId)
        .input('targetType', sql.VarChar(50), targetType)
        .query(`
          DELETE FROM dbo.Reactions 
          WHERE UserID = @userId 
            AND TargetID = @targetId 
            AND TargetType = @targetType
        `);
    } catch (error) {
      console.error('Error in removeReaction:', error);
      throw new Error('Failed to remove reaction');
    }
  }

  // Lấy tổng hợp reactions cho một target
  async getReactionSummary(
    targetId: number,
    targetType: 'Post' | 'Comment',
    userId?: number
  ): Promise<ReactionSummary> {
    try {
      const pool = await getConnection();

      // Đếm reactions theo type
      const reactionsResult = await pool.request()
        .input('targetId', sql.Int, targetId)
        .input('targetType', sql.VarChar(50), targetType)
        .query(`
          SELECT 
            ReactionType as type,
            COUNT(*) as count
          FROM dbo.Reactions
          WHERE TargetID = @targetId AND TargetType = @targetType
          GROUP BY ReactionType
        `);

      let userReaction = undefined;
      if (userId) {
        const userReactionResult = await pool.request()
          .input('userId', sql.Int, userId)
          .input('targetId', sql.Int, targetId)
          .input('targetType', sql.VarChar(50), targetType)
          .query(`
            SELECT ReactionType
            FROM dbo.Reactions
            WHERE UserID = @userId 
              AND TargetID = @targetId 
              AND TargetType = @targetType
          `);

        if (userReactionResult.recordset.length > 0) {
          userReaction = userReactionResult.recordset[0].ReactionType;
        }
      }

      return {
        targetId,
        targetType,
        reactions: reactionsResult.recordset.map((r: any) => ({
          type: r.type,
          count: r.count
        })),
        userReaction
      };
    } catch (error) {
      console.error('Error in getReactionSummary:', error);
      throw new Error('Failed to get reaction summary');
    }
  }

  // Lấy danh sách users đã react
  async getReactionUsers(
    targetId: number,
    targetType: 'Post' | 'Comment',
    reactionType?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const pool = await getConnection();

      let query = `
        SELECT 
          r.ReactionID as reactionId,
          r.ReactionType as reactionType,
          r.CreatedAt as createdAt,
          u.UserID as userId,
          u.Username as username,
          u.FullName as fullName,
          
        FROM dbo.Reactions r
        INNER JOIN dbo.Users u ON r.UserID = u.UserID
        WHERE r.TargetID = @targetId AND r.TargetType = @targetType
      `;

      const request = pool.request()
        .input('targetId', sql.Int, targetId)
        .input('targetType', sql.VarChar(50), targetType);

      if (reactionType) {
        query += ' AND r.ReactionType = @reactionType';
        request.input('reactionType', sql.VarChar(50), reactionType);
      }

      query += `
        ORDER BY r.CreatedAt DESC
        OFFSET 0 ROWS
        FETCH NEXT @limit ROWS ONLY
      `;

      request.input('limit', sql.Int, limit);

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error in getReactionUsers:', error);
      throw new Error('Failed to get reaction users');
    }
  }

  private mapReaction(row: any): Reaction {
    return {
      reactionId: row.ReactionID,
      userId: row.UserID,
      targetId: row.TargetID,
      targetType: row.TargetType,
      reactionType: row.ReactionType,
      createdAt: row.CreatedAt
    };
  }
}

export default new ReactionService();
