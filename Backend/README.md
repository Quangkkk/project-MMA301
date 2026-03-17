# SeroChat Backend (Node.js)

Backend API cho ứng dụng SeroChat - Tư vấn sức khỏe tâm lý

## Công nghệ sử dụng

- **Node.js** với **Express.js**
- **TypeScript** cho type safety
- **SQL Server** (mssql) - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Cloudinary** - Cloud storage cho images/files
- **Nodemailer** - Email service
- **Google Auth Library** - Google OAuth
- **Gemini AI** - AI chatbot
- **Swagger** - API Documentation

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

3. Cấu hình các biến môi trường trong file `.env`

4. Chạy server trong development mode:
```bash
npm run dev
```

5. Build cho production:
```bash
npm run build
npm start
```

## API Documentation

Sau khi chạy server, truy cập: http://localhost:5000/api-docs

## Cấu trúc thư mục

```
src/
├── config/          # Cấu hình database, swagger, etc
├── controllers/     # Business logic
├── middlewares/     # Authentication, error handling
├── models/          # Database models
├── routes/          # API routes
├── services/        # External services (Cloudinary, Gemini, Email)
├── types/           # TypeScript type definitions
├── utils/           # Helper functions
└── index.ts         # Entry point
```

## Các API Routes

- `/api/auth` - Authentication (Login, Register, Google OAuth)
- `/api/users` - User management
- `/api/chat` - Chat with AI
- `/api/blogs` - Blog management
- `/api/moods` - Mood logging
- `/api/relax` - Relaxation content
- `/api/doctors` - Doctor information
- `/api/subscriptions` - Subscription plans
- `/api/payments` - Payment processing
- `/api/notifications` - Notification system

## Scripts

- `npm run dev` - Chạy development server với nodemon
- `npm run build` - Build TypeScript sang JavaScript
- `npm start` - Chạy production server
- `npm test` - Chạy tests
