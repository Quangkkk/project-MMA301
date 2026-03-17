import { Request, Response } from 'express';
import { getConnection } from '../config/database';
import sql from 'mssql';
import cloudinaryService from '../services/cloudinaryService';

export const userController = {
  // Kiểm tra trạng thái follow
  async checkFollowStatus(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const targetUserId = parseInt(req.params.targetUserId);

      if (!userId || !targetUserId) {
        return res.status(400).json({
          success: false,
          message: 'User IDs are required'
        });
      }

      const pool = await getConnection();
      const result = await pool.request()
        .input('followerID', sql.Int, userId)
        .input('targetID', sql.Int, targetUserId)
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
    } catch (error: any) {
      console.error('Error in checkFollowStatus:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to check follow status'
      });
    }
  },

  // Follow user
  async followUser(req: Request, res: Response) {
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

      const pool = await getConnection();
      
      // Kiểm tra đã follow chưa
      const checkResult = await pool.request()
        .input('followerID', sql.Int, userId)
        .input('targetID', sql.Int, targetUserId)
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
        .input('followerID', sql.Int, userId)
        .input('targetID', sql.Int, targetUserId)
        .query(`
          INSERT INTO dbo.Follows (FollowerID, TargetID, Type, CreatedAt)
          VALUES (@followerID, @targetID, 'User', GETDATE())
        `);

      return res.status(200).json({
        success: true,
        message: 'Followed successfully'
      });
    } catch (error: any) {
      console.error('Error in followUser:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to follow user'
      });
    }
  },

  // Unfollow user
  async unfollowUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const targetUserId = parseInt(req.params.targetUserId);

      if (!userId || !targetUserId) {
        return res.status(400).json({
          success: false,
          message: 'User IDs are required'
        });
      }

      const pool = await getConnection();
      
      const result = await pool.request()
        .input('followerID', sql.Int, userId)
        .input('targetID', sql.Int, targetUserId)
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
    } catch (error: any) {
      console.error('Error in unfollowUser:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to unfollow user'
      });
    }
  },

  // Lấy thông tin profile của user đang đăng nhập
  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const pool = await getConnection();
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT 
            u.UserID,
            u.Username,
            u.Email,
            u.FullName,
            u.PhoneNumber,
            u.Address,
            u.Bio,
            u.DateOfBirth,
            u.Role,
            u.CreatedAt,
            m.FilePath as AvatarURL
          FROM dbo.Users u
          LEFT JOIN dbo.Media_Entity_Mapping mem ON mem.EntityType = 'User' AND mem.EntityID = u.UserID AND mem.MediaType = 'avatar'
          LEFT JOIN dbo.Media m ON m.MediaID = mem.MediaID AND m.IsActive = 1
          WHERE u.UserID = @userId
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = result.recordset[0];

      return res.status(200).json({
        success: true,
        data: {
          UserID: user.UserID,
          Username: user.Username,
          Email: user.Email,
          FullName: user.FullName,
          PhoneNumber: user.PhoneNumber,
          Address: user.Address,
          Bio: user.Bio,
          DateOfBirth: user.DateOfBirth,
          Role: user.Role,
          CreatedAt: user.CreatedAt,
          AvatarURL: user.AvatarURL
        }
      });
    } catch (error: any) {
      console.error('Error in getProfile:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get profile'
      });
    }
  },

  // Cập nhật profile của user đang đăng nhập
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

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

      const pool = await getConnection();
      
      // Kiểm tra email đã tồn tại cho user khác chưa
      const emailCheck = await pool.request()
        .input('email', sql.NVarChar, email)
        .input('userId', sql.Int, userId)
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
        .input('userId', sql.Int, userId)
        .input('fullName', sql.NVarChar, fullName)
        .input('email', sql.NVarChar, email)
        .input('phoneNumber', sql.NVarChar, phoneNumber || null)
        .input('address', sql.NVarChar, address || null)
        .input('bio', sql.NVarChar, bio || null)
        .input('dateOfBirth', sql.Date, dateOfBirth || null)
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
    } catch (error: any) {
      console.error('Error in updateProfile:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  },

  // Upload avatar
  async uploadAvatar(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const file = req.file;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Upload to Cloudinary
      const uploadResult = await cloudinaryService.uploadImage(
        file.buffer,
        'student_forum/avatars'
      );

      const pool = await getConnection();
      
      // Create media record
      const mediaResult = await pool.request()
        .input('fileName', sql.NVarChar, uploadResult.publicId)
        .input('originalFileName', sql.NVarChar, file.originalname)
        .input('filePath', sql.NVarChar, uploadResult.url)
        .input('fileSize', sql.Int, file.size)
        .input('fileType', sql.NVarChar, 'avatar')
        .input('mimeType', sql.NVarChar, file.mimetype)
        .input('uploadedByUserID', sql.Int, userId)
        .query(`
          INSERT INTO dbo.Media (FileName, OriginalFileName, FilePath, FileSize, FileType, MimeType, UploadedByUserID, UploadDate, IsActive)
          OUTPUT INSERTED.MediaID
          VALUES (@fileName, @originalFileName, @filePath, @fileSize, @fileType, @mimeType, @uploadedByUserID, GETDATE(), 1)
        `);

      const mediaId = mediaResult.recordset[0].MediaID;
      
      // Delete old avatar mapping if exists
      await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          DELETE FROM dbo.Media_Entity_Mapping
          WHERE EntityType = 'User' AND EntityID = @userId AND MediaType = 'avatar'
        `);

      // Create new avatar mapping
      await pool.request()
        .input('mediaId', sql.Int, mediaId)
        .input('userId', sql.Int, userId)
        .query(`
          INSERT INTO dbo.Media_Entity_Mapping (MediaID, EntityType, EntityID, MediaType, CreatedDate)
          VALUES (@mediaId, 'User', @userId, 'avatar', GETDATE())
        `);

      return res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatarURL: uploadResult.url
        }
      });
    } catch (error: any) {
      console.error('Error in uploadAvatar:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload avatar'
      });
    }
  }
};
