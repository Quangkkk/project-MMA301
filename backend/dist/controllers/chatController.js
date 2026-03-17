"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chatService_1 = __importDefault(require("../services/chatService"));
class ChatController {
    // GET /api/chat/conversations - Lấy tất cả conversations của user
    async getConversations(req, res) {
        try {
            const userId = req.user.userId;
            const conversations = await chatService_1.default.getUserConversations(userId);
            res.json({
                success: true,
                data: conversations
            });
        }
        catch (error) {
            console.error('Error in getConversations:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get conversations'
            });
        }
    }
    // POST /api/chat/conversations - Tạo hoặc lấy conversation với user khác
    async createOrGetConversation(req, res) {
        try {
            const userId = req.user.userId;
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
            const conversation = await chatService_1.default.getOrCreateConversation(userId, otherUserId);
            res.json({
                success: true,
                data: conversation
            });
        }
        catch (error) {
            console.error('Error in createOrGetConversation:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create conversation'
            });
        }
    }
    // GET /api/chat/conversations/:conversationId/messages - Lấy messages
    async getMessages(req, res) {
        try {
            const userId = req.user.userId;
            const conversationId = parseInt(req.params.conversationId);
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            if (!conversationId) {
                return res.status(400).json({
                    success: false,
                    message: 'conversationId is required'
                });
            }
            const messages = await chatService_1.default.getMessages(conversationId, userId, limit, offset);
            res.json({
                success: true,
                data: messages
            });
        }
        catch (error) {
            console.error('Error in getMessages:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get messages'
            });
        }
    }
    // POST /api/chat/conversations/:conversationId/messages - Gửi message
    async sendMessage(req, res) {
        try {
            const userId = req.user.userId;
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
            const message = await chatService_1.default.sendMessage(conversationId, userId, content, attachmentURL);
            res.status(201).json({
                success: true,
                data: message
            });
        }
        catch (error) {
            console.error('Error in sendMessage:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to send message'
            });
        }
    }
    // PUT /api/chat/conversations/:conversationId/read - Đánh dấu đã đọc
    async markAsRead(req, res) {
        try {
            const userId = req.user.userId;
            const conversationId = parseInt(req.params.conversationId);
            if (!conversationId) {
                return res.status(400).json({
                    success: false,
                    message: 'conversationId is required'
                });
            }
            await chatService_1.default.markMessagesAsRead(conversationId, userId);
            res.json({
                success: true,
                message: 'Messages marked as read'
            });
        }
        catch (error) {
            console.error('Error in markAsRead:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to mark messages as read'
            });
        }
    }
}
exports.default = new ChatController();
//# sourceMappingURL=chatController.js.map