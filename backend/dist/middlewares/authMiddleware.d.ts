import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../types/auth.types';
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
/**
 * Middleware xác thực JWT token
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Optional authentication - không bắt buộc token nhưng nếu có thì verify
 */
export declare const optionalAuthenticate: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware kiểm tra quyền Admin
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware kiểm tra quyền User (hoặc Admin)
 */
export declare const requireUser: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional authentication - không bắt buộc phải đăng nhập
 * Nhưng nếu có token thì sẽ verify và gắn user info vào request
 */
export declare const optionalAuth: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=authMiddleware.d.ts.map