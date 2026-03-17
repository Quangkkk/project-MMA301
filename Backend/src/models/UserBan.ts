export interface UserBan {
  BanID: number;
  UserID: number;
  WarningID?: number;
  AdminID: number;
  BanReason: string;
  BanType: 'POST' | 'COMMENT' | 'REPORT' | 'FULL';
  StartDate: Date;
  EndDate?: Date; // NULL = vĩnh viễn
  IsActive: boolean;
  RevokedBy?: number;
  RevokedAt?: Date;
  CreatedAt: Date;
  
  // Join fields (optional)
  UserName?: string;
  UserFullName?: string;
  AdminName?: string;
  RevokedByName?: string;
}

export interface CreateBanRequest {
  UserID: number;
  WarningID?: number;
  BanReason: string;
  BanType: 'POST' | 'COMMENT' | 'REPORT' | 'FULL';
  DurationHours?: number; // Số giờ cấm (NULL = vĩnh viễn)
}

export interface RevokeBanRequest {
  BanID: number;
}

export interface ActiveBansResponse {
  canPost: boolean;
  canComment: boolean;
  canReport: boolean;
  isFullyBanned: boolean;
  bans: UserBan[];
}
