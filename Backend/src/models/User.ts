export interface User {
  UserID: number;
  Username: string;
  PasswordHash: string;
  Email: string;
  FullName: string;
  PhoneNumber: string | null;
  Address: string | null;
  Bio: string | null;
  DateOfBirth: Date | null;
  Role: 'Admin' | 'User';
  UserStatus: 0 | 1; // 0: Inactive, 1: Active
  IsVerify: boolean;
  VerificationToken: string | null;
  VerificationTokenExpiry: Date | null;
  ResetPasswordOTP: string | null;
  ResetPasswordOTPExpiry: Date | null;
  CreatedAt: Date;
}

// Extended User with Avatar from JOIN query
export interface UserWithAvatar extends User {
  AvatarURL?: string | null;
}

export interface CreateUserDTO {
  Username: string;
  PasswordHash: string;
  Email: string;
  FullName: string;
  PhoneNumber?: string;
  Address?: string;
  Bio?: string;
  DateOfBirth?: Date;
  Role?: 'Admin' | 'User';
}

export interface UpdateUserDTO {
  FullName?: string;
  Email?: string;
  PhoneNumber?: string;
  Address?: string;
  Bio?: string;
  DateOfBirth?: Date;
}

export interface UserResponse {
  UserID: number;
  Username: string;
  Email: string;
  FullName: string;
  PhoneNumber: string | null;
  Address: string | null;
  Bio: string | null;
  DateOfBirth: Date | null;
  Role: string;
  UserStatus: number;
  IsVerify: boolean;
  CreatedAt: Date;
}
