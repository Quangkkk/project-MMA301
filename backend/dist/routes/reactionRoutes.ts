import { Router } from 'express';
import {
  addReaction,
  removeReaction,
  getReactionSummary,
  getReactionUsers
} from '../controllers/reactionController';
import { authenticate, optionalAuthenticate } from '../middlewares/authMiddleware';

const router = Router();

// POST /api/reactions - Thêm/cập nhật reaction (cần auth)
router.post('/', authenticate, addReaction);

// DELETE /api/reactions/:targetType/:targetId - Xóa reaction (cần auth)
router.delete('/:targetType/:targetId', authenticate, removeReaction);

// GET /api/reactions/:targetType/:targetId/summary - Lấy tổng hợp reactions (optional auth)
router.get('/:targetType/:targetId/summary', optionalAuthenticate, getReactionSummary);

// GET /api/reactions/:targetType/:targetId/users - Lấy danh sách users đã react
router.get('/:targetType/:targetId/users', getReactionUsers);

export default router;
