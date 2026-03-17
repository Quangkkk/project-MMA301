export interface Report {
  ReportID: number;
  ReporterID: number;
  TargetID: number;
  TargetType: 'Post' | 'Comment' | 'User';
  Reason: string;
  Status: 0 | 1; // 0: Pending, 1: Resolved
  AdminID?: number; // Admin đã xử lý
  AdminResponse?: string; // Phản hồi của admin
  ResolvedAt?: Date; // Thời gian xử lý
  CreatedAt: Date;
}

export interface CreateReportDTO {
  ReporterID: number;
  TargetID: number;
  TargetType: 'Post' | 'Comment' | 'User';
  Reason: string;
}

export interface ReportWithDetails extends Report {
  ReporterUsername: string;
  ReporterFullName: string;
  TargetUsername?: string; // For User target
  TargetFullName?: string; // For User target
  TargetTitle?: string; // For Post
  TargetContent?: string; // For Post/Comment
  TargetDeleted?: boolean; // Whether the target was deleted
  AdminUsername?: string; // Admin đã xử lý
  AdminFullName?: string;
}

export interface ResolveReportRequest {
  AdminResponse: string;
  CreateWarning?: boolean; // Tạo cảnh báo cho user
  CreateBan?: {
    BanType: 'POST' | 'COMMENT' | 'REPORT' | 'FULL';
    DurationHours?: number; // NULL = vĩnh viễn
    BanReason: string;
  };
  WarningDetails?: {
    WarningReason: string;
    ActionTaken: 'Warning' | 'TemporaryBan' | 'PermanentBan';
    Severity: 1 | 2 | 3;
  };
}
