import { Request, Response } from 'express';
import postService from '../services/postService';import { userBanService } from '../services/userBanService';
export const postController = {
  // GET /api/posts?page=1&limit=20&tagId=1
  async getPosts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const tagId = req.query.tagId ? parseInt(req.query.tagId as string) : undefined;

      const posts = await postService.getPosts(page, limit, tagId);

      return res.status(200).json({
        success: true,
        data: posts,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit
        }
      });
    } catch (error: any) {
      console.error('Error in getPosts controller:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch posts'
      });
    }
  },

  // GET /api/posts/trending?limit=20
  async getTrendingPosts(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      const posts = await postService.getTrendingPosts(limit);

      return res.status(200).json({
        success: true,
        data: posts
      });
    } catch (error: any) {
      console.error('Error in getTrendingPosts controller:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch trending posts'
      });
    }
  },

  // GET /api/posts/following/:userId?page=1&limit=20
  async getFollowingPosts(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const posts = await postService.getFollowingPosts(userId, page, limit);

      return res.status(200).json({
        success: true,
        data: posts,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit
        }
      });
    } catch (error: any) {
      console.error('Error in getFollowingPosts controller:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch following posts'
      });
    }
  },

  // GET /api/posts/saved/:userId?page=1&limit=20
  async getSavedPosts(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const posts = await postService.getSavedPosts(userId, page, limit);

      return res.status(200).json({
        success: true,
        data: posts,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit
        }
      });
    } catch (error: any) {
      console.error('Error in getSavedPosts controller:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch saved posts'
      });
    }
  },

  // GET /api/users/:userId/stats
  async getUserStats(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const stats = await postService.getUserStats(userId);

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error in getUserStats controller:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch user stats'
      });
    }
  },

  // GET /api/tags/popular?limit=10
  async getPopularTags(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const tags = await postService.getPopularTags(limit);

      return res.status(200).json({
        success: true,
        data: tags
      });
    } catch (error: any) {
      console.error('Error in getPopularTags controller:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch popular tags'
      });
    }
  },

  // GET /api/posts/user/:userId?page=1&limit=20
  async getUserPosts(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const posts = await postService.getUserPosts(userId, page, limit);

      return res.status(200).json({
        success: true,
        data: posts,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit
        }
      });
    } catch (error: any) {
      console.error('Error in getUserPosts controller:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch user posts'
      });
    }
  },

  // POST /api/posts
  async createPost(req: Request, res: Response) {
    try {
      const { title, content, tags, mediaIds } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Kiểm tra user có bị cấm đăng bài không
      const banStatus = await userBanService.checkUserBans(userId);
      if (!banStatus.canPost) {
        return res.status(403).json({
          success: false,
          message: 'Bạn đã bị cấm đăng bài. Vui lòng kiểm tra thông báo để biết thêm chi tiết.'
        });
      }

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required'
        });
      }

      const post = await postService.createPost({
        UserID: userId,
        Title: title,
        Content: content,
        tags: tags || [],
        mediaIds: mediaIds || []
      });

      return res.status(201).json({
        success: true,
        data: post,
        message: 'Post created successfully'
      });
    } catch (error: any) {
      console.error('Error in createPost controller:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create post'
      });
    }
  },

  // DELETE /api/posts/:postId
  async deletePost(req: Request, res: Response) {
    try {
      const postId = parseInt(req.params.postId);
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: 'Post ID is required'
        });
      }

      await postService.deletePost(postId, userId);

      return res.status(200).json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error: any) {
      console.error('Error in deletePost controller:', error);
      return res.status(error.message?.includes('not found') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to delete post'
      });
    }
  },

  // PUT /api/posts/:postId
  async updatePost(req: Request, res: Response) {
    try {
      const postId = parseInt(req.params.postId);
      const userId = (req as any).user?.userId;
      const { title, content, tags } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Kiểm tra user có bị cấm đăng bài không (cấm đăng cũng cấm edit)
      const banStatus = await userBanService.checkUserBans(userId);
      if (!banStatus.canPost) {
        return res.status(403).json({
          success: false,
          message: 'Bạn đã bị cấm chỉnh sửa bài viết. Vui lòng kiểm tra thông báo để biết thêm chi tiết.'
        });
      }

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: 'Post ID is required'
        });
      }

      const post = await postService.updatePost(postId, userId, {
        Title: title,
        Content: content,
        tags: tags || []
      });

      return res.status(200).json({
        success: true,
        data: post,
        message: 'Post updated successfully'
      });
    } catch (error: any) {
      console.error('Error in updatePost controller:', error);
      return res.status(error.message?.includes('not found') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to update post'
      });
    }
  }
};
