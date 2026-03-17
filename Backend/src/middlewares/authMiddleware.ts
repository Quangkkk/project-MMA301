import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { JWTPayload } from '../types/auth.types';

// Extend Express Request type to include user
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
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Không tìm thấy token. Vui lòng đăng nhập.'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = authService.verifyToken(token);

    // Attach user info to request
    req.user = payload;

    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Token không hợp lệ hoặc đã hết hạn'
    });
  }
};

/**
 * Optional authentication - không bắt buộc token nhưng nếu có thì verify
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // Nếu token không hợp lệ, bỏ qua và tiếp tục (không có user info)
    next();
  }
};

/**
 * Middleware kiểm tra quyền Admin
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
    return;
  }

  if (req.user.role !== 'Admin') {
    res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập tài nguyên này. Chỉ Admin mới được phép.'
    });
    return;
  }

  next();
};

/**
 * Middleware kiểm tra quyền User (hoặc Admin)
 */
export const requireUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
    return;
  }

  next();
};

/**
 * Optional authentication - không bắt buộc phải đăng nhập
 * Nhưng nếu có token thì sẽ verify và gắn user info vào request
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};
