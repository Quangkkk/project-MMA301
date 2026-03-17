import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { LoginRequestDTO, RegisterRequestDTO } from '../types/auth.types';

export class AuthController {
  /**
   * @route   POST /api/auth/login
   * @desc    Đăng nhập bằng email và password
   * @access  Public
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequestDTO = req.body;

      // Validation
      if (!loginData.email || !loginData.password) {
        res.status(400).json({
          success: false,
          message: 'Email và mật khẩu là bắt buộc'
        });
        return;
      }

      const result = await authService.login(loginData);

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: result
      });
    } catch (error: any) {
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
  async register(req: Request, res: Response): Promise<void> {
    try {
      const registerData: RegisterRequestDTO = req.body;

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

      const result = await authService.register(registerData);

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
        data: result
      });
    } catch (error: any) {
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
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      // User info đã được inject bởi auth middleware
      const user = (req as any).user;

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error: any) {
      console.error('GetMe error:', error);
      res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi'
      });
    }
  }

  /**
   * @route   GET /api/auth/verify-email/:token
   * @desc    Xác thực email bằng token
   * @access  Public
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.redirect('/verify-error.html?message=' + encodeURIComponent('Token không hợp lệ'));
        return;
      }

      const result = await authService.verifyEmail(token);

      if (result.success) {
        // Redirect đến trang thành công
        res.redirect('/verify-success.html');
      } else {
        // Redirect đến trang lỗi với message
        res.redirect('/verify-error.html?message=' + encodeURIComponent(result.message));
      }
    } catch (error: any) {
      console.error('Verify email error:', error);
      res.redirect('/verify-error.html?message=' + encodeURIComponent('Đã xảy ra lỗi trong quá trình xác thực email'));
    }
  }

  /**
   * @route   POST /api/auth/forgot-password
   * @desc    Gửi OTP để đặt lại mật khẩu
   * @access  Public
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, username } = req.body;

      if (!email || !username) {
        res.status(400).json({
          success: false,
          message: 'Email và tên đăng nhập là bắt buộc'
        });
        return;
      }

      const result = await authService.forgotPassword(email, username);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi trong quá trình xử lý'
      });
    }
  }

  /**
   * @route   POST /api/auth/verify-otp
   * @desc    Xác thực OTP
   * @access  Public
   */
  async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({
          success: false,
          message: 'Email và mã OTP là bắt buộc'
        });
        return;
      }

      const result = await authService.verifyOTP(email, otp);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi trong quá trình xác thực OTP'
      });
    }
  }

  /**
   * @route   POST /api/auth/reset-password
   * @desc    Đặt lại mật khẩu với OTP
   * @access  Public
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Email, mã OTP và mật khẩu mới là bắt buộc'
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Mật khẩu phải có ít nhất 6 ký tự'
        });
        return;
      }

      const result = await authService.resetPassword(email, otp, newPassword);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi trong quá trình đặt lại mật khẩu'
      });
    }
  }
}

export const authController = new AuthController();
