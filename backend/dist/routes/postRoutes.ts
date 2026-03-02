import express from 'express';
import { postController } from '../controllers/postController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

// Public routes (không cần auth)
router.get('/', postController.getPosts);
router.get('/trending', postController.getTrendingPosts);
router.get('/tags/popular', postController.getPopularTags);
router.get('/user/:userId', postController.getUserPosts);

// Protected routes (cần auth)
router.post('/', authenticate, postController.createPost);
router.delete('/:postId', authenticate, postController.deletePost);
router.put('/:postId', authenticate, postController.updatePost);
router.get('/following/:userId', authenticate, postController.getFollowingPosts);
router.get('/saved/:userId', authenticate, postController.getSavedPosts);
router.get('/users/:userId/stats', authenticate, postController.getUserStats);

export default router;
