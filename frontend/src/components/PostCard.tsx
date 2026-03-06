import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { ReactionButton } from './ReactionButton';
import { CommentSection } from './CommentSection';
import { useNavigation } from '@react-navigation/native';
import reportService from '../services/reportService';
import BanAlertModal from './BanAlertModal';
import { useBanCheck } from '../hooks/useBanCheck';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: {
    postId: number;
    title: string;
    content: string;
    userId: number;
    username: string;
    fullName: string;
    avatarURL: string | null;
    createdAt: string;
    tags: string[];
    reactions: number;
    comments: number;
    images?: string[];
  };
  currentUserId?: number;
  onPress?: () => void;
  onDelete?: (postId: number) => void;
  onEdit?: (postId: number) => void;
  hideComments?: boolean;
  disabled?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  currentUserId,
  onPress,
  onDelete,
  onEdit,
  hideComments = false,
  disabled = false
}) => {
  const navigation = useNavigation();
  const { banStatus, showBanModal, closeBanModal, recheckBanStatus } = useBanCheck();
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [reportLoading, setReportLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [expandedContent, setExpandedContent] = useState(false);
  const [expandedTags, setExpandedTags] = useState(false);
  
  const isVideo = (url: string) => {
    return url.match(/\.(mp4|mov|avi|wmv|flv|mkv)$/i) !== null;
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  const handleUserPress = () => {
    (navigation as any).navigate('UserProfile', {
      userId: post.userId,
      fullName: post.fullName,
      avatarURL: post.avatarURL
    });
  };

  const handleEditPress = () => {
    setShowMenu(false);
    onEdit?.(post.postId);
  };

  const handleDeletePress = () => {
    setShowMenu(false);
    onDelete?.(post.postId);
  };

  const handleReportPress = () => {
    setShowMenu(false);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      setErrorModal({ visible: true, title: 'Lỗi', message: 'Vui lòng nhập lý do báo cáo' });
      return;
    }

    setReportLoading(true);
    try {
      await reportService.createReport({
        targetID: post.postId,
        targetType: 'Post',
        reason: reportReason.trim()
      });
      
      setShowReportModal(false);
      setReportReason('');
      setShowSuccessModal(true);
    } catch (error: any) {
      console.log('[PostCard] Report error caught:', error);
      console.log('[PostCard] error.status:', error.status);
      console.log('[PostCard] error.response?.status:', error.response?.status);
      // Xử lý lỗi 403 - bị ban report
      if (error.status === 403 || error.response?.status === 403) {
        console.log('[PostCard] Detected 403, calling recheckBanStatus');
        setShowReportModal(false);
        setReportReason('');
        // Hiện modal ban với thông tin chi tiết
        await recheckBanStatus();
      } else {
        // Lỗi khác - hiện error message và log
        console.error('Report error:', error);
        const errorMsg = error.message || 'Không thể gửi báo cáo';
        setErrorModal({ visible: true, title: 'Lỗi', message: errorMsg });
      }
    } finally {
      setReportLoading(false);
    }
  };

  const CardWrapper = disabled ? View : TouchableOpacity;
  
  return (
    <CardWrapper
      style={styles.card}
      {...(!disabled && { onPress, activeOpacity: 0.7 })}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleUserPress}
          style={styles.userSection}
        >
          <Image
            source={{
              uri: post.avatarURL || 'https://via.placeholder.com/40'
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.fullName}>{post.fullName}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.username}>@{post.username}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.time}>{formatDate(post.createdAt)}</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <View>
          <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={styles.menuButton}>
            <MaterialCommunityIcons name="dots-horizontal" size={24} color="#65676b" />
          </TouchableOpacity>
          
          {showMenu && (
            <View style={styles.dropdown}>
              {currentUserId === post.userId ? (
                <>
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={handleEditPress}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={18} color="#1877f2" />
                    <Text style={styles.dropdownTextEdit}>Chỉnh sửa</Text>
                  </TouchableOpacity>
                  <View style={styles.dropdownDivider} />
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={handleDeletePress}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={18} color="#ef4444" />
                    <Text style={styles.dropdownTextDelete}>Xóa bài viết</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={styles.dropdownItem}
                  onPress={handleReportPress}
                >
                  <MaterialCommunityIcons name="flag-outline" size={18} color="#ef4444" />
                  <Text style={styles.dropdownTextDelete}>Báo cáo vi phạm</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <Text 
          style={styles.postContent} 
          numberOfLines={expandedContent ? undefined : 3}
        >
          {post.content}
        </Text>
        {post.content.length > 150 && (
          <TouchableOpacity onPress={() => setExpandedContent(!expandedContent)}>
            <Text style={styles.seeMoreText}>
              {expandedContent ? 'Thu gọn' : 'Xem thêm'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Images/Videos */}
      {post.images && post.images.length > 0 && (
        <View style={styles.imagesContainer}>
          {post.images.length === 1 ? (
            <TouchableOpacity 
              onPress={() => { setSelectedImageIndex(0); setImageViewerVisible(true); }}
              disabled={isVideo(post.images[0])}
            >
              {isVideo(post.images[0]) ? (
                <Video
                  source={{ uri: post.images[0] }}
                  style={styles.singleImage}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={false}
                />
              ) : (
                <Image
                  source={{ uri: post.images[0] }}
                  style={styles.singleImage}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>
          ) : post.images.length === 2 ? (
            <View style={styles.twoImagesGrid}>
              {post.images.map((img, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  onPress={() => { setSelectedImageIndex(idx); setImageViewerVisible(true); }}
                  disabled={isVideo(img)}
                >
                  {isVideo(img) ? (
                    <Video
                      source={{ uri: img }}
                      style={styles.halfImage}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                    />
                  ) : (
                    <Image
                      source={{ uri: img }}
                      style={styles.halfImage}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : post.images.length === 3 ? (
            <View style={styles.threeImagesGrid}>
              <TouchableOpacity 
                onPress={() => { setSelectedImageIndex(0); setImageViewerVisible(true); }}
                disabled={isVideo(post.images[0])}
              >
                {isVideo(post.images[0]) ? (
                  <Video
                    source={{ uri: post.images[0] }}
                    style={styles.largeImage}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={false}
                  />
                ) : (
                  <Image
                    source={{ uri: post.images[0] }}
                    style={styles.largeImage}
                    resizeMode="cover"
                  />
                )}
              </TouchableOpacity>
              <View style={styles.smallImagesColumn}>
                <TouchableOpacity 
                  onPress={() => { setSelectedImageIndex(1); setImageViewerVisible(true); }}
                  disabled={isVideo(post.images[1])}
                >
                  {isVideo(post.images[1]) ? (
                    <Video
                      source={{ uri: post.images[1] }}
                      style={styles.smallImage}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                    />
                  ) : (
                    <Image
                      source={{ uri: post.images[1] }}
                      style={styles.smallImage}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => { setSelectedImageIndex(2); setImageViewerVisible(true); }}
                  disabled={isVideo(post.images[2])}
                >
                  {isVideo(post.images[2]) ? (
                    <Video
                      source={{ uri: post.images[2] }}
                      style={styles.smallImage}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                    />
                  ) : (
                    <Image
                      source={{ uri: post.images[2] }}
                      style={styles.smallImage}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {post.images.map((img, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  onPress={() => { setSelectedImageIndex(idx); setImageViewerVisible(true); }}
                  disabled={isVideo(img)}
                >
                  {isVideo(img) ? (
                    <Video
                      source={{ uri: img }}
                      style={styles.scrollImage}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                    />
                  ) : (
                    <Image
                      source={{ uri: img }}
                      style={styles.scrollImage}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {post.images.length > 4 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>+{post.images.length - 4}</Text>
            </View>
          )}
        </View>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {(expandedTags ? post.tags : post.tags.slice(0, 3)).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {post.tags.length > 3 && !expandedTags && (
            <TouchableOpacity 
              style={styles.moreTagsContainer}
              onPress={() => setExpandedTags(true)}
            >
              <Text style={styles.moreTags}>+{post.tags.length - 3}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Footer Actions */}
      <View style={styles.footer}>
        <ReactionButton
          targetId={post.postId}
          targetType="Post"
          initialReactions={post.reactions}
        />

        {!hideComments && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowComments(!showComments)}
          >
            <MaterialCommunityIcons 
              name={showComments ? "comment" : "comment-outline"} 
              size={18} 
              color={showComments ? "#1877f2" : "#65676b"} 
            />
            {commentCount > 0 && (
              <Text style={[styles.actionCount, showComments && { color: '#1877f2' }]}>
                {commentCount}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Comment Section */}
      {!hideComments && (
        <CommentSection
          postId={post.postId}
          isVisible={showComments}
          onClose={() => setShowComments(false)}
          onCommentCountChange={setCommentCount}
        />
      )}

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
              <Text style={styles.reportModalTitle}>Báo cáo vi phạm</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.reportModalLabel}>Lý do báo cáo:</Text>
            <TextInput
              style={styles.reportTextInput}
              placeholder="Nhập lý do báo cáo (spam, nội dung không phù hợp...)"
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

      {/* Image/Video Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setImageViewerVisible(false)}
          >
            <MaterialCommunityIcons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: selectedImageIndex * width, y: 0 }}
          >
            {post.images?.map((img, idx) => (
              <View key={idx} style={styles.imageViewerPage}>
                {isVideo(img) ? (
                  <Video
                    source={{ uri: img }}
                    style={styles.fullScreenImage}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                  />
                ) : (
                  <Image
                    source={{ uri: img }}
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            ))}
          </ScrollView>
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {selectedImageIndex + 1} / {post.images?.length || 0}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Ban Alert Modal */}
      <BanAlertModal
        visible={showBanModal}
        bans={banStatus?.activeBans || []}
        onClose={closeBanModal}
      />
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  menuButton: {
    padding: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 150,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#e4e6eb',
    marginHorizontal: 8,
  },
  dropdownTextEdit: {
    fontSize: 14,
    color: '#1877f2',
    fontWeight: '500',
  },
  dropdownTextDelete: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1e4e8'
  },
  userInfo: {
    flex: 1,
    marginLeft: 12
  },
  fullName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1e21',
    marginBottom: 2
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  username: {
    fontSize: 13,
    color: '#65676b'
  },
  dot: {
    fontSize: 13,
    color: '#65676b'
  },
  time: {
    fontSize: 13,
    color: '#65676b'
  },
  content: {
    marginBottom: 12
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1e21',
    marginBottom: 8,
    lineHeight: 22
  },
  postContent: {
    fontSize: 14,
    color: '#3a3b3c',
    lineHeight: 20
  },  seeMoreText: {
    fontSize: 14,
    color: '#1877f2',
    fontWeight: '500',
    marginTop: 4
  },  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  tag: {
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  tagText: {
    fontSize: 12,
    color: '#1877f2',
    fontWeight: '500'
  },
  moreTagsContainer: {
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  moreTags: {
    fontSize: 12,
    color: '#65676b',
    fontWeight: '500'
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e4e6eb'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    gap: 6,
    minWidth: 60,
    justifyContent: 'center'
  },
  actionCount: {
    fontSize: 14,
    color: '#65676b',
    fontWeight: '500'
  },
  imagesContainer: {
    marginVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  twoImagesGrid: {
    flexDirection: 'row',
    gap: 4,
  },
  halfImage: {
    width: (width - 72) / 2,
    height: 200,
  },
  threeImagesGrid: {
    flexDirection: 'row',
    gap: 4,
  },
  largeImage: {
    width: (width - 72) * 0.6,
    height: 200,
  },
  smallImagesColumn: {
    flex: 1,
    gap: 4,
  },
  smallImage: {
    width: '100%',
    height: 98,
  },
  scrollImage: {
    width: width - 72,
    height: 300,
    marginRight: 4,
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    flexDirection: 'row',
    gap: 12,
  },
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
  // Image Viewer Styles
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  imageViewerPage: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: width,
    height: '100%',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
