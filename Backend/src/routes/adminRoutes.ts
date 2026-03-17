import express from 'express';
import { adminController } from '../controllers/adminController';
import { userManagementController } from '../controllers/userManagementController';
import { reportManagementController } from '../controllers/reportManagementController';
import { warningController } from '../controllers/warningController';
import { userBanController } from '../controllers/userBanController';
import { getUserDetails } from '../controllers/adminUserController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

// Middleware kiểm tra role Admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

// Admin dashboard routes
router.get('/dashboard/stats', authenticate, requireAdmin, adminController.getDashboardStats);
router.get('/recent-activities', authenticate, requireAdmin, adminController.getRecentActivities);

// User management routes
router.get('/users', authenticate, requireAdmin, userManagementController.getAllUsers);
router.get('/users/:userId/details', authenticate, requireAdmin, getUserDetails);
router.put('/users/:userId/ban', authenticate, requireAdmin, userManagementController.banUser);
router.put('/users/:userId/unban', authenticate, requireAdmin, userManagementController.unbanUser);
router.delete('/users/:userId', authenticate, requireAdmin, userManagementController.deleteUser);
router.get('/users/:userId/stats', authenticate, requireAdmin, userManagementController.getUserStats);

// Report management routes
router.get('/reports', authenticate, requireAdmin, reportManagementController.getAllReports);
router.get('/reports/stats', authenticate, requireAdmin, reportManagementController.getReportStats);
router.get('/reports/:reportId', authenticate, requireAdmin, reportManagementController.getReportById);
router.put('/reports/:reportId/resolve', authenticate, requireAdmin, reportManagementController.resolveReport);

// Warning management routes
router.post('/warnings', authenticate, requireAdmin, warningController.createWarning);
router.get('/warnings', authenticate, requireAdmin, warningController.getAllWarnings);
router.get('/warnings/user/:userId', authenticate, requireAdmin, warningController.getUserWarnings);
router.put('/warnings/:warningId/deactivate', authenticate, requireAdmin, warningController.deactivateWarning);

// Ban management routes
router.post('/bans', authenticate, requireAdmin, userBanController.createBan);
router.get('/bans', authenticate, requireAdmin, userBanController.getAllBans);
router.get('/bans/user/:userId', authenticate, requireAdmin, userBanController.getUserBans);
router.get('/bans/check/:userId', authenticate, requireAdmin, userBanController.checkUserBans);
router.put('/bans/:banId', authenticate, requireAdmin, userBanController.updateBan);
router.put('/bans/:banId/revoke', authenticate, requireAdmin, userBanController.revokeBan);

export default router;
