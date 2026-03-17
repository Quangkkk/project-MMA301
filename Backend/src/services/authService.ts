import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql, getConnection } from '../config/database';
import { 
  LoginRequestDTO, 
  RegisterRequestDTO, 
  AuthResponseDTO,
  JWTPayload 
} from '../types/auth.types';
import { emailService } from './emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

export class AuthService {
  /**
   * Đăng nhập
   */
  async login(loginData: LoginRequestDTO): Promise<AuthResponseDTO> {
    const pool = await getConnection();

    // Tìm user theo email
    const result = await pool
      .request()
      .input('Email', sql.NVarChar, loginData.email.toLowerCase().trim())
      .query(`
        SELECT 
          u.UserID, u.Username, u.PasswordHash, u.Email, u.FullName, 
          u.Role, u.UserStatus, u.IsVerify,
          m.FilePath as AvatarURL
        FROM Users u
        LEFT JOIN Media_Entity_Mapping mem ON mem.EntityType = 'User' AND mem.EntityID = u.UserID AND mem.MediaType = 'avatar'
        LEFT JOIN Media m ON m.MediaID = mem.MediaID AND m.IsActive = 1
        WHERE u.Email = @Email
      `);

    if (result.recordset.length === 0) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    const user = result.recordset[0];

    // Kiểm tra trạng thái tài khoản
    if (user.UserStatus === 0) {
      throw new Error('Tài khoản của bạn chưa được kích hoạt. Vui lòng liên hệ Admin.');
    }

    // Kiểm tra verify email
    if (!user.IsVerify) {
      throw new Error('Tài khoản của bạn chưa được xác thực email. Vui lòng kiểm tra email để xác thực tài khoản.');
    }

    // So sánh mật khẩu
    const isPasswordValid = await bcrypt.compare(loginData.password, user.PasswordHash);
    if (!isPasswordValid) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    // Tạo JWT token
    const token = this.generateToken({
      userId: user.UserID,
      email: user.Email,
      username: user.Username,
      role: user.Role
    });

    return {
      userId: user.UserID,
      username: user.Username,
      email: user.Email,
      fullName: user.FullName,
      role: user.Role,
      avatarURL: user.AvatarURL || null,
      token
    };
  }

