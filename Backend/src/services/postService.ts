import { getConnection } from '../config/database';
import sql from 'mssql';
import mediaService from './mediaService';
import { Media } from '../models/Media';

export interface PostWithUser {
  postId: number;
  title: string;
  content: string;
  userId: number;
  username: string;
  fullName: string;
  avatarURL?: string;
  createdAt: Date;
  tags: string[];
  reactions: number;
  comments: number;
  images?: string[];
}

export interface UserStats {
  totalPosts: number;
  totalComments: number;
  totalReactions: number;
  ranking: number;
}

class PostService {
  // Lấy danh sách posts với phân trang và filter
  async getPosts(page: number = 1, limit: number = 20, tagId?: number): Promise<PostWithUser[]> {
    try {
      const pool = await getConnection();
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          p.PostID as postId,
          p.Title as title,
          p.Content as content,
          p.UserID as userId,
          p.CreatedAt as createdAt,
          u.Username as username,
          u.FullName as fullName,
          m.FilePath as avatarURL,
          
          (SELECT COUNT(*) FROM dbo.Reactions r WHERE r.TargetID = p.PostID AND r.TargetType = 'Post') as reactions,
          (SELECT COUNT(*) FROM dbo.Comments c WHERE c.PostID = p.PostID) as comments
        FROM dbo.Posts p
        INNER JOIN dbo.Users u ON p.UserID = u.UserID
        LEFT JOIN dbo.Media_Entity_Mapping mem ON mem.EntityType = 'User' AND mem.EntityID = u.UserID AND mem.MediaType = 'avatar'
        LEFT JOIN dbo.Media m ON m.MediaID = mem.MediaID AND m.IsActive = 1
      `;

      if (tagId) {
        query += `
          INNER JOIN dbo.Post_Tags pt ON p.PostID = pt.PostID
          WHERE pt.TagID = @tagId
        `;
      }

      query += `
        ORDER BY p.CreatedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `;

      const request = pool.request();
      request.input('offset', sql.Int, offset);
      request.input('limit', sql.Int, limit);
      if (tagId) {
        request.input('tagId', sql.Int, tagId);
      }

      const result = await request.query(query);
      
      // Lấy tags và images cho mỗi post
      const posts = await Promise.all(
        result.recordset.map(async (post: any) => {
          // Get tags
          const tagsResult = await pool.request()
            .input('postId', sql.Int, post.postId)
            .query(`
              SELECT t.TagName
              FROM dbo.Tags t
              INNER JOIN dbo.Post_Tags pt ON t.TagID = pt.TagID
              WHERE pt.PostID = @postId
            `);
          
          // Get images
          const images = await mediaService.getMediaByEntity('Post', post.postId);
          
          return {
            ...post,
            tags: tagsResult.recordset.map((t: any) => `#${t.TagName}`),
            images: images.map((img: Media) => img.FilePath)
          };
        })
      );

      return posts;
    } catch (error) {
      console.error('Error in getPosts:', error);
      throw new Error('Failed to fetch posts');
    }
  }

  // Lấy posts thịnh hành (nhiều reactions/comments trong 24h)
  async getTrendingPosts(limit: number = 20): Promise<PostWithUser[]> {
    try {
      const pool = await getConnection();

      const query = `
        SELECT 
          p.PostID as postId,
          p.Title as title,
          p.Content as content,
          p.UserID as userId,
          p.CreatedAt as createdAt,
          u.Username as username,
          u.FullName as fullName,
          m.FilePath as avatarURL,
          
          (SELECT COUNT(*) FROM dbo.Reactions r WHERE r.TargetID = p.PostID AND r.TargetType = 'Post') as reactions,
          (SELECT COUNT(*) FROM dbo.Comments c WHERE c.PostID = p.PostID) as comments,
          (
            (SELECT COUNT(*) FROM dbo.Reactions r WHERE r.TargetID = p.PostID AND r.TargetType = 'Post' AND r.CreatedAt >= DATEADD(hour, -24, GETDATE())) * 2 +
            (SELECT COUNT(*) FROM dbo.Comments c WHERE c.PostID = p.PostID AND c.CreatedAt >= DATEADD(hour, -24, GETDATE())) * 3
          ) as trendingScore
        FROM dbo.Posts p
        INNER JOIN dbo.Users u ON p.UserID = u.UserID
        LEFT JOIN dbo.Media_Entity_Mapping mem ON mem.EntityType = 'User' AND mem.EntityID = u.UserID AND mem.MediaType = 'avatar'
        LEFT JOIN dbo.Media m ON m.MediaID = mem.MediaID AND m.IsActive = 1
        WHERE p.CreatedAt >= DATEADD(day, -7, GETDATE())
        ORDER BY trendingScore DESC, p.CreatedAt DESC
        OFFSET 0 ROWS
        FETCH NEXT @limit ROWS ONLY
      `;

      const result = await pool.request()
        .input('limit', sql.Int, limit)
        .query(query);

      // Lấy tags và images cho mỗi post
      const posts = await Promise.all(
        result.recordset.map(async (post: any) => {
          // Get tags
          const tagsResult = await pool.request()
            .input('postId', sql.Int, post.postId)
            .query(`
              SELECT t.TagName
              FROM dbo.Tags t
              INNER JOIN dbo.Post_Tags pt ON t.TagID = pt.TagID
              WHERE pt.PostID = @postId
            `);
          
          // Get images
          const images = await mediaService.getMediaByEntity('Post', post.postId);
          
          return {
            ...post,
            tags: tagsResult.recordset.map((t: any) => `#${t.TagName}`),
            images: images.map((img: Media) => img.FilePath)
          };
        })
      );

      return posts;
    } catch (error) {
      console.error('Error in getTrendingPosts:', error);
      throw new Error('Failed to fetch trending posts');
    }
  }

  // Lấy posts từ người dùng đang follow
  async getFollowingPosts(userId: number, page: number = 1, limit: number = 20): Promise<PostWithUser[]> {
    try {
      const pool = await getConnection();
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          p.PostID as postId,
          p.Title as title,
          p.Content as content,
          p.UserID as userId,
          p.CreatedAt as createdAt,
          u.Username as username,
          u.FullName as fullName,
          m.FilePath as avatarURL,
          
          (SELECT COUNT(*) FROM dbo.Reactions r WHERE r.TargetID = p.PostID AND r.TargetType = 'Post') as reactions,
          (SELECT COUNT(*) FROM dbo.Comments c WHERE c.PostID = p.PostID) as comments
        FROM dbo.Posts p
        INNER JOIN dbo.Users u ON p.UserID = u.UserID
        LEFT JOIN dbo.Media_Entity_Mapping mem ON mem.EntityType = 'User' AND mem.EntityID = u.UserID AND mem.MediaType = 'avatar'
        LEFT JOIN dbo.Media m ON m.MediaID = mem.MediaID AND m.IsActive = 1
        INNER JOIN dbo.Follows f ON p.UserID = f.TargetID
        WHERE f.FollowerID = @userId AND f.Type = 'User'
        ORDER BY p.CreatedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `;

      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit)
        .query(query);

      // Lấy tags và images cho mỗi post
      const posts = await Promise.all(
        result.recordset.map(async (post: any) => {
          // Get tags
          const tagsResult = await pool.request()
            .input('postId', sql.Int, post.postId)
            .query(`
              SELECT t.TagName
              FROM dbo.Tags t
              INNER JOIN dbo.Post_Tags pt ON t.TagID = pt.TagID
              WHERE pt.PostID = @postId
            `);
          
          // Get images
          const images = await mediaService.getMediaByEntity('Post', post.postId);
          
          return {
            ...post,
            tags: tagsResult.recordset.map((t: any) => `#${t.TagName}`),
            images: images.map((img: Media) => img.FilePath)
          };
        })
      );

      return posts;
    } catch (error) {
      console.error('Error in getFollowingPosts:', error);
      throw new Error('Failed to fetch following posts');
    }
  }

  // Lấy posts đã lưu
  async getSavedPosts(userId: number, page: number = 1, limit: number = 20): Promise<PostWithUser[]> {
    try {
      const pool = await getConnection();
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          p.PostID as postId,
          p.Title as title,
          p.Content as content,
          p.UserID as userId,
          p.CreatedAt as createdAt,
          u.Username as username,
          u.FullName as fullName,
          m.FilePath as avatarURL,
          
          (SELECT COUNT(*) FROM dbo.Reactions r WHERE r.TargetID = p.PostID AND r.TargetType = 'Post') as reactions,
          (SELECT COUNT(*) FROM dbo.Comments c WHERE c.PostID = p.PostID) as comments
        FROM dbo.Posts p
        INNER JOIN dbo.Users u ON p.UserID = u.UserID
        LEFT JOIN dbo.Media_Entity_Mapping mem ON mem.EntityType = 'User' AND mem.EntityID = u.UserID AND mem.MediaType = 'avatar'
        LEFT JOIN dbo.Media m ON m.MediaID = mem.MediaID AND m.IsActive = 1
        INNER JOIN dbo.SavedBlogs sb ON p.PostID = sb.PostID
        WHERE sb.UserID = @userId
        ORDER BY sb.SavedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `;

      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit)
        .query(query);

      // Lấy tags và images cho mỗi post
      const posts = await Promise.all(
        result.recordset.map(async (post: any) => {
          // Get tags
          const tagsResult = await pool.request()
            .input('postId', sql.Int, post.postId)
            .query(`
              SELECT t.TagName
              FROM dbo.Tags t
              INNER JOIN dbo.Post_Tags pt ON t.TagID = pt.TagID
              WHERE pt.PostID = @postId
            `);
          
          // Get images
          const images = await mediaService.getMediaByEntity('Post', post.postId);
          
          return {
            ...post,
            tags: tagsResult.recordset.map((t: any) => `#${t.TagName}`),
            images: images.map((img: Media) => img.FilePath)
          };
        })
      );

      return posts;
    } catch (error) {
      console.error('Error in getSavedPosts:', error);
      throw new Error('Failed to fetch saved posts');
    }
  }

  // Lấy thống kê user
  async getUserStats(userId: number): Promise<UserStats> {
    try {
      const pool = await getConnection();

      const query = `
        SELECT 
          (SELECT COUNT(*) FROM dbo.Posts WHERE UserID = @userId) as totalPosts,
          (SELECT COUNT(*) FROM dbo.Comments WHERE UserID = @userId) as totalComments,
          (SELECT COUNT(*) FROM dbo.Reactions r 
           WHERE r.TargetID IN (SELECT PostID FROM dbo.Posts WHERE UserID = @userId) AND r.TargetType = 'Post') as totalReactions
      `;

      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(query);

      const stats = result.recordset[0];

      // Tính ranking (top x%) dựa trên tổng hoạt động
      const rankingQuery = `
        WITH UserRanking AS (
          SELECT 
            u.UserID,
            (SELECT COUNT(*) FROM dbo.Posts WHERE UserID = u.UserID) +
            (SELECT COUNT(*) FROM dbo.Comments WHERE UserID = u.UserID) +
            (SELECT COUNT(*) FROM dbo.Reactions WHERE UserID = u.UserID) as ActivityScore,
            ROW_NUMBER() OVER (ORDER BY 
              (SELECT COUNT(*) FROM dbo.Posts WHERE UserID = u.UserID) +
              (SELECT COUNT(*) FROM dbo.Comments WHERE UserID = u.UserID) +
              (SELECT COUNT(*) FROM dbo.Reactions WHERE UserID = u.UserID) DESC
            ) as Rank,
            COUNT(*) OVER() as TotalUsers
          FROM dbo.Users u
          WHERE u.UserStatus = 1
        )
        SELECT 
          CAST(Rank AS FLOAT) / TotalUsers * 100 as RankingPercentage
        FROM UserRanking
        WHERE UserID = @userId
      `;

      const rankingResult = await pool.request()
        .input('userId', sql.Int, userId)
        .query(rankingQuery);

      const ranking = rankingResult.recordset[0]?.RankingPercentage || 100;

      return {
        totalPosts: stats.totalPosts,
        totalComments: stats.totalComments,
        totalReactions: stats.totalReactions,
        ranking: Math.ceil(ranking)
      };
    } catch (error) {
      console.error('Error in getUserStats:', error);
      throw new Error('Failed to fetch user stats');
    }
  }

  // Lấy danh sách tags phổ biến
  async getPopularTags(limit: number = 10): Promise<{ tagId: number; tagName: string; postCount: number }[]> {
    try {
      const pool = await getConnection();

      const query = `
        SELECT TOP (@limit)
          t.TagID as tagId,
          t.TagName as tagName,
          COUNT(pt.PostID) as postCount
        FROM dbo.Tags t
        LEFT JOIN dbo.Post_Tags pt ON t.TagID = pt.TagID
        GROUP BY t.TagID, t.TagName
        ORDER BY postCount DESC
      `;

      const result = await pool.request()
        .input('limit', sql.Int, limit)
        .query(query);

      return result.recordset;
    } catch (error) {
      console.error('Error in getPopularTags:', error);
      throw new Error('Failed to fetch popular tags');
    }
  }

  // Lấy tất cả bài viết của một user
  async getUserPosts(userId: number, page: number = 1, limit: number = 20): Promise<PostWithUser[]> {
    try {
      const pool = await getConnection();
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          p.PostID as postId,
          p.Title as title,
          p.Content as content,
          p.UserID as userId,
          p.CreatedAt as createdAt,
          u.Username as username,
          u.FullName as fullName,
          m.FilePath as avatarURL,
          
          (SELECT COUNT(*) FROM dbo.Reactions r WHERE r.TargetID = p.PostID AND r.TargetType = 'Post') as reactions,
          (SELECT COUNT(*) FROM dbo.Comments c WHERE c.PostID = p.PostID) as comments
        FROM dbo.Posts p
        INNER JOIN dbo.Users u ON p.UserID = u.UserID
        LEFT JOIN dbo.Media_Entity_Mapping mem ON mem.EntityType = 'User' AND mem.EntityID = u.UserID AND mem.MediaType = 'avatar'
        LEFT JOIN dbo.Media m ON m.MediaID = mem.MediaID AND m.IsActive = 1
        WHERE p.UserID = @userId
        ORDER BY p.CreatedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `;

      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit)
        .query(query);

      // Lấy tags và images cho mỗi post
      const posts = await Promise.all(
        result.recordset.map(async (post: any) => {
          // Get tags
          const tagsResult = await pool.request()
            .input('postId', sql.Int, post.postId)
            .query(`
              SELECT t.TagName
              FROM dbo.Tags t
              INNER JOIN dbo.Post_Tags pt ON t.TagID = pt.TagID
              WHERE pt.PostID = @postId
            `);
          
          // Get images
          const images = await mediaService.getMediaByEntity('Post', post.postId);
          
          return {
            ...post,
            tags: tagsResult.recordset.map((t: any) => `#${t.TagName}`),
            images: images.map((img: Media) => img.FilePath)
          };
        })
      );

      return posts;
    } catch (error) {
      console.error('Error in getUserPosts:', error);
      throw new Error('Failed to fetch user posts');
    }
  }

  // Tạo bài viết mới
  async createPost(data: { UserID: number; Title: string; Content: string; tags: string[]; mediaIds?: number[] }): Promise<PostWithUser> {
    try {
      const pool = await getConnection();
      
      // Insert post
      const postResult = await pool.request()
        .input('userId', sql.Int, data.UserID)
        .input('title', sql.NVarChar, data.Title)
        .input('content', sql.NVarChar, data.Content)
        .query(`
          INSERT INTO dbo.Posts (UserID, Title, Content, CreatedAt, UpdatedAt)
          OUTPUT INSERTED.PostID, INSERTED.Title, INSERTED.Content, INSERTED.UserID, INSERTED.CreatedAt
          VALUES (@userId, @title, @content, GETDATE(), GETDATE())
        `);

      const newPost = postResult.recordset[0];

      // Link media to post
      if (data.mediaIds && data.mediaIds.length > 0) {
        for (const mediaId of data.mediaIds) {
          await mediaService.createMediaMapping({
            MediaID: mediaId,
            EntityType: 'Post',
            EntityID: newPost.PostID,
            MediaType: 'Image'
          });
        }
      }

      // Process tags
      if (data.tags && data.tags.length > 0) {
        for (const tagName of data.tags) {
          // Remove # if present
          const cleanTagName = tagName.startsWith('#') ? tagName.substring(1) : tagName;
          
          // Check if tag exists
          let tagResult = await pool.request()
            .input('tagName', sql.NVarChar, cleanTagName)
            .query('SELECT TagID FROM dbo.Tags WHERE TagName = @tagName');

          let tagId;
          if (tagResult.recordset.length > 0) {
            tagId = tagResult.recordset[0].TagID;
          } else {
            // Create new tag
            const newTagResult = await pool.request()
              .input('tagName', sql.NVarChar, cleanTagName)
              .query('INSERT INTO dbo.Tags (TagName, CreatedAt) OUTPUT INSERTED.TagID VALUES (@tagName, GETDATE())');
            tagId = newTagResult.recordset[0].TagID;
          }

          // Link tag to post
          await pool.request()
            .input('postId', sql.Int, newPost.PostID)
            .input('tagId', sql.Int, tagId)
            .query('INSERT INTO dbo.Post_Tags (PostID, TagID) VALUES (@postId, @tagId)');
        }
      }

      // Get user info and tags for response
      const userResult = await pool.request()
        .input('userId', sql.Int, data.UserID)
        .query('SELECT Username, FullName FROM dbo.Users WHERE UserID = @userId');

      const user = userResult.recordset[0];

      const tagsResult = await pool.request()
        .input('postId', sql.Int, newPost.PostID)
        .query(`
          SELECT t.TagName
          FROM dbo.Tags t
          INNER JOIN dbo.Post_Tags pt ON t.TagID = pt.TagID
          WHERE pt.PostID = @postId
        `);

      // Get images
      const images = await mediaService.getMediaByEntity('Post', newPost.PostID);

      return {
        postId: newPost.PostID,
        title: newPost.Title,
        content: newPost.Content,
        userId: newPost.UserID,
        username: user.Username,
        fullName: user.FullName,
        
        createdAt: newPost.CreatedAt,
        tags: tagsResult.recordset.map((t: any) => `#${t.TagName}`),
        images: images.map((img: Media) => img.FilePath),
        reactions: 0,
        comments: 0
      };
    } catch (error) {
      console.error('Error in createPost:', error);
      throw new Error('Failed to create post');
    }
  }

  // Xóa bài viết
  async deletePost(postId: number, userId: number): Promise<void> {
    try {
      const pool = await getConnection();

      // Kiểm tra post có tồn tại và thuộc về user không
      const checkResult = await pool.request()
        .input('postId', sql.Int, postId)
        .input('userId', sql.Int, userId)
        .query(`
          SELECT PostID, UserID FROM dbo.Posts 
          WHERE PostID = @postId AND UserID = @userId
        `);

      if (checkResult.recordset.length === 0) {
        throw new Error('Post not found or you do not have permission to delete this post');
      }

      // Xóa các bảng liên quan theo thứ tự (tránh foreign key constraint)
      
      // 1. Xóa Post_Tags
      await pool.request()
        .input('postId', sql.Int, postId)
        .query(`DELETE FROM dbo.Post_Tags WHERE PostID = @postId`);

      // 2. Xóa Comments (và reactions của comments)
      // Lấy danh sách comment IDs trước
      const commentsResult = await pool.request()
        .input('postId', sql.Int, postId)
        .query(`SELECT CommentID FROM dbo.Comments WHERE PostID = @postId`);
      
      const commentIds = commentsResult.recordset.map((c: any) => c.CommentID);
      
      if (commentIds.length > 0) {
        // Xóa reactions của comments
        await pool.request()
          .input('postId', sql.Int, postId)
          .query(`
            DELETE FROM dbo.Reactions 
            WHERE TargetType = 'Comment' 
            AND TargetID IN (SELECT CommentID FROM dbo.Comments WHERE PostID = @postId)
          `);
        
        // Xóa comments
        await pool.request()
          .input('postId', sql.Int, postId)
          .query(`DELETE FROM dbo.Comments WHERE PostID = @postId`);
      }

      // 3. Xóa Reactions của Post
      await pool.request()
        .input('postId', sql.Int, postId)
        .query(`DELETE FROM dbo.Reactions WHERE TargetType = 'Post' AND TargetID = @postId`);

      // 4. Xóa Notifications liên quan đến Post
      await pool.request()
        .input('postId', sql.Int, postId)
        .query(`
          DELETE FROM dbo.Notifications 
          WHERE SourceID = @postId
        `);

      // 5. Xóa Media mappings và soft delete media
      await pool.request()
        .input('postId', sql.Int, postId)
        .query(`
          UPDATE dbo.Media 
          SET IsActive = 0 
          WHERE MediaID IN (
            SELECT MediaID FROM dbo.Media_Entity_Mapping 
            WHERE EntityType = 'Post' AND EntityID = @postId
          )
        `);

      await pool.request()
        .input('postId', sql.Int, postId)
        .query(`DELETE FROM dbo.Media_Entity_Mapping WHERE EntityType = 'Post' AND EntityID = @postId`);

      // 6. Cuối cùng xóa Post
      await pool.request()
        .input('postId', sql.Int, postId)
        .query(`DELETE FROM dbo.Posts WHERE PostID = @postId`);

    } catch (error) {
      console.error('Error in deletePost:', error);
      throw error;
    }
  }

  // Cập nhật bài viết
  async updatePost(postId: number, userId: number, data: { Title?: string; Content?: string; tags?: string[] }): Promise<PostWithUser> {
    try {
      const pool = await getConnection();

      // Kiểm tra post có tồn tại và thuộc về user không
      const checkResult = await pool.request()
        .input('postId', sql.Int, postId)
        .input('userId', sql.Int, userId)
        .query(`
          SELECT PostID, UserID FROM dbo.Posts 
          WHERE PostID = @postId AND UserID = @userId
        `);

      if (checkResult.recordset.length === 0) {
        throw new Error('Post not found or you do not have permission to update this post');
      }

      // Update post
      if (data.Title || data.Content) {
        let updateQuery = 'UPDATE dbo.Posts SET ';
        const updates: string[] = [];
        const request = pool.request();

        if (data.Title) {
          updates.push('Title = @title');
          request.input('title', sql.NVarChar, data.Title);
        }
        if (data.Content) {
          updates.push('Content = @content');
          request.input('content', sql.NVarChar, data.Content);
        }

        updateQuery += updates.join(', ') + ' WHERE PostID = @postId';
        request.input('postId', sql.Int, postId);
        
        await request.query(updateQuery);
      }

      // Update tags if provided
      if (data.tags && data.tags.length > 0) {
        // Xóa tags cũ
        await pool.request()
          .input('postId', sql.Int, postId)
          .query(`DELETE FROM dbo.Post_Tags WHERE PostID = @postId`);

        // Thêm tags mới
        for (const tagName of data.tags) {
          const cleanTag = tagName.replace('#', '');
          
          // Kiểm tra hoặc tạo tag
          let tagResult = await pool.request()
            .input('tagName', sql.NVarChar, cleanTag)
            .query(`SELECT TagID FROM dbo.Tags WHERE TagName = @tagName`);

          let tagId;
          if (tagResult.recordset.length === 0) {
            const newTagResult = await pool.request()
              .input('tagName', sql.NVarChar, cleanTag)
              .query(`
                INSERT INTO dbo.Tags (TagName) 
                OUTPUT INSERTED.TagID
                VALUES (@tagName)
              `);
            tagId = newTagResult.recordset[0].TagID;
          } else {
            tagId = tagResult.recordset[0].TagID;
          }

          // Link tag với post
          await pool.request()
            .input('postId', sql.Int, postId)
            .input('tagId', sql.Int, tagId)
            .query(`INSERT INTO dbo.Post_Tags (PostID, TagID) VALUES (@postId, @tagId)`);
        }
      }

      // Lấy post đã update
      const updatedPostResult = await pool.request()
        .input('postId', sql.Int, postId)
        .query(`
          SELECT 
            p.PostID, p.Title, p.Content, p.UserID, p.CreatedAt,
            u.Username, u.FullName
          FROM dbo.Posts p
          INNER JOIN dbo.Users u ON p.UserID = u.UserID
          WHERE p.PostID = @postId
        `);

      const post = updatedPostResult.recordset[0];

      // Get tags
      const tagsResult = await pool.request()
        .input('postId', sql.Int, postId)
        .query(`
          SELECT t.TagName
          FROM dbo.Tags t
          INNER JOIN dbo.Post_Tags pt ON t.TagID = pt.TagID
          WHERE pt.PostID = @postId
        `);

      // Get images
      const images = await mediaService.getMediaByEntity('Post', postId);

      // Get reactions and comments count
      const statsResult = await pool.request()
        .input('postId', sql.Int, postId)
        .query(`
          SELECT 
            (SELECT COUNT(*) FROM dbo.Reactions WHERE TargetID = @postId AND TargetType = 'Post') as reactions,
            (SELECT COUNT(*) FROM dbo.Comments WHERE PostID = @postId) as comments
        `);

      return {
        postId: post.PostID,
        title: post.Title,
        content: post.Content,
        userId: post.UserID,
        username: post.Username,
        fullName: post.FullName,
        createdAt: post.CreatedAt,
        tags: tagsResult.recordset.map((t: any) => `#${t.TagName}`),
        images: images.map((img: Media) => img.FilePath),
        reactions: statsResult.recordset[0].reactions,
        comments: statsResult.recordset[0].comments
      };
    } catch (error) {
      console.error('Error in updatePost:', error);
      throw error;
    }
  }
}

export default new PostService();
