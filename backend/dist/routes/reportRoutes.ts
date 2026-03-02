import express from 'express';
import { reportController } from '../controllers/reportController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

// Tất cả routes đều cần authentication
router.post('/', authenticate, reportController.createReport);
router.get('/my-reports', authenticate, reportController.getMyReports);
router.get('/', authenticate, reportController.getAllReports);
router.put('/:reportID/status', authenticate, reportController.updateReportStatus);
router.get('/:targetType/:targetID', authenticate, reportController.getReportsByTarget);

export default router;
