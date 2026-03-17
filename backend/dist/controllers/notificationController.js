"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = void 0;
const notificationService_1 = require("../services/notificationService");
exports.notificationController = {
    /**
     * Get notifications for current user
     */
    async getNotifications(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const limit = parseInt(req.query.limit) || 20;
            const notifications = await notificationService_1.notificationService.getUserNotifications(userId, limit);
            return res.status(200).json({
                success: true,
                data: notifications
            });
        }
        catch (error) {
            console.error('Error in getNotifications:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },
    /**
     * Get unread count
     */
    async getUnreadCount(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const count = await notificationService_1.notificationService.getUnreadCount(userId);
            return res.status(200).json({
                success: true,
                data: { count }
            });
        }
        catch (error) {
            console.error('Error in getUnreadCount:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },
    /**
     * Mark notification as read
     */
    async markAsRead(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const notificationId = parseInt(req.params.id);
            await notificationService_1.notificationService.markAsRead(notificationId, userId);
            return res.status(200).json({
                success: true,
                message: 'Notification marked as read'
            });
        }
        catch (error) {
            console.error('Error in markAsRead:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },
    /**
     * Mark all notifications as read
     */
    async markAllAsRead(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            await notificationService_1.notificationService.markAllAsRead(userId);
            return res.status(200).json({
                success: true,
                message: 'All notifications marked as read'
            });
        }
        catch (error) {
            console.error('Error in markAllAsRead:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
};
//# sourceMappingURL=notificationController.js.map