import sql from 'mssql';
import { getConnection } from '../config/database';
import { Conversation, Message } from '../models';

class ChatService {
  // Tạo hoặc lấy conversation giữa 2 users
  async getOrCreateConversation(user1Id: number, user2Id: number): Promise<Conversation> {
    try {
      const pool = await getConnection();
      
      // Đảm bảo User1ID < User2ID theo constraint
      const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

      // Kiểm tra conversation đã tồn tại chưa
      const existingResult = await pool.request()
        .input('user1Id', sql.Int, smallerId)
        .input('user2Id', sql.Int, largerId)
        .query(`
          SELECT ConversationID, User1ID, User2ID, CreatedAt, LastMessageAt
          FROM dbo.Conversations
          WHERE User1ID = @user1Id AND User2ID = @user2Id
        `);

      if (existingResult.recordset.length > 0) {
        return existingResult.recordset[0];
      }

      // Tạo conversation mới
      const result = await pool.request()
        .input('user1Id', sql.Int, smallerId)
        .input('user2Id', sql.Int, largerId)
        .query(`
          INSERT INTO dbo.Conversations (User1ID, User2ID, CreatedAt)
          OUTPUT 
            INSERTED.ConversationID,
            INSERTED.User1ID,
            INSERTED.User2ID,
            INSERTED.CreatedAt,
            INSERTED.LastMessageAt
          VALUES (@user1Id, @user2Id, GETDATE())
        `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      throw new Error('Failed to get or create conversation');
    }
  }

  // Lấy tất cả conversations của user
  async getUserConversations(userId: number): Promise<any[]> {
    try {
      const pool = await getConnection();

      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT 
            c.ConversationID,
            c.User1ID,
            c.User2ID,
            c.CreatedAt,
            c.LastMessageAt,
            -- Thông tin user khác (người chat cùng)
            CASE 
              WHEN c.User1ID = @userId THEN u2.UserID
              ELSE u1.UserID
            END as OtherUserID,
            CASE 
              WHEN c.User1ID = @userId THEN u2.Username
              ELSE u1.Username
            END as OtherUsername,
            CASE 
              WHEN c.User1ID = @userId THEN u2.FullName
              ELSE u1.FullName
            END as OtherFullName,
            CASE 
              WHEN c.User1ID = @userId THEN m2.FilePath
              ELSE m1.FilePath
            END as OtherAvatarURL,
            -- Last message
            (SELECT TOP 1 Content FROM dbo.Messages 
             WHERE ConversationID = c.ConversationID 
             ORDER BY CreatedAt DESC) as LastMessage,
            -- Unread count
            (SELECT COUNT(*) FROM dbo.Messages 
             WHERE ConversationID = c.ConversationID 
             AND SenderID != @userId 
             AND IsRead = 0) as UnreadCount
          FROM dbo.Conversations c
          INNER JOIN dbo.Users u1 ON c.User1ID = u1.UserID
          INNER JOIN dbo.Users u2 ON c.User2ID = u2.UserID
          LEFT JOIN dbo.Media_Entity_Mapping mem1 ON mem1.EntityType = 'User' AND mem1.EntityID = u1.UserID AND mem1.MediaType = 'avatar'
          LEFT JOIN dbo.Media m1 ON m1.MediaID = mem1.MediaID AND m1.IsActive = 1
          LEFT JOIN dbo.Media_Entity_Mapping mem2 ON mem2.EntityType = 'User' AND mem2.EntityID = u2.UserID AND mem2.MediaType = 'avatar'
          LEFT JOIN dbo.Media m2 ON m2.MediaID = mem2.MediaID AND m2.IsActive = 1
          WHERE c.User1ID = @userId OR c.User2ID = @userId
          ORDER BY c.LastMessageAt DESC, c.CreatedAt DESC
        `);

      return result.recordset;
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      throw new Error('Failed to get user conversations');
    }
  }

  // Gửi tin nhắn
  async sendMessage(conversationId: number, senderId: number, content: string, attachmentURL?: string): Promise<Message> {
    try {
      const pool = await getConnection();

      // Kiểm tra conversation tồn tại và user có quyền gửi
      const checkResult = await pool.request()
        .input('conversationId', sql.Int, conversationId)
        .input('senderId', sql.Int, senderId)
        .query(`
          SELECT ConversationID 
          FROM dbo.Conversations 
          WHERE ConversationID = @conversationId 
          AND (User1ID = @senderId OR User2ID = @senderId)
        `);

      if (checkResult.recordset.length === 0) {
        throw new Error('Conversation not found or unauthorized');
      }

      // Insert message
      const result = await pool.request()
        .input('conversationId', sql.Int, conversationId)
        .input('senderId', sql.Int, senderId)
        .input('content', sql.NVarChar(sql.MAX), content)
        .input('attachmentURL', sql.NVarChar(255), attachmentURL || null)
        .query(`
          INSERT INTO dbo.Messages (ConversationID, SenderID, Content, AttachmentURL, IsRead, CreatedAt)
          OUTPUT 
            INSERTED.MessageID,
            INSERTED.ConversationID,
            INSERTED.SenderID,
            INSERTED.Content,
            INSERTED.AttachmentURL,
            INSERTED.IsRead,
            INSERTED.CreatedAt
          VALUES (@conversationId, @senderId, @content, @attachmentURL, 0, GETDATE())
        `);

      // Update LastMessageAt trong Conversations
      await pool.request()
        .input('conversationId', sql.Int, conversationId)
        .query(`
          UPDATE dbo.Conversations 
          SET LastMessageAt = GETDATE() 
          WHERE ConversationID = @conversationId
        `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw new Error('Failed to send message');
    }
  }

  // Lấy tất cả messages trong conversation
  async getMessages(conversationId: number, userId: number, limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const pool = await getConnection();

      // Kiểm tra user có quyền xem conversation
      const checkResult = await pool.request()
        .input('conversationId', sql.Int, conversationId)
        .input('userId', sql.Int, userId)
        .query(`
          SELECT ConversationID 
          FROM dbo.Conversations 
          WHERE ConversationID = @conversationId 
          AND (User1ID = @userId OR User2ID = @userId)
        `);

      if (checkResult.recordset.length === 0) {
        throw new Error('Conversation not found or unauthorized');
      }

      // Lấy messages
      const result = await pool.request()
        .input('conversationId', sql.Int, conversationId)
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT 
            m.MessageID,
            m.ConversationID,
            m.SenderID,
            m.Content,
            m.AttachmentURL,
            m.IsRead,
            m.CreatedAt,
            u.Username as SenderUsername,
            u.FullName as SenderFullName
          FROM dbo.Messages m
          INNER JOIN dbo.Users u ON m.SenderID = u.UserID
          WHERE m.ConversationID = @conversationId
          ORDER BY m.CreatedAt DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);

      return result.recordset.reverse(); // Reverse để tin nhắn cũ ở trên
    } catch (error) {
      console.error('Error in getMessages:', error);
      throw new Error('Failed to get messages');
    }
  }

  // Đánh dấu tin nhắn đã đọc
  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    try {
      const pool = await getConnection();

      await pool.request()
        .input('conversationId', sql.Int, conversationId)
        .input('userId', sql.Int, userId)
        .query(`
          UPDATE dbo.Messages 
          SET IsRead = 1 
          WHERE ConversationID = @conversationId 
          AND SenderID != @userId 
          AND IsRead = 0
        `);
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      throw new Error('Failed to mark messages as read');
    }
  }
}

export default new ChatService();
