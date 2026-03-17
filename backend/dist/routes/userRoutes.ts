import express from 'express';
import multer from 'multer';
import { userController } from '../controllers/userController';
import { userBanController } from '../controllers/userBanController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

// Configure multer for avatar upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

// Profile routes
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.post('/profile/avatar', authenticate, upload.single('avatar'), userController.uploadAvatar);

// All routes require authentication
router.get('/:userId/following/:targetUserId', authenticate, userController.checkFollowStatus);
router.post('/:userId/follow/:targetUserId', authenticate, userController.followUser);
router.delete('/:userId/follow/:targetUserId', authenticate, userController.unfollowUser);

// Check own active bans (for modal notification)
router.get('/bans/my-active', authenticate, userBanController.getMyActiveBans);

export default router;
