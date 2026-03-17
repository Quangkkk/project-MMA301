export interface LoginRequestDTO {
    email: string;
    password: string;
}
export interface RegisterRequestDTO {
    username: string;
    email: string;
    password: string;
    fullName: string;
}
export interface AuthResponseDTO {
    userId: number;
    username: string;
    email: string;
    fullName: string;
    role: 'Admin' | 'User';
    token: string;
    refreshToken?: string;
}
export interface LoginResponseDTO {
    success: boolean;
    message: string;
    data?: AuthResponseDTO;
}
export interface RegisterResponseDTO {
    success: boolean;
    message: string;
    data?: {
        userId: number;
        username: string;
        email: string;
        fullName: string;
    };
}
export interface JWTPayload {
    userId: number;
    email: string;
    username: string;
    role: 'Admin' | 'User';
    iat?: number;
    exp?: number;
}
//# sourceMappingURL=auth.types.d.ts.map