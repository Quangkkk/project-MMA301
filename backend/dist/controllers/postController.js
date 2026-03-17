"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postController = void 0;
const postService_1 = __importDefault(require("../services/postService"));
exports.postController = {
    // GET /api/posts?page=1&limit=20&tagId=1
    async getPosts(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const tagId = req.query.tagId ? parseInt(req.query.tagId) : undefined;
            const posts = await postService_1.default.getPosts(page, limit, tagId);
            return res.status(200).json({
                success: true,
                data: posts,
                pagination: {
                    page,
                    limit,
                    hasMore: posts.length === limit
                }
            });
        }
        catch (error) {
            console.error('Error in getPosts controller:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch posts'
            });
        }
    },
    // GET /api/posts/trending?limit=20
    async getTrendingPosts(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const posts = await postService_1.default.getTrendingPosts(limit);
            return res.status(200).json({
                success: true,
                data: posts
            });
        }
        catch (error) {
            console.error('Error in getTrendingPosts controller:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch trending posts'
            });
        }
    },
    // GET /api/posts/following/:userId?page=1&limit=20
    async getFollowingPosts(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }
            const posts = await postService_1.default.getFollowingPosts(userId, page, limit);
            return res.status(200).json({
                success: true,
                data: posts,
                pagination: {
                    page,
                    limit,
                    hasMore: posts.length === limit
                }
            });
        }
        catch (error) {
            console.error('Error in getFollowingPosts controller:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch following posts'
            });
        }
    },
    // GET /api/posts/saved/:userId?page=1&limit=20
    async getSavedPosts(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }
            const posts = await postService_1.default.getSavedPosts(userId, page, limit);
            return res.status(200).json({
                success: true,
                data: posts,
                pagination: {
                    page,
                    limit,
                    hasMore: posts.length === limit
                }
            });
        }
        catch (error) {
            console.error('Error in getSavedPosts controller:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch saved posts'
            });
        }
    },
    // GET /api/users/:userId/stats
    async getUserStats(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }
            const stats = await postService_1.default.getUserStats(userId);
            return res.status(200).json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('Error in getUserStats controller:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch user stats'
            });
        }
    },
    // GET /api/tags/popular?limit=10
    async getPopularTags(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const tags = await postService_1.default.getPopularTags(limit);
            return res.status(200).json({
                success: true,
                data: tags
            });
        }
        catch (error) {
            console.error('Error in getPopularTags controller:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch popular tags'
            });
        }
    },
    // GET /api/posts/user/:userId?page=1&limit=20
    async getUserPosts(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }
            const posts = await postService_1.default.getUserPosts(userId, page, limit);
            return res.status(200).json({
                success: true,
                data: posts,
                pagination: {
                    page,
                    limit,
                    hasMore: posts.length === limit
                }
            });
        }
        catch (error) {
            console.error('Error in getUserPosts controller:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch user posts'
            });
        }
    },
    // POST /api/posts
    async createPost(req, res) {
        try {
            const { title, content, tags, mediaIds } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }
            if (!title || !content) {
                return res.status(400).json({
                    success: false,
                    message: 'Title and content are required'
                });
            }
            const post = await postService_1.default.createPost({
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
        }
        catch (error) {
            console.error('Error in createPost controller:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to create post'
            });
        }
    },
    // DELETE /api/posts/:postId
    async deletePost(req, res) {
        try {
            const postId = parseInt(req.params.postId);
            const userId = req.user?.userId;
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
            await postService_1.default.deletePost(postId, userId);
            return res.status(200).json({
                success: true,
                message: 'Post deleted successfully'
            });
        }
        catch (error) {
            console.error('Error in deletePost controller:', error);
            return res.status(error.message?.includes('not found') ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to delete post'
            });
        }
    },
    // PUT /api/posts/:postId
    async updatePost(req, res) {
        try {
            const postId = parseInt(req.params.postId);
            const userId = req.user?.userId;
            const { title, content, tags } = req.body;
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
            const post = await postService_1.default.updatePost(postId, userId, {
                Title: title,
                Content: content,
                tags: tags || []
            });
            return res.status(200).json({
                success: true,
                data: post,
                message: 'Post updated successfully'
            });
        }
        catch (error) {
            console.error('Error in updatePost controller:', error);
            return res.status(error.message?.includes('not found') ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to update post'
            });
        }
    }
};
//# sourceMappingURL=postController.js.map