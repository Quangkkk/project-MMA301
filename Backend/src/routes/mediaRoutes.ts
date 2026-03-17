import express from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/authMiddleware';
import mediaService from '../services/mediaService';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Maximum 10 files
  },
  fileFilter: (_req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

// POST /api/media/upload - Upload multiple images
router.post('/upload', authenticate, upload.array('images', 10), async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const files = req.files as Express.Multer.File[];

    console.log('📸 Upload request received');
    console.log('User ID:', userId);
    console.log('Files count:', files?.length || 0);

    if (!files || files.length === 0) {
      console.log('❌ No files in request');
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    console.log('📁 Files details:', files.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype })));

    // Upload images
    const uploadedMedia = await mediaService.uploadImages(
      files.map(file => ({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      })),
      userId,
      'student_forum/posts'
    );

    console.log('✅ Upload successful:', uploadedMedia.length, 'images');

    return res.status(200).json({
      success: true,
      data: uploadedMedia.map(media => ({
        mediaId: media.MediaID,
        url: media.FilePath,
        fileName: media.OriginalFileName
      })),
      message: 'Images uploaded successfully'
    });
  } catch (error: any) {
    console.error('❌ Error uploading images:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload images'
    });
  }
});

// GET /api/media/entity/:entityType/:entityId - Get media by entity
router.get('/entity/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const media = await mediaService.getMediaByEntity(entityType, parseInt(entityId));

    return res.status(200).json({
      success: true,
      data: media
    });
  } catch (error: any) {
    console.error('Error getting media:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get media'
    });
  }
});

// DELETE /api/media/:mediaId - Delete media
router.delete('/:mediaId', authenticate, async (req, res) => {
  try {
    const mediaId = parseInt(req.params.mediaId);

    await mediaService.deleteMedia(mediaId);

    return res.status(200).json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting media:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete media'
    });
  }
});

export default router;
