import nodemailer from 'nodemailer';
import crypto from 'crypto';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@studentforum.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8081';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  /**
   * Generate verification token
   */
  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(email: string, fullName: string, token: string): Promise<void> {
    const verificationLink = `http://192.168.1.209:5000/api/auth/verify-email/${token}`;

    const mailOptions = {
      from: `StudentForum <${FROM_EMAIL}>`,
      to: email,
      subject: 'Xác thực tài khoản StudentForum',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #fff;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #fff;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
            }
            .content h2 {
              color: #667eea;
              margin-top: 0;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #fff;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 10px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 StudentForum</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${fullName}!</h2>
              <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>StudentForum</strong>.</p>
              <p>Để hoàn tất quá trình đăng ký và kích hoạt tài khoản, vui lòng nhấn vào nút bên dưới để xác thực email của bạn:</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Xác thực Email</a>
              </div>

              <div class="warning">
                <strong>⚠️ Lưu ý:</strong> Link xác thực này sẽ hết hạn sau <strong>24 giờ</strong>.
              </div>

              <p>Nếu nút không hoạt động, bạn có thể sao chép và dán link sau vào trình duyệt:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationLink}</p>

              <p style="margin-top: 30px;">Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
              
              <p>Trân trọng,<br><strong>Đội ngũ StudentForum</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 StudentForum. All rights reserved.</p>
              <p>Email này được gửi tự động, vui lòng không reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent to:', email);
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      throw new Error('Không thể gửi email xác thực');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, fullName: string, token: string): Promise<void> {
    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: `StudentForum <${FROM_EMAIL}>`,
      to: email,
      subject: 'Đặt lại mật khẩu StudentForum',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #fff;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #fff;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #fff;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin: 20px 0;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 10px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Đặt lại mật khẩu</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${fullName}!</h2>
              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Đặt lại mật khẩu</a>
              </div>

              <div class="warning">
                <strong>⚠️ Lưu ý:</strong> Link này sẽ hết hạn sau <strong>1 giờ</strong>.
              </div>

              <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Send OTP for password reset
   */
  async sendPasswordResetOTP(email: string, fullName: string, otp: string): Promise<void> {
    const mailOptions = {
      from: `StudentForum <${FROM_EMAIL}>`,
      to: email,
      subject: 'Mã OTP đặt lại mật khẩu - StudentForum',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #fff;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
              color: #fff;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
            }
            .content h2 {
              color: #4A90E2;
              margin-top: 0;
            }
            .otp-box {
              background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
              border: 2px dashed #4A90E2;
              border-radius: 10px;
              padding: 25px;
              text-align: center;
              margin: 25px 0;
            }
            .otp-code {
              font-size: 42px;
              font-weight: bold;
              color: #4A90E2;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Đặt lại mật khẩu</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${fullName}!</h2>
              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>StudentForum</strong>.</p>
              <p>Đây là mã OTP để xác thực danh tính của bạn:</p>
              
              <div class="otp-box">
                <div style="font-size: 14px; color: #666; margin-bottom: 10px;">MÃ OTP CỦA BẠN</div>
                <div class="otp-code">${otp}</div>
                <div style="font-size: 14px; color: #666; margin-top: 10px;">Nhập mã này vào ứng dụng</div>
              </div>

              <div class="warning">
                <strong>⚠️ Lưu ý quan trọng:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Mã OTP này sẽ hết hạn sau <strong>10 phút</strong></li>
                  <li>Không chia sẻ mã OTP này với bất kỳ ai</li>
                  <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                </ul>
              </div>

              <p style="margin-top: 30px;">Nếu bạn gặp bất kỳ vấn đề gì, vui lòng liên hệ với chúng tôi.</p>
              
              <p>Trân trọng,<br><strong>Đội ngũ StudentForum</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 StudentForum. All rights reserved.</p>
              <p>Email này được gửi tự động, vui lòng không reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ OTP email sent to:', email);
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error);
      throw new Error('Không thể gửi email OTP');
    }
  }
}

export const emailService = new EmailService();
