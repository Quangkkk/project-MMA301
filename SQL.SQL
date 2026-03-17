CREATE DATABASE StudentForum_Final;
GO
USE StudentForum_Final;
GO

-- 1. NGƯỜI DÙNG
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    FullName NVARCHAR(100) NOT NULL,
    PhoneNumber NVARCHAR(20),
    Address NVARCHAR(255),
    Bio NVARCHAR(500),
    DateOfBirth DATE,
    Role NVARCHAR(20) NOT NULL, -- 'Admin', 'User'
    UserStatus TINYINT NOT NULL, -- 0: Inactive, 1: Active
    IsVerify BIT NOT NULL,
    VerificationToken NVARCHAR(255),
    VerificationTokenExpiry DATETIME,
    ResetPasswordOTP NVARCHAR(10),
    ResetPasswordOTPExpiry DATETIME,
    CreatedAt DATETIME NOT NULL
);

-- 2. THẺ HỌC TẬP
CREATE TABLE Tags (
    TagID INT PRIMARY KEY IDENTITY(1,1),
    TagName NVARCHAR(50) NOT NULL UNIQUE,
    CreatedAt DATETIME NOT NULL
);

-- 3. BÀI VIẾT
CREATE TABLE Posts (
    PostID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    Title NVARCHAR(255) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL
);

-- 4. BÌNH LUẬN & PHẢN HỒI (REPLY)
CREATE TABLE Comments (
    CommentID INT PRIMARY KEY IDENTITY(1,1),
    PostID INT NOT NULL FOREIGN KEY REFERENCES Posts(PostID),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    ParentCommentID INT NULL FOREIGN KEY REFERENCES Comments(CommentID),
    Content NVARCHAR(MAX) NOT NULL,
    IsBestAnswer BIT NOT NULL,
    CreatedAt DATETIME NOT NULL
);

-- 5. CẢM XÚC (LIKE, LOVE, HAHA...)
CREATE TABLE Reactions (
    ReactionID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    TargetID INT NOT NULL, 
    TargetType NVARCHAR(10) NOT NULL, -- 'Post' hoặc 'Comment'
    ReactionType NVARCHAR(20) NOT NULL,
    CreatedAt DATETIME NOT NULL,
    CONSTRAINT UC_User_Reaction UNIQUE (UserID, TargetID, TargetType)
);

-- 6. BÁO CÁO VI PHẠM (REPORTS)
CREATE TABLE Reports (
    ReportID INT PRIMARY KEY IDENTITY(1,1),
    ReporterID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    TargetID INT NOT NULL,
    TargetType NVARCHAR(10) NOT NULL, -- 'Post', 'Comment', 'User'
    Reason NVARCHAR(MAX) NOT NULL,
    Status TINYINT NOT NULL, -- 0: Đang chờ, 1: Đã xử lý
    AdminID INT NULL FOREIGN KEY REFERENCES Users(UserID), -- Admin xử lý
    AdminResponse NVARCHAR(MAX) NULL, -- Phản hồi của admin
    ResolvedAt DATETIME NULL, -- Thời gian xử lý
    CreatedAt DATETIME NOT NULL
);

-- 6B. CẢNH BÁO VI PHẠM (WARNINGS)
CREATE TABLE Warnings (
    WarningID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID), -- Người bị cảnh báo
    ReportID INT NULL FOREIGN KEY REFERENCES Reports(ReportID), -- Báo cáo liên quan
    AdminID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID), -- Admin phát hành
    WarningReason NVARCHAR(MAX) NOT NULL, -- Lý do cảnh báo
    ActionTaken NVARCHAR(100) NOT NULL, -- 'Warning', 'TemporaryBan', 'PermanentBan'
    Severity TINYINT NOT NULL, -- 1: Nhẹ, 2: Trung bình, 3: Nghiêm trọng
    IsActive BIT NOT NULL DEFAULT 1, -- 0: Đã hết hiệu lực, 1: Còn hiệu lực
    CreatedAt DATETIME NOT NULL
);

