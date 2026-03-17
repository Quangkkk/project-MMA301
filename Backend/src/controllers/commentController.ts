import { Request, Response } from 'express';
import commentService from '../services/commentService';
import { userBanService } from '../services/userBanService';

// Lấy comments của post
export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const userId = (req as any).user?.userId;

    const comments = await commentService.getCommentsByPost(
      parseInt(postId),
      userId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.status(200).json({
      data: comments,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: comments.length
      }
    });
  } catch (error: any) {
    console.error('Error in getComments controller:', error);
    res.status(500).json({ 
      message: 'Failed to get comments',
      error: error.message 
    });
  }
};

// Thêm comment
export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Kiểm tra user có bị cấm bình luận không
    const banStatus = await userBanService.checkUserBans(userId);
    if (!banStatus.canComment) {
      res.status(403).json({ 
        success: false,
        message: 'Bạn đã bị cấm bình luận. Vui lòng kiểm tra thông báo để biết thêm chi tiết.' 
      });
      return;
    }

    if (!content || content.trim().length === 0) {
      res.status(400).json({ message: 'Content is required' });
      return;
    }

    const comment = await commentService.addComment(
      parseInt(postId),
      userId,
      content,
      parentCommentId ? parseInt(parentCommentId) : undefined
    );

    res.status(201).json({
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error: any) {
    console.error('Error in addComment controller:', error);
    res.status(500).json({ 
      message: 'Failed to add comment',
      error: error.message 
    });
  }
};

// Xóa comment
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    await commentService.deleteComment(
      parseInt(commentId),
      userId
    );

    res.status(200).json({
      message: 'Comment deleted successfully'
    });
  } catch (error: any) {
    console.error('Error in deleteComment controller:', error);
    const status = error.message.includes('Unauthorized') ? 403 : 500;
    res.status(status).json({ 
      message: error.message || 'Failed to delete comment'
    });
  }
};

// Cập nhật comment
export const updateComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Kiểm tra user có bị cấm bình luận không (cấm comment cũng cấm edit)
    const banStatus = await userBanService.checkUserBans(userId);
    if (!banStatus.canComment) {
      res.status(403).json({ 
        success: false,
        message: 'Bạn đã bị cấm chỉnh sửa bình luận. Vui lòng kiểm tra thông báo để biết thêm chi tiết.' 
      });
      return;
    }

    if (!content || content.trim().length === 0) {
      res.status(400).json({ message: 'Content is required' });
      return;
    }

    const comment = await commentService.updateComment(
      parseInt(commentId),
      userId,
      content
    );

    res.status(200).json({
      message: 'Comment updated successfully',
      data: comment
    });
  } catch (error: any) {
    console.error('Error in updateComment controller:', error);
    const status = error.message.includes('Unauthorized') ? 403 : 500;
    res.status(status).json({ 
      message: error.message || 'Failed to update comment'
    });
  }
};
// Lấy lịch sử sửa comment
export const getCommentEditHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;

    const history = await commentService.getCommentEditHistory(parseInt(commentId));

    res.status(200).json({
      data: history
    });
  } catch (error: any) {
    console.error('Error in getCommentEditHistory controller:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to get comment edit history'
    });
  }
};