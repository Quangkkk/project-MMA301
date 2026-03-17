import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import commentService, { Comment } from '../services/commentService';
import { ReactionButton } from '../components/ReactionButton';
import { PostCard } from '../components/PostCard';
import { postService, Post } from '../services/postService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BanAlertModal from '../components/BanAlertModal';
import { useBanCheck } from '../hooks/useBanCheck';

interface CommentScreenProps {
  route: {
    params: {
      postId: number;
      postTitle: string;
      highlightCommentId?: number;
    };
  };
  navigation: any;
}

export default function CommentScreen({ route, navigation }: CommentScreenProps) {
  const { postId, postTitle, highlightCommentId } = route.params;
  const { banStatus, showBanModal, closeBanModal, recheckBanStatus } = useBanCheck();
  const [comments, setComments] = useState<Comment[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | undefined>(highlightCommentId);
  const [replyingTo, setReplyingTo] = useState<{ name: string; commentId: number } | null>(null);
  const [replyParentId, setReplyParentId] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<{ commentId: number; content: string } | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [deletePostModalVisible, setDeletePostModalVisible] = useState(false);
  const [deletePostSuccessVisible, setDeletePostSuccessVisible] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const inputRef = React.useRef<TextInput>(null);

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (token !== null) {
      loadComments();
    }
  }, [token]);

  const loadToken = async () => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      setToken(authToken);
      if (authToken) {
        const decoded = JSON.parse(atob(authToken.split('.')[1]));
        setCurrentUserId(decoded.userId);
      }
    } catch (error) {
      console.error('Error loading token:', error);
    }
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const [commentsData, postsData] = await Promise.all([
        commentService.getCommentsByPost(postId, token || undefined),
        postService.getPosts(1, 100)
      ]);
      setComments(commentsData);
      const foundPost = postsData.posts.find(p => p.postId === postId);
      if (foundPost) {
        setPost(foundPost);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddComment = async () => {
    if (!token) {
      setErrorModal({ visible: true, title: 'Yêu cầu đăng nhập', message: 'Vui lòng đăng nhập để bình luận' });
      return;
    }

    if (newComment.trim().length === 0) {
      setErrorModal({ visible: true, title: 'Lỗi', message: 'Vui lòng nhập nội dung bình luận' });
      return;
    }

    try {
      setSending(true);
      
      if (editingComment) {
        // Update existing comment
        await commentService.updateComment(editingComment.commentId, newComment.trim(), token);
        setEditingComment(null);
      } else {
        // Add new comment with @mention if replying
        const finalContent = replyingTo 
          ? `@${replyingTo.name} ${newComment.trim()}`
          : newComment.trim();
        await commentService.addComment(postId, finalContent, token, replyParentId || undefined);
      }
      
      setNewComment('');
      setReplyingTo(null);
      setReplyParentId(null);
      await loadComments();
    } catch (error: any) {
      // Xử lý lỗi 403 - bị ban
      if (error.status === 403 || error.response?.status === 403) {
        // Hiện modal ban với thông tin chi tiết
        await recheckBanStatus();
      } else {
        // Lỗi khác - hiện error message và log
        console.error('Comment error:', error);
        const errorMsg = error.message || 'Không thể thêm bình luận';
        setErrorModal({ visible: true, title: 'Lỗi', message: errorMsg });
      }
    } finally {
      setSending(false);
    }
  };

  const handleReply = (commentId: number, fullName: string, parentId: number | null = null) => {
    setReplyingTo({ name: fullName, commentId });
    setReplyParentId(parentId || commentId); // Use parentId if it's a reply, otherwise use commentId
    setEditingComment(null);
    setNewComment('');
    inputRef.current?.focus();
  };

  const handleEditComment = (commentId: number, content: string) => {
    setEditingComment({ commentId, content });
    setReplyingTo(null);
    setNewComment(content);
    inputRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setNewComment('');
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
      const errorMsg = error.response?.data?.message || error.message || 'Không thể xóa bình luận';
      setErrorModal({ visible: true, title: 'Lỗi', message: errorMsg });
      setDeleteModalVisible(false);
      setCommentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setCommentToDelete(null);
  };

  const handleEditPost = (postId: number) => {
    if (!post) return;
    navigation.navigate('EditPost', {
      postId: post.postId,
      initialTitle: post.title,
      initialContent: post.content,
      initialTags: post.tags,
      fromScreen: 'CommentScreen'
    });
  };

  const handleDeletePost = async (postId: number) => {
    if (!token) return;
    setDeletePostModalVisible(true);
  };

  const confirmDeletePost = async () => {
    if (!token || !post) return;

    try {
      setDeletePostModalVisible(false);
      const postServiceModule = await import('../services/postService');
      await postServiceModule.postService.deletePost(post.postId, token);
      setDeletePostSuccessVisible(true);
      setTimeout(() => {
        setDeletePostSuccessVisible(false);
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      console.error('Error deleting post:', error);
      Alert.alert('Lỗi', error.message || 'Không thể xóa bài viết');
    }
  };

  const cancelDeletePost = () => {
    setDeletePostModalVisible(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  const getInitials = (fullName: string) => {
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return fullName.substring(0, 2);
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
            >
              {part}
            </Text>
          );
        })}
      </Text>
    );
  };

  const renderComment = ({ item }: { item: Comment & { replies?: Comment[] } }) => {
    const isHighlighted = highlightedCommentId === item.commentId;
    const isParent = !item.parentCommentId;
    
    return (
      <View>
        {/* Parent Comment */}
        <View 
          style={[
            styles.commentItem,
            isHighlighted && styles.commentItemHighlighted
          ]}
          onLayout={() => {
            if (isHighlighted) {
              setTimeout(() => setHighlightedCommentId(undefined), 3000);
            }
          }}
        >
          {item.avatarURL ? (
            <Image source={{ uri: item.avatarURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{getInitials(item.fullName)}</Text>
            </View>
          )}
          <View style={styles.commentContent}>
            {editingComment?.commentId === item.commentId ? (
              <>
                <View style={styles.editingBubble}>
                  <Text style={styles.authorName}>{item.fullName}</Text>
                  <TextInput
                    style={styles.editInput}
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    autoFocus
                    maxLength={500}
                  />
                </View>
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={cancelEdit} style={styles.editCancelButton}>
                    <Text style={styles.editCancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleAddComment} 
                    style={[styles.editSaveButton, !newComment.trim() && styles.editSaveButtonDisabled]}
                    disabled={!newComment.trim() || sending}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.editSaveText}>Lưu</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.commentBubble}>
                  <Text style={styles.authorName}>{item.fullName}</Text>
                  {renderCommentText(item.content)}
                </View>
                <View style={styles.commentFooter}>
                  <ReactionButton
                    targetId={item.commentId}
                    targetType="Comment"
                    initialReactions={item.reactions}
                  />
                  <Text style={styles.commentTime}>{formatDate(item.createdAt)}</Text>
                  <TouchableOpacity onPress={() => handleReply(item.commentId, item.fullName, item.parentCommentId)}>
                    <Text style={styles.replyButton}>Trả lời</Text>
                  </TouchableOpacity>
                  {currentUserId && item.userId === currentUserId && (
                    <>
                      <TouchableOpacity 
                        onPress={() => handleEditComment(item.commentId, item.content)}
                      >
                        <Text style={styles.editButton}>Sửa</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleDeleteComment(item.commentId)}
                      >
                        <Text style={styles.deleteButton}>Xóa</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
        </View>

        {/* View Replies Button */}
        {isParent && item.replies && item.replies.length > 0 && !expandedComments.has(item.commentId) && (
          <TouchableOpacity 
            style={styles.viewRepliesButton}
            onPress={() => toggleReplies(item.commentId)}
          >
            <MaterialCommunityIcons name="comment-outline" size={16} color="#65676b" />
            <Text style={styles.viewRepliesText}>
              Xem {item.replies.length} câu trả lời
            </Text>
          </TouchableOpacity>
        )}

        {/* Replies */}
        {isParent && item.replies && item.replies.length > 0 && expandedComments.has(item.commentId) && (
          item.replies.map((reply) => {
            const isReplyHighlighted = highlightedCommentId === reply.commentId;
            return (
              <View 
                key={reply.commentId}
                style={[
                  styles.commentItem,
                  styles.replyItem,
                  isReplyHighlighted && styles.commentItemHighlighted
                ]}
                onLayout={() => {
                  if (isReplyHighlighted) {
                    setTimeout(() => setHighlightedCommentId(undefined), 3000);
                  }
                }}
              >
                {reply.avatarURL ? (
                  <Image source={{ uri: reply.avatarURL }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>{getInitials(reply.fullName)}</Text>
                  </View>
                )}
                <View style={styles.commentContent}>
                  {editingComment?.commentId === reply.commentId ? (
                    <>
                      <View style={styles.editingBubble}>
                        <Text style={styles.authorName}>{reply.fullName}</Text>
                        <TextInput
                          style={styles.editInput}
                          value={newComment}
                          onChangeText={setNewComment}
                          multiline
                          autoFocus
                          maxLength={500}
                        />
                      </View>
                      <View style={styles.editActions}>
                        <TouchableOpacity onPress={cancelEdit} style={styles.editCancelButton}>
                          <Text style={styles.editCancelText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={handleAddComment} 
                          style={[styles.editSaveButton, !newComment.trim() && styles.editSaveButtonDisabled]}
                          disabled={!newComment.trim() || sending}
                        >
                          {sending ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.editSaveText}>Lưu</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.commentBubble}>
                        <Text style={styles.authorName}>{reply.fullName}</Text>
                        {renderCommentText(reply.content)}
                      </View>
                      <View style={styles.commentFooter}>
                        <ReactionButton
                          targetId={reply.commentId}
                          targetType="Comment"
                          initialReactions={reply.reactions}
                        />
                        <Text style={styles.commentTime}>{formatDate(reply.createdAt)}</Text>
                        <TouchableOpacity onPress={() => handleReply(reply.commentId, reply.fullName, item.commentId)}>
                          <Text style={styles.replyButton}>Trả lời</Text>
                        </TouchableOpacity>
                        {currentUserId && reply.userId === currentUserId && (
                          <>
                            <TouchableOpacity 
                              onPress={() => handleEditComment(reply.commentId, reply.content)}
                            >
                              <Text style={styles.editButton}>Sửa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => handleDeleteComment(reply.commentId)}
                            >
                              <Text style={styles.deleteButton}>Xóa</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}

        {/* Hide Replies Button */}
        {isParent && item.replies && item.replies.length > 0 && expandedComments.has(item.commentId) && (
          <TouchableOpacity 
            style={styles.hideRepliesButton}
            onPress={() => toggleReplies(item.commentId)}
          >
            <Text style={styles.hideRepliesText}>Ẩn câu trả lời</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {postTitle}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Comments List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1877f2" />
        </View>
      ) : (
        <FlatList
          data={organizeComments()}
          renderItem={renderComment}
          keyExtractor={(item) => item.commentId.toString()}
          contentContainerStyle={styles.commentsList}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadComments();
          }}
          ListHeaderComponent={
            post ? (
              <View style={styles.postContainer}>
                <PostCard 
                  post={post} 
                  currentUserId={currentUserId || undefined}
                  hideComments={true}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                />
                <View style={styles.commentsDivider}>
                  <Text style={styles.commentsTitle}>Bình luận ({comments.length})</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !post ? null : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="comment-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Chưa có bình luận nào</Text>
                <Text style={styles.emptySubtext}>Hãy là người đầu tiên bình luận!</Text>
              </View>
            )
          }
        />
      )}

      {/* Input Box */}
      <View style={styles.inputContainer}>
        {editingComment && (
          <View style={styles.editingIndicator}>
            <Text style={styles.editingText}>Đang chỉnh sửa bình luận</Text>
            <TouchableOpacity onPress={cancelEdit}>
              <MaterialCommunityIcons name="close" size={16} color="#65676b" />
            </TouchableOpacity>
          </View>
        )}
        {replyingTo && (
          <View style={styles.replyingIndicator}>
            <Text style={styles.replyingText}>Trả lời {replyingTo.name}</Text>
            <TouchableOpacity onPress={() => { setReplyingTo(null); setReplyParentId(null); setNewComment(''); }}>
              <MaterialCommunityIcons name="close" size={16} color="#65676b" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Viết bình luận..."
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
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete Post Confirmation Modal */}
      <Modal
        visible={deletePostModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDeletePost}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#f02849" />
            </View>
            <Text style={styles.deleteModalTitle}>Xác nhận xóa</Text>
            <Text style={styles.deleteModalMessage}>
              Bạn có chắc chắn muốn xóa bài viết này?
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelDeletePost}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={confirmDeletePost}
              >
                <Text style={styles.confirmDeleteButtonText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Post Success Modal */}
      <Modal
        visible={deletePostSuccessVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successModalHeader}>
              <MaterialCommunityIcons name="check-circle" size={64} color="#10b981" />
            </View>
            <Text style={styles.successModalTitle}>Thành công!</Text>
            <Text style={styles.successModalMessage}>Đã xóa bài viết</Text>
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
        <View style={styles.modalOverlay}>
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

      {/* Ban Alert Modal */}
      <BanAlertModal
        visible={showBanModal}
        bans={banStatus?.activeBans || []}
        onClose={closeBanModal}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    textAlign: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  commentsList: {
    paddingBottom: 80
  },
  postContainer: {
    marginBottom: 0,
    backgroundColor: '#fff',
  },
  commentsDivider: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 6,
    borderTopColor: '#f0f2f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
    marginTop: 0,
    backgroundColor: '#fff',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  commentItem: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 4,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  commentItemHighlighted: {
    backgroundColor: '#fff9c4',
    paddingVertical: 8,
    marginHorizontal: -8,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  replyItem: {
    marginLeft: 40,
    borderLeftWidth: 2,
    borderLeftColor: '#e4e6eb',
    paddingLeft: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e4e6eb',
    marginRight: 10
  },
  avatarPlaceholder: {
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  commentContent: {
    flex: 1
  },
  commentBubble: {
    backgroundColor: '#f0f2f5',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
    maxWidth: '90%'
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#050505',
    marginBottom: 2
  },
  commentText: {
    fontSize: 15,
    color: '#050505',
    lineHeight: 20
  },
  mentionText: {
    fontSize: 15,
    color: '#1877f2',
    fontWeight: '600',
    lineHeight: 20
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 2,
    gap: 12,
  },
  commentTime: {
    fontSize: 12,
    color: '#65676b'
  },
  replyButton: {
    fontSize: 13,
    color: '#65676b',
    fontWeight: '600'
  },
  editButton: {
    fontSize: 13,
    color: '#65676b',
    fontWeight: '600'
  },
  deleteButton: {
    fontSize: 13,
    color: '#65676b',
    fontWeight: '600'
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: '#e4e6eb',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5
  },
  editingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  editingText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
  replyingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  replyingText: {
    fontSize: 13,
    color: '#65676b',
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e4e6eb',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 15,
    color: '#1f2937',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1877f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#bcc0c4',
    opacity: 0.6
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#65676b',
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4
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
  editingBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1877f2',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6
  },
  editInput: {
    fontSize: 15,
    color: '#050505',
    lineHeight: 20,
    minHeight: 40,
    maxHeight: 120,
    paddingVertical: 4
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 4
  },
  editCancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f0f2f5'
  },
  editCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#65676b'
  },
  editSaveButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#1877f2'
  },
  editSaveButtonDisabled: {
    backgroundColor: '#bcc0c4',
    opacity: 0.6
  },
  editSaveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff'
  },
  modalOverlay: {
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
  successModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 280,
  },
  successModalHeader: {
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 8,
    textAlign: 'center',
  },
  successModalMessage: {
    fontSize: 16,
    color: '#65676b',
    textAlign: 'center',
  },
  errorModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#65676b',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 120,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