-- 6C. CẤM NGƯỜI DÙNG (USER BANS)
CREATE TABLE UserBans (
    BanID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID), -- Người bị cấm
    WarningID INT NULL FOREIGN KEY REFERENCES Warnings(WarningID), -- Cảnh báo liên quan
    AdminID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID), -- Admin phát hành
    BanReason NVARCHAR(MAX) NOT NULL, -- Lý do cấm
    BanType NVARCHAR(50) NOT NULL, -- 'POST', 'COMMENT', 'REPORT', 'FULL'
    StartDate DATETIME NOT NULL, -- Bắt đầu cấm
    EndDate DATETIME NULL, -- Kết thúc cấm (NULL = vĩnh viễn)
    IsActive BIT NOT NULL DEFAULT 1, -- 0: Đã hết hạn/thu hồi, 1: Còn hiệu lực
    RevokedBy INT NULL FOREIGN KEY REFERENCES Users(UserID), -- Admin thu hồi
    RevokedAt DATETIME NULL, -- Thời gian thu hồi
    CreatedAt DATETIME NOT NULL
);

-- 7. THÔNG BÁO (NOTIFICATIONS)
CREATE TABLE Notifications (
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID), -- Người nhận
    SourceID INT NOT NULL, -- ID của Post/Comment gây ra thông báo
    Type NVARCHAR(50) NOT NULL, -- 'NewComment', 'NewReaction', 'BadgeEarned'
    Message NVARCHAR(MAX) NOT NULL,
    IsRead BIT NOT NULL,
    CreatedAt DATETIME NOT NULL
);

-- 8. THEO DÕI (FOLLOWS)
CREATE TABLE Follows (
    FollowerID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    TargetID INT NOT NULL, -- ID của User khác hoặc ID của Tag
    Type NVARCHAR(10) NOT NULL, -- 'User' hoặc 'Tag'
    CreatedAt DATETIME NOT NULL,
    PRIMARY KEY (FollowerID, TargetID, Type)
);

-- Bảng trung gian Post-Tag
CREATE TABLE Post_Tags (
    PostID INT NOT NULL FOREIGN KEY REFERENCES Posts(PostID),
    TagID INT NOT NULL FOREIGN KEY REFERENCES Tags(TagID),
    PRIMARY KEY (PostID, TagID)
);

-- 10. LỊCH SỬ SỬA COMMENT
CREATE TABLE CommentEditHistory (
    EditHistoryID INT PRIMARY KEY IDENTITY(1,1),
    CommentID INT NOT NULL FOREIGN KEY REFERENCES Comments(CommentID),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    OldContent NVARCHAR(MAX) NOT NULL,
    EditedAt DATETIME NOT NULL
);

-- 11. CUỘC TRÒ CHUYỆN (1-1 Chat Only)
CREATE TABLE Conversations (
    ConversationID INT PRIMARY KEY IDENTITY(1,1),
    User1ID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    User2ID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME NOT NULL,
    LastMessageAt DATETIME,
    CONSTRAINT UC_Conversation UNIQUE (User1ID, User2ID),
    CONSTRAINT CK_DifferentUsers CHECK (User1ID < User2ID)
);

-- 12. TIN NHẮN
CREATE TABLE Messages (
    MessageID INT PRIMARY KEY IDENTITY(1,1),
    ConversationID INT NOT NULL FOREIGN KEY REFERENCES Conversations(ConversationID),
    SenderID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    Content NVARCHAR(MAX) NOT NULL,
    AttachmentURL NVARCHAR(255),
    IsRead BIT NOT NULL,
    CreatedAt DATETIME NOT NULL
);

