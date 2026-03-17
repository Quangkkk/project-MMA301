export interface Notification {
  NotificationID: number;
  UserID: number;
  SourceID: number;
  Type: string; // 'NewComment', 'NewReaction', 'BadgeEarned', 'NewFollower'
  Message: string;
  IsRead: boolean;
  CreatedAt: Date;
}

export interface CreateNotificationDTO {
  UserID: number;
  SourceID: number;
  Type: string;
  Message: string;
}

export interface UpdateNotificationDTO {
  IsRead: boolean;
}
