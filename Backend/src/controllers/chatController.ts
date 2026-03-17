import { Request, Response } from 'express';
import chatService from '../services/chatService';

class ChatController {
  // GET /api/chat/conversations - Lấy tất cả conversations của user
  async getConversations(req: Request, res: Response): Promise<any> {
    try {
      const userId = (req as any).user.userId;

      const conversations = await chatService.getUserConversations(userId);

      res.json({
        success: true,
        data: conversations
      });
    } catch (error: any) {
      console.error('Error in getConversations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get conversations'
      });
    }
  }

  // POST /api/chat/conversations - Tạo hoặc lấy conversation với user khác
  async createOrGetConversation(req: Request, res: Response): Promise<any> {
    try {
      const userId = (req as any).user.userId;
      const { otherUserId } = req.body;

      if (!otherUserId) {
        return res.status(400).json({
          success: false,
          message: 'otherUserId is required'
        });
      }

      if (otherUserId === userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create conversation with yourself'
        });
      }

      const conversation = await chatService.getOrCreateConversation(userId, otherUserId);

      res.json({
        success: true,
        data: conversation
      });
    } catch (error: any) {
      console.error('Error in createOrGetConversation:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create conversation'
      });
    }
  }

  // GET /api/chat/conversations/:conversationId/messages - Lấy messages
  async getMessages(req: Request, res: Response): Promise<any> {
    try {
      const userId = (req as any).user.userId;
      const conversationId = parseInt(req.params.conversationId);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: 'conversationId is required'
        });
      }

      const messages = await chatService.getMessages(conversationId, userId, limit, offset);

      res.json({
        success: true,
        data: messages
      });
    } catch (error: any) {
      console.error('Error in getMessages:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get messages'
      });
    }
  }

  // POST /api/chat/conversations/:conversationId/messages - Gửi message
  async sendMessage(req: Request, res: Response): Promise<any> {
    try {
      const userId = (req as any).user.userId;
      const conversationId = parseInt(req.params.conversationId);
      const { content, attachmentURL } = req.body;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: 'conversationId is required'
        });
      }

      if (!content || content.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'content is required'
        });
      }

      const message = await chatService.sendMessage(conversationId, userId, content, attachmentURL);

      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error: any) {
      console.error('Error in sendMessage:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send message'
      });
    }
  }

  // PUT /api/chat/conversations/:conversationId/read - Đánh dấu đã đọc
  async markAsRead(req: Request, res: Response): Promise<any> {
    try {
      const userId = (req as any).user.userId;
      const conversationId = parseInt(req.params.conversationId);

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: 'conversationId is required'
        });
      }

      await chatService.markMessagesAsRead(conversationId, userId);

      res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error: any) {
      console.error('Error in markAsRead:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark messages as read'
      });
    }
  }
}

export default new ChatController();
