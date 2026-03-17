export interface Warning {
  WarningID: number;
  UserID: number;
  ReportID?: number;
  AdminID: number;
  WarningReason: string;
  ActionTaken: 'Warning' | 'TemporaryBan' | 'PermanentBan';
  Severity: 1 | 2 | 3; // 1: Nhẹ, 2: Trung bình, 3: Nghiêm trọng
  IsActive: boolean;
  CreatedAt: Date;
  
  // Join fields (optional)
  UserName?: string;
  UserFullName?: string;
  AdminName?: string;
  ReportReason?: string;
}

export interface CreateWarningRequest {
  UserID: number;
  ReportID?: number;
  WarningReason: string;
  ActionTaken: 'Warning' | 'TemporaryBan' | 'PermanentBan';
  Severity: 1 | 2 | 3;
}

export interface UpdateWarningRequest {
  IsActive?: boolean;
}
