// ===========================
// AUTH TYPES
// ===========================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'User';
  avatarURL: string | null;
  token: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: AuthResponse;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    userId: number;
    username: string;
    email: string;
    fullName: string;
  };
}

export interface User {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'User';
  avatarURL: string | null;
}
