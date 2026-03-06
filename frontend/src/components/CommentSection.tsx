import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import commentService, { Comment } from '../services/commentService';
import { ReactionButton } from './ReactionButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import reportService from '../services/reportService';
import BanAlertModal from './BanAlertModal';
import { useBanCheck } from '../hooks/useBanCheck';

interface CommentSectionProps {
  postId: number;
  isVisible: boolean;
  onClose: () => void;
  onCommentCountChange?: (count: number) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  isVisible,
  onClose,
  onCommentCountChange
}) => {
  const navigation = useNavigation();
  const { banStatus, showBanModal, closeBanModal, recheckBanStatus } = useBanCheck();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [editHistory, setEditHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyingToName, setReplyingToName] = useState<string>('');
  const [replyParentId, setReplyParentId] = useState<number | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (isVisible && token !== null) {
      loadComments();
    }
  }, [isVisible, token]);

  const loadToken = async () => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      setToken(authToken);
    } catch (error) {
      console.error('Error loading token:', error);
    }
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await commentService.getCommentsByPost(
        postId,
        token || undefined
      );
      setComments(data);
      onCommentCountChange?.(data.length);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!token) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để bình luận');
      return;
    }

    if (newComment.trim().length === 0) return;

    try {
      setSending(true);
      // Add @mention if replying
      const finalContent = replyingToId 
        ? `@${replyingToName} ${newComment.trim()}`
        : newComment.trim();
      
      // Use replyParentId for nesting (all replies under same parent)
      await commentService.addComment(postId, finalContent, token, replyParentId || undefined);
      setNewComment('');
      setReplyingToId(null);
      setReplyingToName('');
      setReplyParentId(null);
      await loadComments();
    } catch (error: any) {
      console.log('[CommentSection] Error caught:', error);
      console.log('[CommentSection] error.status:', error.status);
      console.log('[CommentSection] error.response?.status:', error.response?.status);
      // Xử lý lỗi 403 - bị ban
      if (error.status === 403 || error.response?.status === 403) {
        console.log('[CommentSection] Detected 403, calling recheckBanStatus');
        // Hiện modal ban với thông tin chi tiết
        await recheckBanStatus();
      } else {
        // Lỗi khác - hiện Alert và log
        console.error('Error adding comment:', error);
        Alert.alert('Lỗi', 'Không thể thêm bình luận');
      }
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = (commentId: number) => {
    if (!token) return;
    setCommentToDelete(commentId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!token || !commentToDelete) return;

    try {
      await commentService.deleteComment(commentToDelete, token);
      setDeleteModalVisible(false);
      setCommentToDelete(null);
      await loadComments();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Không thể xóa bình luận';
      Alert.alert('Lỗi', errorMsg);
      setDeleteModalVisible(false);
      setCommentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setCommentToDelete(null);
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.commentId);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!token || editContent.trim().length === 0) return;

    try {
      setSending(true);
      await commentService.updateComment(commentId, editContent.trim(), token);
      setEditingCommentId(null);
      setEditContent('');
      await loadComments();
    } catch (error: any) {
      console.log('[CommentSection] Edit error caught:', error);
      console.log('[CommentSection] error.status:', error.status);
      // Xử lý lỗi 403 - bị ban
      if (error.status === 403 || error.response?.status === 403) {
        console.log('[CommentSection] Edit detected 403, calling recheckBanStatus');
        // Hiện modal ban với thông tin chi tiết
        await recheckBanStatus();
      } else {
        // Lỗi khác - hiện Alert và log
        console.error('Error updating comment:', error);
        Alert.alert('Lỗi', 'Không thể cập nhật bình luận');
      }
    } finally {
      setSending(false);
    }
  };

  const handleViewHistory = async (commentId: number) => {
    try {
      setLoadingHistory(true);
      setHistoryModalVisible(true);
      const history = await commentService.getCommentEditHistory(commentId);
      setEditHistory(history);
    } catch (error) {
      console.error('Error fetching history:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử');
      setHistoryModalVisible(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins}p`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const getInitials = (fullName: string) => {
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return fullName.substring(0, 2);
  };

  const getUserId = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch {
      return null;
    }
  };

  const organizeComments = () => {
    const parentComments = comments.filter(c => !c.parentCommentId);
    const childComments = comments.filter(c => c.parentCommentId);
    
    return parentComments.map(parent => ({
      ...parent,
      replies: childComments.filter(child => child.parentCommentId === parent.commentId)
    }));
  };

  const toggleReplies = (commentId: number) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleUserPress = (comment: Comment) => {
    (navigation as any).navigate('UserProfile', {
      userId: comment.userId,
      fullName: comment.fullName,
      avatarURL: comment.avatarURL
    });
  };

  const handleReportComment = (commentId: number) => {
    setReportingCommentId(commentId);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do báo cáo');
      return;
    }

    if (!reportingCommentId) return;

    setReportLoading(true);
    try {
      await reportService.createReport({
        targetID: reportingCommentId,
        targetType: 'Comment',
        reason: reportReason.trim()
      });
      
      setShowReportModal(false);
      setReportReason('');
      setReportingCommentId(null);
      setShowSuccessModal(true);
    } catch (error: any) {
      // Xử lý lỗi 403 - bị ban report
      if (error.status === 403) {
        setShowReportModal(false);
        setReportReason('');
        setReportingCommentId(null);
        // Hiện modal ban với thông tin chi tiết
        await recheckBanStatus();
      } else {
        // Lỗi khác - hiện Alert và log
        console.error('Report error:', error);
        Alert.alert('Lỗi', error.message || 'Không thể gửi báo cáo');
      }
    } finally {
      setReportLoading(false);
    }
  };

  const renderCommentText = (content: string) => {
    // Match @mentions with max 2-3 words (typical Vietnamese name length)
    // Examples: @Lê Văn C, @Nguyễn A, @John Doe
    const mentionRegex = /(@[\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+){0,2}(?=\s|$))/gu;
    const parts = content.split(mentionRegex);
    
    return (
      <Text style={styles.commentText}>
        {parts.map((part, i) => {
          if (!part) return null;
          
          if (part.startsWith('@')) {
            // Tag/mention - blue color
            return (
              <Text 
                key={i} 
                style={styles.mentionText}
              >
                {part}
              </Text>
            );
          }
          
          // Regular comment text - black color
          return (
            <Text 
              key={i} 
              style={styles.normalText}
            >
              {part}
            </Text>
          );
        })}
      </Text>
    );
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bình luận</Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialCommunityIcons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Comments List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#1877f2" />
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có bình luận nào</Text>
        </View>
      ) : (
        <View style={styles.commentsList}>
          {organizeComments().map((parentComment) => {
            const isMyComment = parentComment.userId === getUserId();
            const isEditing = editingCommentId === parentComment.commentId;
            
            return (
              <View key={parentComment.commentId}>
                {/* Parent Comment */}
                <View style={styles.commentItem}>
                  <TouchableOpacity onPress={() => handleUserPress(parentComment)}>
                    {parentComment.avatarURL ? (
                      <Image source={{ uri: parentComment.avatarURL }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarText}>{getInitials(parentComment.fullName)}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={styles.commentContent}>
                    <View style={styles.commentBubble}>
                      <TouchableOpacity 
                        style={styles.commentHeader}
                        onPress={() => handleUserPress(parentComment)}
                      >
                        <Text style={styles.authorName}>
                          {isMyComment ? 'You' : parentComment.fullName}
                        </Text>
                      </TouchableOpacity>
                      {isEditing ? (
                        <TextInput
                          style={styles.editInput}
                          value={editContent}
                          onChangeText={setEditContent}
                          multiline
                          autoFocus
                        />
                      ) : (
                        <View>
                          {renderCommentText(parentComment.content)}
                          {parentComment.isEdited && (
                            <TouchableOpacity 
                              onPress={() => handleViewHistory(parentComment.commentId)}
                              style={styles.editedBadge}
                            >
                              <Text style={styles.editedText}>(đã chỉnh sửa)</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                    {isEditing ? (
                      <View style={styles.editActions}>
                        <TouchableOpacity onPress={handleCancelEdit}>
                          <Text style={styles.cancelButton}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleSaveEdit(parentComment.commentId)}
                          disabled={sending || !editContent.trim()}
                        >
                          <Text style={[styles.saveButton, (!editContent.trim() || sending) && styles.disabledButton]}>
                            {sending ? 'Đang lưu...' : 'Lưu'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.commentFooter}>
                        <ReactionButton
                          targetId={parentComment.commentId}
                          targetType="Comment"
                          initialReactions={parentComment.reactions}
                        />
                        <Text style={styles.commentTime}>{formatDate(parentComment.createdAt)}</Text>
                        <TouchableOpacity onPress={() => {
                          setReplyingToId(parentComment.commentId);
                          setReplyingToName(parentComment.fullName);
                          setReplyParentId(parentComment.commentId); // Reply to parent
                        }}>
                          <Text style={styles.replyButton}>Trả lời</Text>
                        </TouchableOpacity>
                        {isMyComment ? (
                          <>
                            <TouchableOpacity onPress={() => handleStartEdit(parentComment)}>
                              <Text style={styles.editButton}>Sửa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteComment(parentComment.commentId)}>
                              <Text style={styles.deleteButton}>Xóa</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <TouchableOpacity onPress={() => handleReportComment(parentComment.commentId)}>
                            <Text style={styles.reportButton}>Báo cáo</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {/* View Replies Button */}
                {parentComment.replies && parentComment.replies.length > 0 && !expandedComments.has(parentComment.commentId) && (
                  <TouchableOpacity 
                    style={styles.viewRepliesButton}
                    onPress={() => toggleReplies(parentComment.commentId)}
                  >
                    <MaterialCommunityIcons name="comment-outline" size={16} color="#65676b" />
                    <Text style={styles.viewRepliesText}>
                      Xem {parentComment.replies.length} câu trả lời
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Replies */}
                {parentComment.replies && expandedComments.has(parentComment.commentId) && parentComment.replies.map((reply: any) => {
                  const isMyReply = reply.userId === getUserId();
                  const isEditingReply = editingCommentId === reply.commentId;
                  
                  return (
                    <View key={reply.commentId} style={[styles.commentItem, styles.replyItem]}>
                      <TouchableOpacity onPress={() => handleUserPress(reply)}>
                        {reply.avatarURL ? (
                          <Image source={{ uri: reply.avatarURL }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>{getInitials(reply.fullName)}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <View style={styles.commentContent}>
                        <View style={styles.commentBubble}>
                          <TouchableOpacity 
                            style={styles.commentHeader}
                            onPress={() => handleUserPress(reply)}
                          >
                            <Text style={styles.authorName}>
                              {isMyReply ? 'You' : reply.fullName}
                            </Text>
                          </TouchableOpacity>
                          {isEditingReply ? (
                            <TextInput
                              style={styles.editInput}
                              value={editContent}
                              onChangeText={setEditContent}
                              multiline
                              autoFocus
                            />
                          ) : (
                            <View>
                              {renderCommentText(reply.content)}
                              {reply.isEdited && (
                                <TouchableOpacity 
                                  onPress={() => handleViewHistory(reply.commentId)}
                                  style={styles.editedBadge}
                                >
                                  <Text style={styles.editedText}>(đã chỉnh sửa)</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          )}
                        </View>
                        {isEditingReply ? (
                          <View style={styles.editActions}>
                            <TouchableOpacity onPress={handleCancelEdit}>
                              <Text style={styles.cancelButton}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => handleSaveEdit(reply.commentId)}
                              disabled={sending || !editContent.trim()}
                            >
                              <Text style={[styles.saveButton, (!editContent.trim() || sending) && styles.disabledButton]}>
                                {sending ? 'Đang lưu...' : 'Lưu'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.commentFooter}>
                            <ReactionButton
                              targetId={reply.commentId}
                              targetType="Comment"
                              initialReactions={reply.reactions}
                            />
                            <Text style={styles.commentTime}>{formatDate(reply.createdAt)}</Text>
                            <TouchableOpacity onPress={() => {
                              setReplyingToId(reply.commentId);
                              setReplyingToName(reply.fullName);
                              setReplyParentId(parentComment.commentId); // Keep same parent for flat structure
                            }}>
                              <Text style={styles.replyButton}>Trả lời</Text>
                            </TouchableOpacity>
                            {isMyReply ? (
                              <>
                                <TouchableOpacity onPress={() => handleStartEdit(reply)}>
                                  <Text style={styles.editButton}>Sửa</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteComment(reply.commentId)}>
                                  <Text style={styles.deleteButton}>Xóa</Text>
                                </TouchableOpacity>
                              </>
                            ) : (
                              <TouchableOpacity onPress={() => handleReportComment(reply.commentId)}>
                                <Text style={styles.reportButton}>Báo cáo</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}

                {/* Hide Replies Button */}
                {parentComment.replies && parentComment.replies.length > 0 && expandedComments.has(parentComment.commentId) && (
                  <TouchableOpacity 
                    style={styles.hideRepliesButton}
                    onPress={() => toggleReplies(parentComment.commentId)}
                  >
                    <Text style={styles.hideRepliesText}>Ẩn câu trả lời</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Input Box */}
      <View style={styles.inputContainer}>
        {replyingToId && (
          <View style={styles.replyingToContainer}>
            <View style={styles.replyingToContent}>
              <MaterialCommunityIcons name="reply" size={14} color="#1877f2" />
              <Text style={styles.replyingToText}>Trả lời <Text style={styles.replyingToName}>@{replyingToName}</Text></Text>
            </View>
            <TouchableOpacity onPress={() => {
              setReplyingToId(null);
              setReplyingToName('');
              setReplyParentId(null);
            }} style={styles.replyingToClose}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#65676b" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={replyingToId ? `Trả lời ${replyingToName}...` : "Viết bình luận..."}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newComment.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleAddComment}
            disabled={!newComment.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit History Modal */}
      <Modal
        visible={historyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lịch sử chỉnh sửa</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {loadingHistory ? (
                <ActivityIndicator size="small" color="#1877f2" style={{ marginTop: 20 }} />
              ) : editHistory.length === 0 ? (
                <Text style={styles.emptyHistoryText}>Chưa có lịch sử chỉnh sửa</Text>
              ) : (
                editHistory.map((h: any, index: number) => (
                  <View key={h.editHistoryId} style={styles.historyItem}>
                    <Text style={styles.historyTime}>{formatDate(h.editedAt)}</Text>
                    <Text style={styles.historyContent}>{h.oldContent}</Text>
                    {index < editHistory.length - 1 && <View style={styles.historyDivider} />}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#f02849" />
            </View>
            <Text style={styles.deleteModalTitle}>Xác nhận xóa</Text>
            <Text style={styles.deleteModalMessage}>
              Bạn có chắc chắn muốn xóa bình luận này?
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelDelete}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmDeleteButtonText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.reportModalOverlay}>
          <View style={styles.reportModalContainer}>
            <View style={styles.reportModalHeader}>
              <Text style={styles.reportModalTitle}>Báo cáo bình luận</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.reportModalLabel}>Lý do báo cáo:</Text>
            <TextInput
              style={styles.reportTextInput}
              placeholder="Nhập lý do báo cáo (spam, ngôn từ không phù hợp...)"
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.reportModalButtons}>
              <TouchableOpacity
                style={styles.reportCancelButton}
                onPress={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportingCommentId(null);
                }}
              >
                <Text style={styles.reportCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reportSubmitButton, reportLoading && { opacity: 0.6 }]}
                onPress={handleSubmitReport}
                disabled={reportLoading}
              >
                <Text style={styles.reportSubmitText}>
                  {reportLoading ? 'Đang gửi...' : 'Gửi báo cáo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContainer}>
            <View style={styles.successIconContainer}>
              <MaterialCommunityIcons name="check-circle" size={60} color="#fff" />
            </View>
            
            <Text style={styles.successModalTitle}>Thành công!</Text>
            <Text style={styles.successModalMessage}>
              Báo cáo của bạn đã được gửi thành công. Chúng tôi sẽ xem xét và xử lý trong thời gian sớm nhất.
            </Text>
            
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successModalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Ban Alert Modal */}
      <BanAlertModal
        visible={showBanModal}
        bans={banStatus?.activeBans || []}
        onClose={closeBanModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000'
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center'
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#999'
  },
  commentsList: {
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start'
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    marginRight: 8
  },
  avatarPlaceholder: {
    backgroundColor: '#1877f2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  commentContent: {
    flex: 1
  },
  commentBubble: {
    backgroundColor: '#f0f2f5',
    borderRadius: 16,
    padding: 10,
    marginBottom: 4
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000'
  },
  editedBadge: {
    marginTop: 2
  },
  editedText: {
    fontSize: 11,
    color: '#65676b',
    fontStyle: 'italic'
  },
  commentText: {
    fontSize: 13,
    color: '#050505',
    lineHeight: 18,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  normalText: {
    fontSize: 13,
    color: '#000000',  // Black color for regular comment text
    lineHeight: 18,
    fontWeight: '400'
  },
  mentionText: {
    fontSize: 13,
    color: '#1877f2',  // Blue color for @mentions/tags
    fontWeight: '700',
    lineHeight: 18
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 10
  },
  commentTime: {
    fontSize: 11,
    color: '#65676b',
    flex: 1
  },
  editButton: {
    fontSize: 11,
    color: '#1877f2',
    fontWeight: '600'
  },
  deleteButton: {
    fontSize: 11,
    color: '#f02849',
    fontWeight: '600'
  },
  replyButton: {
    fontSize: 11,
    color: '#1877f2',
    fontWeight: '600'
  },
  editInput: {
    fontSize: 13,
    color: '#050505',
    lineHeight: 18,
    minHeight: 40,
    padding: 0
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    gap: 12,
    marginTop: 4
  },
  cancelButton: {
    fontSize: 12,
    color: '#65676b',
    fontWeight: '600'
  },
  saveButton: {
    fontSize: 12,
    color: '#1877f2',
    fontWeight: '600'
  },
  disabledButton: {
    color: '#ccc'
  },
  replyItem: {
    marginLeft: 40,
    borderLeftWidth: 2,
    borderLeftColor: '#e4e6eb',
    paddingLeft: 8
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1877f2'
  },
  replyingToContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1
  },
  replyingToText: {
    fontSize: 12,
    color: '#65676b'
  },
  replyingToName: {
    fontSize: 12,
    color: '#1877f2',
    fontWeight: '600'
  },
  replyingToClose: {
    padding: 2
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end'
  },
  input: {
    flex: 1,
    maxHeight: 80,
    borderRadius: 18,
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    marginRight: 8
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1877f2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000'
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 12
  },
  historyItem: {
    paddingVertical: 12
  },
  historyTime: {
    fontSize: 12,
    color: '#65676b',
    marginBottom: 6,
    fontWeight: '600'
  },
  historyContent: {
    fontSize: 14,
    color: '#050505',
    lineHeight: 20
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 12
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20
  },
  viewRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 48,
    gap: 6
  },
  viewRepliesText: {
    fontSize: 13,
    color: '#65676b',
    fontWeight: '600'
  },
  hideRepliesButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 48
  },
  hideRepliesText: {
    fontSize: 13,
    color: '#65676b',
    fontWeight: '600'
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  deleteModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  deleteModalHeader: {
    marginBottom: 16
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center'
  },
  deleteModalMessage: {
    fontSize: 15,
    color: '#65676b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#050505'
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f02849',
    alignItems: 'center'
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },
  reportButton: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600'
  },
  // Report Modal Styles
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reportModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  reportModalLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  reportTextInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 16,
  },
  reportModalButtons: {
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  successModalMessage: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 24,
  },
  successModalButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    backgroundColor: '#10b981',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  successModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
    flexDirection: 'row',
    gap: 12,
  },
  reportCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  reportCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  reportSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  reportSubmitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
