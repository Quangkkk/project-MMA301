"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireUser = exports.requireAdmin = exports.optionalAuthenticate = exports.authenticate = void 0;
const authService_1 = require("../services/authService");
/**
 * Middleware xác thực JWT token
 */
const authenticate = async (req, res, next) => {
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
        const payload = authService_1.authService.verifyToken(token);
        // Attach user info to request
        req.user = payload;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            message: error.message || 'Token không hợp lệ hoặc đã hết hạn'
        });
    }
};
exports.authenticate = authenticate;
/**
 * Optional authentication - không bắt buộc token nhưng nếu có thì verify
 */
const optionalAuthenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = authService_1.authService.verifyToken(token);
            req.user = payload;
        }
        next();
    }
    catch (error) {
        // Nếu token không hợp lệ, bỏ qua và tiếp tục (không có user info)
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
/**
 * Middleware kiểm tra quyền Admin
 */
const requireAdmin = (req, res, next) => {
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
exports.requireAdmin = requireAdmin;
/**
 * Middleware kiểm tra quyền User (hoặc Admin)
 */
const requireUser = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
        return;
    }
    next();
};
exports.requireUser = requireUser;
/**
 * Optional authentication - không bắt buộc phải đăng nhập
 * Nhưng nếu có token thì sẽ verify và gắn user info vào request
 */
const optionalAuth = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = authService_1.authService.verifyToken(token);
            req.user = payload;
        }
        next();
    }
    catch (error) {
        // Ignore authentication errors for optional auth
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=authMiddleware.js.map