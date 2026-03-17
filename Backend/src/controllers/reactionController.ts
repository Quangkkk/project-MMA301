import { Request, Response } from 'express';
import reactionService from '../services/reactionService';

// Thêm hoặc cập nhật reaction
export const addReaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetId, targetType, reactionType } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!targetId || !targetType || !reactionType) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    if (!['Post', 'Comment'].includes(targetType)) {
      res.status(400).json({ message: 'Invalid target type' });
      return;
    }

    const reaction = await reactionService.addReaction(
      userId,
      targetId,
      targetType,
      reactionType
    );

    res.status(200).json({
      message: 'Reaction added successfully',
      data: reaction
    });
  } catch (error: any) {
    if (error.message === 'REACTION_REMOVED') {
      res.status(200).json({
        message: 'Reaction removed successfully'
      });
      return;
    }
    console.error('Error in addReaction controller:', error);
    res.status(500).json({ 
      message: 'Failed to add reaction',
      error: error.message 
    });
  }
};

// Xóa reaction
export const removeReaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetId, targetType } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    await reactionService.removeReaction(
      userId,
      parseInt(targetId),
      targetType as 'Post' | 'Comment'
    );

    res.status(200).json({
      message: 'Reaction removed successfully'
    });
  } catch (error: any) {
    console.error('Error in removeReaction controller:', error);
    res.status(500).json({ 
      message: 'Failed to remove reaction',
      error: error.message 
    });
  }
};

// Lấy tổng hợp reactions
export const getReactionSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetId, targetType } = req.params;
    const userId = (req as any).user?.userId;

    const summary = await reactionService.getReactionSummary(
      parseInt(targetId),
      targetType as 'Post' | 'Comment',
      userId
    );

    res.status(200).json({
      data: summary
    });
  } catch (error: any) {
    console.error('Error in getReactionSummary controller:', error);
    res.status(500).json({ 
      message: 'Failed to get reaction summary',
      error: error.message 
    });
  }
};

// Lấy danh sách users đã react
export const getReactionUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetId, targetType } = req.params;
    const { reactionType, limit } = req.query;

    const users = await reactionService.getReactionUsers(
      parseInt(targetId),
      targetType as 'Post' | 'Comment',
      reactionType as string | undefined,
      limit ? parseInt(limit as string) : 50
    );

    res.status(200).json({
      data: users
    });
  } catch (error: any) {
    console.error('Error in getReactionUsers controller:', error);
    res.status(500).json({ 
      message: 'Failed to get reaction users',
      error: error.message 
    });
  }
};