-- 13. MEDIA (Lưu trữ file/ảnh)
CREATE TABLE Media (
    MediaID INT PRIMARY KEY IDENTITY(1,1),
    FileName NVARCHAR(255) NOT NULL,
    OriginalFileName NVARCHAR(255) NOT NULL,
    FilePath NVARCHAR(500) NOT NULL,
    FileSize BIGINT NOT NULL,
    FileType NVARCHAR(50) NOT NULL,
    MimeType NVARCHAR(100) NOT NULL,
    UploadedByUserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    UploadDate DATETIME NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

-- 14. MEDIA_ENTITY_MAPPING (Liên kết media với entity)
CREATE TABLE Media_Entity_Mapping (
    MappingID INT PRIMARY KEY IDENTITY(1,1),
    MediaID INT NOT NULL FOREIGN KEY REFERENCES Media(MediaID),
    EntityType NVARCHAR(50) NOT NULL, -- 'Post', 'Comment', 'Message'
    EntityID INT NOT NULL,
    MediaType NVARCHAR(50) NOT NULL, -- 'Image', 'Video', 'Document'
    CreatedDate DATETIME NOT NULL
);

-- ====================================
-- INSERT DỮ LIỆU MẪU
-- ====================================

-- 1. INSERT USERS
INSERT INTO Users (Username, PasswordHash, Email, FullName, Role, UserStatus, IsVerify, CreatedAt)
VALUES 
    ('admin', '$2a$12$rqEbcBrwFElFNSaae7el1.oFqfqI/ILeUXGTouhi1tfqp7udncvZa', 'admin@studentforum.edu.vn', N'Quản Trị Viên', 'Admin', 1, 1, '2024-01-01'),
    ('nguyenvana', '$2a$12$rqEbcBrwFElFNSaae7el1.oFqfqI/ILeUXGTouhi1tfqp7udncvZa', 'nguyenvana@fpt.edu.vn', N'Nguyễn Văn A', 'User', 1, 1, '2024-01-15'),
    ('tranthib', '$2a$12$rqEbcBrwFElFNSaae7el1.oFqfqI/ILeUXGTouhi1tfqp7udncvZa', 'tranthib@fpt.edu.vn', N'Trần Thị B', 'User', 1, 1, '2024-01-20'),
    ('levanc', '$2a$12$rqEbcBrwFElFNSaae7el1.oFqfqI/ILeUXGTouhi1tfqp7udncvZa', 'levanc@fpt.edu.vn', N'Lê Văn C', 'User', 1, 1, '2024-02-01'),
    ('phamthid', '$2a$12$rqEbcBrwFElFNSaae7el1.oFqfqI/ILeUXGTouhi1tfqp7udncvZa', 'phamthid@fpt.edu.vn', N'Phạm Thị D', 'User', 1, 1, '2024-02-10'),
    ('hoangvane', '$2a$12$rqEbcBrwFElFNSaae7el1.oFqfqI/ILeUXGTouhi1tfqp7udncvZa', 'hoangvane@fpt.edu.vn', N'Hoàng Văn E', 'User', 1, 0, '2024-02-15'),
    ('vuthif', '$2a$12$rqEbcBrwFElFNSaae7el1.oFqfqI/ILeUXGTouhi1tfqp7udncvZa', 'vuthif@fpt.edu.vn', N'Vũ Thị F', 'User', 1, 1, '2024-01-25'),
    ('dangvang', '$2a$12$rqEbcBrwFElFNSaae7el1.oFqfqI/ILeUXGTouhi1tfqp7udncvZa', 'dangvang@fpt.edu.vn', N'Đặng Văn G', 'User', 1, 1, '2024-03-01');

-- 2. INSERT TAGS
INSERT INTO Tags (TagName, CreatedAt)
VALUES 
    (N'Java', '2024-01-01'),
    (N'C#', '2024-01-01'),
    (N'Python', '2024-01-01'),
    (N'JavaScript', '2024-01-01'),
    (N'React', '2024-01-01'),
    (N'Database', '2024-01-01'),
    (N'SQL Server', '2024-01-01'),
    (N'MongoDB', '2024-01-01'),
    (N'Web Development', '2024-01-01'),
    (N'Mobile Development', '2024-01-01'),
    (N'Algorithm', '2024-01-01'),
    (N'Data Structure', '2024-01-01'),
    (N'OOP', '2024-01-01'),
    (N'Design Pattern', '2024-01-01'),
    (N'API', '2024-01-01');

-- 3. INSERT POSTS
INSERT INTO Posts (UserID, Title, Content, CreatedAt, UpdatedAt)
VALUES 
    (2, N'Cách tối ưu query SQL Server?', N'Mình đang có một query chạy rất chậm khi join nhiều bảng. Các bạn có thể tư vấn cách tối ưu không? Query của mình như sau: SELECT * FROM Users u INNER JOIN Posts p ON u.UserID = p.UserID WHERE u.Role = ''User''', '2024-02-20 10:00:00', '2024-02-20 10:00:00'),
    (3, N'Hỏi về React Hooks', N'Mình mới học React và không hiểu rõ về useEffect. Khi nào thì dùng useEffect và dependency array là gì?', '2024-02-21 14:30:00', '2024-02-21 14:30:00'),
    (4, N'Giải thuật sắp xếp nào hiệu quả nhất?', N'Mình đang làm bài tập lớn về thuật toán. Trong các thuật toán sắp xếp Quick Sort, Merge Sort, Heap Sort thì cái nào hiệu quả nhất cho dữ liệu lớn?', '2024-02-22 09:15:00', '2024-02-22 09:15:00'),
    (5, N'Làm sao để kết nối MongoDB với Node.js?', N'Em đang làm project web với Node.js và muốn dùng MongoDB. Nhưng em không biết cách kết nối. Có ai hướng dẫn em được không?', '2024-02-23 11:20:00', '2024-02-23 11:20:00'),
    (6, N'Design Pattern nào phù hợp cho dự án của mình?', N'Mình đang xây dựng một hệ thống quản lý sinh viên. Có nên dùng MVC pattern không hay có pattern nào tốt hơn?', '2024-02-24 08:45:00', '2024-02-24 08:45:00'),
    (7, N'Hướng dẫn deploy React app lên Vercel', N'Mình vừa hoàn thành project React và muốn deploy lên Vercel. Các bước deploy như thế nào và có cần config gì đặc biệt không?', '2024-02-19 16:00:00', '2024-02-19 16:00:00'),
    (2, N'Sự khác biệt giữa Java và C#', N'Mình đang phân vân không biết nên học Java hay C#. Các bạn có thể so sánh giúp mình được không?', '2024-02-18 13:30:00', '2024-02-18 13:30:00');

-- 4. INSERT POST_TAGS
INSERT INTO Post_Tags (PostID, TagID)
VALUES 
    (1, 6), (1, 7),  -- Post 1: Database, SQL Server
    (2, 4), (2, 5),  -- Post 2: JavaScript, React
    (3, 11), (3, 12), -- Post 3: Algorithm, Data Structure
    (4, 6), (4, 8),  -- Post 4: Database, MongoDB
    (5, 14),         -- Post 5: Design Pattern
    (6, 5), (6, 9),  -- Post 6: React, Web Development
    (7, 1), (7, 2), (7, 13); -- Post 7: Java, C#, OOP

-- 5. INSERT COMMENTS
INSERT INTO Comments (PostID, UserID, ParentCommentID, Content, IsBestAnswer, CreatedAt)
VALUES 
    -- Comments cho Post 1
    (1, 4, NULL, N'Bạn nên thêm index cho các cột được dùng trong JOIN và WHERE. Và tránh dùng SELECT *, chỉ lấy các cột cần thiết thôi.', 1, '2024-02-20 11:00:00'),
    (1, 3, 1, N'Đồng ý với bạn. Mình cũng từng gặp vấn đề này và sau khi thêm index thì query nhanh hơn rất nhiều.', 0, '2024-02-20 11:30:00'),
    (1, 7, NULL, N'Thêm nữa là nên dùng EXPLAIN PLAN để xem query execution plan, từ đó biết được bottleneck ở đâu.', 0, '2024-02-20 12:00:00'),
    
    -- Comments cho Post 2
    (2, 2, NULL, N'useEffect chạy sau khi component render. Dependency array là danh sách các biến mà khi thay đổi sẽ trigger useEffect chạy lại.', 1, '2024-02-21 15:00:00'),
    (2, 7, NULL, N'Một số tips: Nếu dependency array rỗng [] thì useEffect chỉ chạy 1 lần khi mount. Nếu không có dependency array thì chạy mỗi lần render.', 0, '2024-02-21 15:30:00'),
    (2, 3, 5, N'Cảm ơn bạn, mình hiểu rõ hơn rồi!', 0, '2024-02-21 16:00:00'),
    
    -- Comments cho Post 3
    (3, 7, NULL, N'Với dữ liệu lớn thì Quick Sort thường hiệu quả nhất với average case O(n log n). Nhưng worst case là O(n²). Merge Sort ổn định hơn với guaranteed O(n log n).', 0, '2024-02-22 10:00:00'),
    
    -- Comments cho Post 4
    (4, 2, NULL, N'Bạn cài mongoose package: npm install mongoose. Sau đó connect như này: mongoose.connect(''mongodb://localhost:27017/dbname'')', 1, '2024-02-23 12:00:00'),
    (4, 4, 8, N'Nhớ xử lý error khi connect nhé bạn. Dùng try-catch hoặc .catch()', 0, '2024-02-23 13:00:00'),
    
    -- Comments cho Post 6
    (6, 4, NULL, N'Mình vừa deploy project lên Vercel tuần trước. Rất đơn giản: 1) Push code lên GitHub, 2) Import repo vào Vercel, 3) Deploy tự động. Không cần config gì thêm.', 1, '2024-02-19 17:00:00'),
    (6, 2, 10, N'Vercel tự detect React app và config build command à bạn?', 0, '2024-02-19 17:30:00'),
    (6, 4, 11, N'Đúng rồi, Vercel tự động detect framework. Rất tiện!', 0, '2024-02-19 18:00:00');

-- 6. INSERT REACTIONS
INSERT INTO Reactions (UserID, TargetID, TargetType, ReactionType, CreatedAt)
VALUES 
    -- Reactions cho Posts
    (2, 1, 'Post', 'Like', '2024-02-20 10:30:00'),
    (3, 1, 'Post', 'Like', '2024-02-20 11:00:00'),
    (4, 1, 'Post', 'Love', '2024-02-20 12:00:00'),
    (5, 2, 'Post', 'Like', '2024-02-21 15:00:00'),
    (6, 2, 'Post', 'Like', '2024-02-21 16:00:00'),
    (2, 3, 'Post', 'Haha', '2024-02-22 10:00:00'),
    (3, 4, 'Post', 'Like', '2024-02-23 12:00:00'),
    (7, 6, 'Post', 'Love', '2024-02-19 17:00:00'),
    (2, 6, 'Post', 'Like', '2024-02-19 18:00:00'),
    
    -- Reactions cho Comments
    (3, 1, 'Comment', 'Like', '2024-02-20 11:30:00'),
    (2, 1, 'Comment', 'Love', '2024-02-20 12:00:00'),
    (5, 1, 'Comment', 'Like', '2024-02-20 13:00:00'),
    (3, 4, 'Comment', 'Like', '2024-02-21 15:30:00'),
    (2, 8, 'Comment', 'Love', '2024-02-23 12:30:00'),
    (4, 10, 'Comment', 'Like', '2024-02-19 17:30:00');

-- 7. INSERT FOLLOWS
INSERT INTO Follows (FollowerID, TargetID, Type, CreatedAt)
VALUES 
    -- User follows User
    (2, 4, 'User', '2024-02-20 10:00:00'),
    (2, 7, 'User', '2024-02-20 10:00:00'),
    (3, 2, 'User', '2024-02-21 09:00:00'),
    (3, 4, 'User', '2024-02-21 09:00:00'),
    (4, 7, 'User', '2024-02-22 08:00:00'),
    (5, 2, 'User', '2024-02-23 08:00:00'),
    (5, 4, 'User', '2024-02-23 08:00:00'),
    (6, 7, 'User', '2024-02-24 08:00:00'),
    
    -- User follows Tag
    (2, 1, 'Tag', '2024-02-15 10:00:00'),  -- Follow Java
    (2, 6, 'Tag', '2024-02-15 10:00:00'),  -- Follow Database
    (3, 4, 'Tag', '2024-02-15 10:00:00'),  -- Follow JavaScript
    (3, 5, 'Tag', '2024-02-15 10:00:00'),  -- Follow React
    (4, 11, 'Tag', '2024-02-15 10:00:00'), -- Follow Algorithm
    (5, 6, 'Tag', '2024-02-15 10:00:00'),  -- Follow Database
    (7, 5, 'Tag', '2024-02-15 10:00:00');  -- Follow React

-- 8. INSERT NOTIFICATIONS
INSERT INTO Notifications (UserID, SourceID, Type, Message, IsRead, CreatedAt)
VALUES 
    (2, 1, 'NewComment', N'Lê Văn C đã bình luận vào bài viết của bạn: "Cách tối ưu query SQL Server?"', 1, '2024-02-20 11:00:00'),
    (2, 1, 'NewReaction', N'Trần Thị B đã thích bài viết của bạn', 1, '2024-02-20 11:00:00'),
    (3, 2, 'NewComment', N'Nguyễn Văn A đã trả lời câu hỏi của bạn', 1, '2024-02-21 15:00:00'),
    (4, 3, 'NewReaction', N'Nguyễn Văn A đã react Haha vào bài viết của bạn', 0, '2024-02-22 10:00:00'),
    (7, 1, 'NewReaction', N'Phạm Thị D đã thích bình luận của bạn', 0, '2024-02-20 13:00:00'),
    (4, 8, 'NewReaction', N'Nguyễn Văn A đã yêu thích bình luận của bạn', 0, '2024-02-23 12:30:00'),
    (7, 6, 'NewComment', N'Lê Văn C đã bình luận vào bài viết của bạn', 1, '2024-02-19 17:00:00');

-- 9. INSERT REPORTS
INSERT INTO Reports (ReporterID, TargetID, TargetType, Reason, Status, CreatedAt)
VALUES 
    (3, 8, 'User', N'User này spam bài viết quá nhiều', 1, '2024-03-01 09:00:00'),
    (2, 5, 'Post', N'Nội dung không phù hợp với diễn đàn', 0, '2024-02-24 10:00:00'),
    (5, 7, 'Comment', N'Bình luận có nội dung xúc phạm', 0, '2024-02-22 11:00:00');

-- ====================================
-- VERIFY DATA
-- ====================================
PRINT 'Data inserted successfully!';
PRINT '';
PRINT 'Summary:';
SELECT 'Users' AS TableName, COUNT(*) AS RecordCount FROM Users
UNION ALL
SELECT 'Tags', COUNT(*) FROM Tags
UNION ALL
SELECT 'Posts', COUNT(*) FROM Posts
UNION ALL
SELECT 'Comments', COUNT(*) FROM Comments
UNION ALL
SELECT 'Reactions', COUNT(*) FROM Reactions
UNION ALL
SELECT 'Follows', COUNT(*) FROM Follows
UNION ALL
SELECT 'Notifications', COUNT(*) FROM Notifications
UNION ALL
SELECT 'Reports', COUNT(*) FROM Reports
UNION ALL
SELECT 'Post_Tags', COUNT(*) FROM Post_Tags
UNION ALL
SELECT 'CommentEditHistory', COUNT(*) FROM CommentEditHistory
UNION ALL
SELECT 'Conversations', COUNT(*) FROM Conversations
UNION ALL
SELECT 'Messages', COUNT(*) FROM Messages;