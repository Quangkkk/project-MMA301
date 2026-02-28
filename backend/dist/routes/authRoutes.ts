import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập bằng email và password
 * @access  Public
 */
router.post('/login', (req, res) => authController.login(req, res));

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký tài khoản mới
 * @access  Public
 */
router.post('/register', (req, res) => authController.register(req, res));

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Xác thực email bằng token
 * @access  Public
 */
router.get('/verify-email/:token', (req, res) => authController.verifyEmail(req, res));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Gửi OTP để đặt lại mật khẩu
 * @access  Public
 */
router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Xác thực mã OTP
 * @access  Public
 */
router.post('/verify-otp', (req, res) => authController.verifyOTP(req, res));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Đặt lại mật khẩu với OTP
 * @access  Public
 */
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));

/**
 * @route   GET /api/auth/me
 * @desc    Lấy thông tin user hiện tại
 * @access  Private
 */
router.get('/me', authenticate, (req, res) => authController.getMe(req, res));

export default router;
