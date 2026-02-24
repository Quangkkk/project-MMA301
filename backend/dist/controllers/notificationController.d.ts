import { Request, Response } from 'express';
export declare const notificationController: {
    /**
     * Get notifications for current user
     */
    getNotifications(req: Request, res: Response): Promise<any>;
    /**
     * Get unread count
     */
    getUnreadCount(req: Request, res: Response): Promise<any>;
    /**
     * Mark notification as read
     */
    markAsRead(req: Request, res: Response): Promise<any>;
    /**
     * Mark all notifications as read
     */
    markAllAsRead(req: Request, res: Response): Promise<any>;
};
//# sourceMappingURL=notificationController.d.ts.map