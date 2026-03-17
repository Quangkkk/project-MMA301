"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const database_1 = require("../config/database");
const mssql_1 = __importDefault(require("mssql"));
exports.userController = {
    // Kiểm tra trạng thái follow
    async checkFollowStatus(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const targetUserId = parseInt(req.params.targetUserId);
            if (!userId || !targetUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'User IDs are required'
                });
            }
            const pool = await (0, database_1.getConnection)();
            const result = await pool.request()
                .input('followerID', mssql_1.default.Int, userId)
                .input('targetID', mssql_1.default.Int, targetUserId)
                .query(`
          SELECT COUNT(*) as count
          FROM dbo.Follows
          WHERE FollowerID = @followerID AND TargetID = @targetID AND Type = 'User'
        `);
            const isFollowing = result.recordset[0].count > 0;
            return res.status(200).json({
                success: true,
                data: { isFollowing }
            });
        }
        catch (error) {
            console.error('Error in checkFollowStatus:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to check follow status'
            });
        }
    },
    // Follow user
    async followUser(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const targetUserId = parseInt(req.params.targetUserId);
            if (!userId || !targetUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'User IDs are required'
                });
            }
            if (userId === targetUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot follow yourself'
                });
            }
            const pool = await (0, database_1.getConnection)();
            // Kiểm tra đã follow chưa
            const checkResult = await pool.request()
                .input('followerID', mssql_1.default.Int, userId)
                .input('targetID', mssql_1.default.Int, targetUserId)
                .query(`
          SELECT COUNT(*) as count
          FROM dbo.Follows
          WHERE FollowerID = @followerID AND TargetID = @targetID AND Type = 'User'
        `);
            if (checkResult.recordset[0].count > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Already following this user'
                });
            }
            // Insert follow
            await pool.request()
                .input('followerID', mssql_1.default.Int, userId)
                .input('targetID', mssql_1.default.Int, targetUserId)
                .query(`
          INSERT INTO dbo.Follows (FollowerID, TargetID, Type, CreatedAt)
          VALUES (@followerID, @targetID, 'User', GETDATE())
        `);
            return res.status(200).json({
                success: true,
                message: 'Followed successfully'
            });
        }
        catch (error) {
            console.error('Error in followUser:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to follow user'
            });
        }
    },
    // Unfollow user
    async unfollowUser(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const targetUserId = parseInt(req.params.targetUserId);
            if (!userId || !targetUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'User IDs are required'
                });
            }
            const pool = await (0, database_1.getConnection)();
            const result = await pool.request()
                .input('followerID', mssql_1.default.Int, userId)
                .input('targetID', mssql_1.default.Int, targetUserId)
                .query(`
          DELETE FROM dbo.Follows
          WHERE FollowerID = @followerID AND TargetID = @targetID AND Type = 'User'
        `);
            if (result.rowsAffected[0] === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Not following this user'
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Unfollowed successfully'
            });
        }
        catch (error) {
            console.error('Error in unfollowUser:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to unfollow user'
            });
        }
    },
    // Lấy thông tin profile của user đang đăng nhập
    async getProfile(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }
            const pool = await (0, database_1.getConnection)();
            const result = await pool.request()
                .input('userId', mssql_1.default.Int, userId)
                .query(`
          SELECT 
            UserID,
            Username,
            Email,
            FullName,
            PhoneNumber,
            Address,
            Bio,
            DateOfBirth,
            Role,
            ReputationPoints,
            CreatedAt
          FROM dbo.Users
          WHERE UserID = @userId
        `);
            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            const user = result.recordset[0];
            return res.status(200).json({
                UserID: user.UserID,
                Username: user.Username,
                Email: user.Email,
                FullName: user.FullName,
                PhoneNumber: user.PhoneNumber,
                Address: user.Address,
                Bio: user.Bio,
                DateOfBirth: user.DateOfBirth,
                Role: user.Role,
                ReputationPoints: user.ReputationPoints,
                CreatedAt: user.CreatedAt
            });
        }
        catch (error) {
            console.error('Error in getProfile:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to get profile'
            });
        }
    },
    // Cập nhật profile của user đang đăng nhập
    async updateProfile(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }
            const { fullName, email, phoneNumber, address, bio, dateOfBirth } = req.body;
            if (!fullName || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Full name and email are required'
                });
            }
            const pool = await (0, database_1.getConnection)();
            // Kiểm tra email đã tồn tại cho user khác chưa
            const emailCheck = await pool.request()
                .input('email', mssql_1.default.NVarChar, email)
                .input('userId', mssql_1.default.Int, userId)
                .query(`
          SELECT COUNT(*) as count
          FROM dbo.Users
          WHERE Email = @email AND UserID != @userId
        `);
            if (emailCheck.recordset[0].count > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
            await pool.request()
                .input('userId', mssql_1.default.Int, userId)
                .input('fullName', mssql_1.default.NVarChar, fullName)
                .input('email', mssql_1.default.NVarChar, email)
                .input('phoneNumber', mssql_1.default.NVarChar, phoneNumber || null)
                .input('address', mssql_1.default.NVarChar, address || null)
                .input('bio', mssql_1.default.NVarChar, bio || null)
                .input('dateOfBirth', mssql_1.default.Date, dateOfBirth || null)
                .query(`
          UPDATE dbo.Users
          SET 
            FullName = @fullName,
            Email = @email,
            PhoneNumber = @phoneNumber,
            Address = @address,
            Bio = @bio,
            DateOfBirth = @dateOfBirth
          WHERE UserID = @userId
        `);
            return res.status(200).json({
                success: true,
                message: 'Profile updated successfully'
            });
        }
        catch (error) {
            console.error('Error in updateProfile:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to update profile'
            });
        }
    }
};
//# sourceMappingURL=userController.js.map