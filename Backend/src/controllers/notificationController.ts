import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';

export const notificationController = {
  /**
   * Get notifications for current user
   */
  async getNotifications(req: Request, res: Response): Promise<any> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const notifications = await notificationService.getUserNotifications(userId, limit);

      return res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * Get unread count
   */
  async getUnreadCount(req: Request, res: Response): Promise<any> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const count = await notificationService.getUnreadCount(userId);

      return res.status(200).json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(req: Request, res: Response): Promise<any> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const notificationId = parseInt(req.params.id);
      await notificationService.markAsRead(notificationId, userId);

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req: Request, res: Response): Promise<any> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      await notificationService.markAllAsRead(userId);

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};
