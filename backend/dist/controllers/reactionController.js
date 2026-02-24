"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReactionUsers = exports.getReactionSummary = exports.removeReaction = exports.addReaction = void 0;
const reactionService_1 = __importDefault(require("../services/reactionService"));
// Thêm hoặc cập nhật reaction
const addReaction = async (req, res) => {
    try {
        const { targetId, targetType, reactionType } = req.body;
        const userId = req.user?.userId;
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
        const reaction = await reactionService_1.default.addReaction(userId, targetId, targetType, reactionType);
        res.status(200).json({
            message: 'Reaction added successfully',
            data: reaction
        });
    }
    catch (error) {
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
exports.addReaction = addReaction;
// Xóa reaction
const removeReaction = async (req, res) => {
    try {
        const { targetId, targetType } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        await reactionService_1.default.removeReaction(userId, parseInt(targetId), targetType);
        res.status(200).json({
            message: 'Reaction removed successfully'
        });
    }
    catch (error) {
        console.error('Error in removeReaction controller:', error);
        res.status(500).json({
            message: 'Failed to remove reaction',
            error: error.message
        });
    }
};
exports.removeReaction = removeReaction;
// Lấy tổng hợp reactions
const getReactionSummary = async (req, res) => {
    try {
        const { targetId, targetType } = req.params;
        const userId = req.user?.userId;
        const summary = await reactionService_1.default.getReactionSummary(parseInt(targetId), targetType, userId);
        res.status(200).json({
            data: summary
        });
    }
    catch (error) {
        console.error('Error in getReactionSummary controller:', error);
        res.status(500).json({
            message: 'Failed to get reaction summary',
            error: error.message
        });
    }
};
exports.getReactionSummary = getReactionSummary;
// Lấy danh sách users đã react
const getReactionUsers = async (req, res) => {
    try {
        const { targetId, targetType } = req.params;
        const { reactionType, limit } = req.query;
        const users = await reactionService_1.default.getReactionUsers(parseInt(targetId), targetType, reactionType, limit ? parseInt(limit) : 50);
        res.status(200).json({
            data: users
        });
    }
    catch (error) {
        console.error('Error in getReactionUsers controller:', error);
        res.status(500).json({
            message: 'Failed to get reaction users',
            error: error.message
        });
    }
};
exports.getReactionUsers = getReactionUsers;
//# sourceMappingURL=reactionController.js.map