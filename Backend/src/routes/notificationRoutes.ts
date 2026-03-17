import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.get('/', authenticate, notificationController.getNotifications);
router.get('/unread-count', authenticate, notificationController.getUnreadCount);
router.put('/:id/read', authenticate, notificationController.markAsRead);
router.put('/read-all', authenticate, notificationController.markAllAsRead);

export default router;
