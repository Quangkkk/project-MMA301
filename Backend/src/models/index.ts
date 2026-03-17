// Export all models
export * from './User';
export * from './Post';
export * from './Comment';
export * from './Tag';
export * from './Reaction';
export * from './Report';
export * from './Warning';
export * from './UserBan';
export * from './Notification';
export * from './Follow';
export * from './Conversation';
export * from './Message';
export * from './Media';

// Common types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
