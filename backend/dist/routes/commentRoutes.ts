import { Router } from 'express';
import {
  getComments,
  addComment,
  deleteComment,
  updateComment,
  getCommentEditHistory
} from '../controllers/commentController';
import { authenticate, optionalAuthenticate } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/comments/post/:postId - Lấy comments của post (optional auth)
router.get('/post/:postId', optionalAuthenticate, getComments);

// POST /api/comments/post/:postId - Thêm comment (cần auth)
router.post('/post/:postId', authenticate, addComment);

// PUT /api/comments/:commentId - Cập nhật comment (cần auth)
router.put('/:commentId', authenticate, updateComment);

// DELETE /api/comments/:commentId - Xóa comment (cần auth)
router.delete('/:commentId', authenticate, deleteComment);

// GET /api/comments/:commentId/history - Lấy lịch sử sửa comment
router.get('/:commentId/history', getCommentEditHistory);

export default router;