  /**
   * Đăng ký
   */
  async register(registerData: RegisterRequestDTO): Promise<{ userId: number; username: string; email: string; fullName: string }> {
    const pool = await getConnection();

    // Kiểm tra email đã tồn tại chưa
    const emailCheck = await pool
      .request()
      .input('Email', sql.NVarChar, registerData.email.toLowerCase().trim())
      .query('SELECT UserID FROM Users WHERE Email = @Email');

    if (emailCheck.recordset.length > 0) {
      throw new Error('Email đã được sử dụng');
    }

    // Kiểm tra username đã tồn tại chưa
    const usernameCheck = await pool
      .request()
      .input('Username', sql.NVarChar, registerData.username.trim())
      .query('SELECT UserID FROM Users WHERE Username = @Username');

    if (usernameCheck.recordset.length > 0) {
      throw new Error('Username đã được sử dụng');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerData.password, SALT_ROUNDS);

    // Generate verification token
    const verificationToken = emailService.generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token hết hạn sau 24 giờ

    // Insert user mới
    const result = await pool
      .request()
      .input('Username', sql.NVarChar, registerData.username.trim())
      .input('PasswordHash', sql.NVarChar, hashedPassword)
      .input('Email', sql.NVarChar, registerData.email.toLowerCase().trim())
      .input('FullName', sql.NVarChar, registerData.fullName.trim())
      .input('Role', sql.NVarChar, 'User')
      .input('UserStatus', sql.TinyInt, 1) // Active
      .input('IsVerify', sql.Bit, false) // Chưa verify
      .input('VerificationToken', sql.NVarChar, verificationToken)
      .input('VerificationTokenExpiry', sql.DateTime, tokenExpiry)
      .input('CreatedAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO Users (Username, PasswordHash, Email, FullName, Role, UserStatus, IsVerify, VerificationToken, VerificationTokenExpiry, CreatedAt)
        OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.FullName
        VALUES (@Username, @PasswordHash, @Email, @FullName, @Role, @UserStatus, @IsVerify, @VerificationToken, @VerificationTokenExpiry, @CreatedAt)
      `);

    const newUser = result.recordset[0];

    // Gửi email xác thực
    try {
      await emailService.sendVerificationEmail(
        newUser.Email,
        newUser.FullName,
        verificationToken
      );
      console.log('✅ Verification email sent to:', newUser.Email);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Không throw error, vẫn cho phép đăng ký thành công
    }

    return {
      userId: newUser.UserID,
      username: newUser.Username,
      email: newUser.Email,
      fullName: newUser.FullName
    };
  }

  /**
   * Verify email token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const pool = await getConnection();

    // Tìm user với token
    const result = await pool
      .request()
      .input('Token', sql.NVarChar, token)
      .query(`
        SELECT UserID, Email, FullName, VerificationTokenExpiry, IsVerify
        FROM Users
        WHERE VerificationToken = @Token
      `);

    if (result.recordset.length === 0) {
      return { success: false, message: 'Token không hợp lệ' };
    }

    const user = result.recordset[0];

    // Kiểm tra đã verify chưa
    if (user.IsVerify) {
      return { success: false, message: 'Email đã được xác thực trước đó' };
    }

    // Kiểm tra token hết hạn
    if (new Date() > new Date(user.VerificationTokenExpiry)) {
      return { success: false, message: 'Token đã hết hạn. Vui lòng đăng ký lại.' };
    }

    // Cập nhật trạng thái verify
    await pool
      .request()
      .input('UserID', sql.Int, user.UserID)
      .query(`
        UPDATE Users
        SET IsVerify = 1,
            VerificationToken = NULL,
            VerificationTokenExpiry = NULL
        WHERE UserID = @UserID
      `);

    return { 
      success: true, 
      message: 'Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.' 
    };
  }

  /**
   * Generate JWT token
   */
  private generateToken(payload: JWTPayload): string {
    return jwt.sign(
      payload, 
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );
  }

  /**
   * Generate 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Forgot password - Send OTP
   */
  async forgotPassword(email: string, username: string): Promise<{ success: boolean; message: string }> {
    const pool = await getConnection();

    // Tìm user với email và username
    const result = await pool
      .request()
      .input('Email', sql.NVarChar, email.toLowerCase().trim())
      .input('Username', sql.NVarChar, username.trim())
      .query(`
        SELECT UserID, Email, FullName, Username
        FROM Users
        WHERE Email = @Email AND Username = @Username
      `);

    if (result.recordset.length === 0) {
      return { success: false, message: 'Email hoặc tên đăng nhập không đúng' };
    }

    const user = result.recordset[0];

    // Tạo OTP và thời gian hết hạn (10 phút)
    const otp = this.generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    // Lưu OTP vào database
    await pool
      .request()
      .input('UserID', sql.Int, user.UserID)
      .input('OTP', sql.NVarChar, otp)
      .input('OTPExpiry', sql.DateTime, otpExpiry)
      .query(`
        UPDATE Users
        SET ResetPasswordOTP = @OTP,
            ResetPasswordOTPExpiry = @OTPExpiry
        WHERE UserID = @UserID
      `);

    // Gửi OTP qua email
    try {
      await emailService.sendPasswordResetOTP(user.Email, user.FullName, otp);
      return { 
        success: true, 
        message: 'Mã OTP đã được gửi vào email của bạn. Vui lòng kiểm tra hộp thư.' 
      };
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      return { 
        success: false, 
        message: 'Không thể gửi email OTP. Vui lòng thử lại sau.' 
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    const pool = await getConnection();

    // Tìm user với email và OTP
    const result = await pool
      .request()
      .input('Email', sql.NVarChar, email.toLowerCase().trim())
      .input('OTP', sql.NVarChar, otp.trim())
      .query(`
        SELECT UserID, Email, ResetPasswordOTPExpiry
        FROM Users
        WHERE Email = @Email AND ResetPasswordOTP = @OTP
      `);

    if (result.recordset.length === 0) {
      return { success: false, message: 'Mã OTP không đúng' };
    }

    const user = result.recordset[0];

    // Kiểm tra OTP hết hạn
    if (new Date() > new Date(user.ResetPasswordOTPExpiry)) {
      return { success: false, message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' };
    }

    return { 
      success: true, 
      message: 'Xác thực OTP thành công' 
    };
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const pool = await getConnection();

    // Verify OTP trước
    const verifyResult = await this.verifyOTP(email, otp);
    if (!verifyResult.success) {
      return verifyResult;
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Cập nhật mật khẩu và xóa OTP
    await pool
      .request()
      .input('Email', sql.NVarChar, email.toLowerCase().trim())
      .input('OTP', sql.NVarChar, otp.trim())
      .input('PasswordHash', sql.NVarChar, hashedPassword)
      .query(`
        UPDATE Users
        SET PasswordHash = @PasswordHash,
            ResetPasswordOTP = NULL,
            ResetPasswordOTPExpiry = NULL
        WHERE Email = @Email AND ResetPasswordOTP = @OTP
      `);

    return { 
      success: true, 
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.' 
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }
  }
}

export const authService = new AuthService();
