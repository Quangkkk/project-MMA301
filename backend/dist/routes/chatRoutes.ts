import { Router } from 'express';
import chatController from '../controllers/chatController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Tất cả routes đều cần authentication
router.use(authenticate);

// GET /api/chat/conversations - Lấy danh sách conversations
router.get('/conversations', chatController.getConversations);

// POST /api/chat/conversations - Tạo hoặc lấy conversation với user khác
router.post('/conversations', chatController.createOrGetConversation);

// GET /api/chat/conversations/:conversationId/messages - Lấy messages
router.get('/conversations/:conversationId/messages', chatController.getMessages);

// POST /api/chat/conversations/:conversationId/messages - Gửi message
router.post('/conversations/:conversationId/messages', chatController.sendMessage);

// PUT /api/chat/conversations/:conversationId/read - Đánh dấu đã đọc
router.put('/conversations/:conversationId/read', chatController.markAsRead);

export default router;
