import { Request, Response } from 'express';
export declare class AuthController {
    /**
     * @route   POST /api/auth/login
     * @desc    Đăng nhập bằng email và password
     * @access  Public
     */
    login(req: Request, res: Response): Promise<void>;
    /**
     * @route   POST /api/auth/register
     * @desc    Đăng ký tài khoản mới
     * @access  Public
     */
    register(req: Request, res: Response): Promise<void>;
    /**
     * @route   GET /api/auth/me
     * @desc    Lấy thông tin user hiện tại
     * @access  Private
     */
    getMe(req: Request, res: Response): Promise<void>;
}
export declare const authController: AuthController;
//# sourceMappingURL=authController.d.ts.map