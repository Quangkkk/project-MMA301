"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const authService_1 = require("../services/authService");
class AuthController {
    /**
     * @route   POST /api/auth/login
     * @desc    Đăng nhập bằng email và password
     * @access  Public
     */
    async login(req, res) {
        try {
            const loginData = req.body;
            // Validation
            if (!loginData.email || !loginData.password) {
                res.status(400).json({
                    success: false,
                    message: 'Email và mật khẩu là bắt buộc'
                });
                return;
            }
            const result = await authService_1.authService.login(loginData);
            res.status(200).json({
                success: true,
                message: 'Đăng nhập thành công',
                data: result
            });
        }
        catch (error) {
            console.error('Login error:', error);
            // Specific error messages
            const statusCode = error.message.includes('khóa') || error.message.includes('chưa') || error.message.includes('không đúng')
                ? 401
                : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Đã xảy ra lỗi trong quá trình đăng nhập'
            });
        }
    }
    /**
     * @route   POST /api/auth/register
     * @desc    Đăng ký tài khoản mới
     * @access  Public
     */
    async register(req, res) {
        try {
            const registerData = req.body;
            // Validation
            if (!registerData.email || !registerData.password || !registerData.username || !registerData.fullName) {
                res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin'
                });
                return;
            }
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(registerData.email)) {
                res.status(400).json({
                    success: false,
                    message: 'Email không hợp lệ'
                });
                return;
            }
            // Validate password length
            if (registerData.password.length < 6) {
                res.status(400).json({
                    success: false,
                    message: 'Mật khẩu phải có ít nhất 6 ký tự'
                });
                return;
            }
            // Validate username length
            if (registerData.username.length < 3) {
                res.status(400).json({
                    success: false,
                    message: 'Username phải có ít nhất 3 ký tự'
                });
                return;
            }
            const result = await authService_1.authService.register(registerData);
            res.status(201).json({
                success: true,
                message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
                data: result
            });
        }
        catch (error) {
            console.error('Register error:', error);
            const statusCode = error.message.includes('đã được sử dụng') ? 409 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Đã xảy ra lỗi trong quá trình đăng ký'
            });
        }
    }
    /**
     * @route   GET /api/auth/me
     * @desc    Lấy thông tin user hiện tại
     * @access  Private
     */
    async getMe(req, res) {
        try {
            // User info đã được inject bởi auth middleware
            const user = req.user;
            res.status(200).json({
                success: true,
                data: user
            });
        }
        catch (error) {
            console.error('GetMe error:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi'
            });
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=authController.js.map