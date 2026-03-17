import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { postService, Post, UserStats } from '../services/postService';
import { userService } from '../services/userService';
import { createOrGetConversation } from '../services/chatService';
import { PostCard } from '../components/PostCard';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileScreenProps {
  navigation: any;
  route: {
    params: {
      userId: number;
      fullName: string;
      avatarURL?: string;
    };
  };
}

export default function UserProfileScreen({ navigation, route }: UserProfileScreenProps) {
  const { userId, fullName, avatarURL } = route.params;
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState<string | undefined>();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  
  const isOwnProfile = user?.userId === userId;

  useEffect(() => {
    loadUserData();
  }, [userId]);

  useEffect(() => {
    // Listen for refresh from edit screen
    const unsubscribe = navigation.addListener('focus', () => {
      const params = navigation.getState()?.routes?.find((r: any) => r.name === 'UserProfile')?.params;
      if (params?.refresh) {
        loadUserData();
      }
    });

    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem('authToken');
      setToken(userToken || undefined);

      // Load user posts, stats, và follow status
      const promises: Promise<any>[] = [
        postService.getUserPosts(userId),
        userToken ? postService.getUserStats(userId, userToken) : null
      ];

      // Check follow status nếu không phải profile của mình
      if (!isOwnProfile && userToken && user?.userId) {
        promises.push(userService.checkFollowStatus(user.userId, userId, userToken));
      }

      const results = await Promise.all(promises);
      setPosts(results[0]);
      setUserStats(results[1]);
      
      if (!isOwnProfile && results[2] !== undefined) {
        setIsFollowing(results[2]);
      }
    } catch (error) {
      console.error('Load user data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user?.userId || !token) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để follow');
      return;
    }

    try {
      setFollowLoading(true);
      if (isFollowing) {
        await userService.unfollowUser(user.userId, userId, token);
        setIsFollowing(false);
      } else {
        await userService.followUser(user.userId, userId, token);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện thao tác này');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleChat = async () => {
    try {
      // Tạo hoặc lấy conversation với user này
      const conversation = await createOrGetConversation(userId);
      
      // Navigate to chat screen
      navigation.navigate('Chat', {
        conversationId: conversation.ConversationID,
        otherUser: {
          userId: userId,
          username: conversation.OtherUsername || '',
          fullName: fullName,
          avatarURL: avatarURL
        }
      });
    } catch (error) {
      console.error('Create conversation error:', error);
      Alert.alert('Lỗi', 'Không thể mở chat');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleDeletePost = async (postId: number) => {
    setPostToDelete(postId);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeletePost = async () => {
    try {
      if (!token || !postToDelete) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }
      
      setShowDeleteConfirmModal(false);
      await postService.deletePost(postToDelete, token);
      setPosts(posts.filter(p => p.postId !== postToDelete));
      setPostToDelete(null);
      setShowDeleteSuccessModal(true);
      setTimeout(() => {
        setShowDeleteSuccessModal(false);
      }, 1500);
      
      // Reload user stats
      if (token) {
        const stats = await postService.getUserStats(userId, token);
        setUserStats(stats);
      }
    } catch (error: any) {
      console.error('Delete post error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể xóa bài viết');
    }
  };

  const handleEditPost = (postId: number) => {
    const post = posts.find(p => p.postId === postId);
    if (!post) {
      Alert.alert('Lỗi', 'Không tìm thấy bài viết');
      return;
    }
    
    navigation.navigate('EditPost', {
      postId: post.postId,
      initialTitle: post.title,
      initialContent: post.content,
      initialTags: post.tags,
      fromScreen: 'UserProfile',
      userId: userId
    });
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  };

  const renderHeader = () => (
    <View style={styles.profileHeader}>
      {/* Back button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color="#1a1a1a" />
      </TouchableOpacity>

      {/* User Info Card */}
      <View style={styles.userCard}>
        {avatarURL ? (
          <Image source={{ uri: avatarURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
          </View>
        )}
        
        <Text style={styles.fullName}>{fullName}</Text>
        
        {/* Action Buttons - chỉ hiện khi xem profile người khác */}
        {!isOwnProfile && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.chatButton]}
              onPress={handleChat}
            >
              <MaterialCommunityIcons name="message-outline" size={18} color="#fff" />
              <Text style={styles.chatButtonText}>Nhắn tin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, isFollowing ? styles.followingButton : styles.followButton]}
              onPress={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? "#1877f2" : "#fff"} />
              ) : (
                <>
                  <MaterialCommunityIcons 
                    name={isFollowing ? "account-check" : "account-plus"} 
                    size={18} 
                    color={isFollowing ? "#1877f2" : "#fff"} 
                  />
                  <Text style={isFollowing ? styles.followingButtonText : styles.followButtonText}>
                    {isFollowing ? 'Đang follow' : 'Follow'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Stats Row */}
        {userStats && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.totalPosts}</Text>
              <Text style={styles.statLabel}>Bài viết</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.totalComments}</Text>
              <Text style={styles.statLabel}>Bình luận</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.totalReactions}</Text>
              <Text style={styles.statLabel}>Lượt thích</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="trophy" size={20} color="#f59e0b" />
              <Text style={styles.statLabel}>Top {userStats.rankPercentage}%</Text>
            </View>
          </View>
        )}
      </View>

      {/* Posts Section Title */}
      <View style={styles.postsHeaderSection}>
        <MaterialCommunityIcons name="file-document-outline" size={20} color="#1a1a1a" />
        <Text style={styles.postsTitle}>Bài viết của {fullName.split(' ').pop()}</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="post-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1877f2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.postId.toString()}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={user?.userId}
            onPress={() => {
              // Navigate to post detail if needed
            }}
            onDelete={handleDeletePost}
            onEdit={handleEditPost}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : undefined}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1877f2']}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Delete Success Modal */}
      <Modal
        transparent
        visible={showDeleteSuccessModal}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIconContainer}>
              <MaterialCommunityIcons name="delete-circle" size={64} color="#ef4444" />
            </View>
            <Text style={styles.successTitle}>Đã xóa!</Text>
            <Text style={styles.successMessage}>Bài viết đã được xóa</Text>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        transparent
        visible={showDeleteConfirmModal}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmIconContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#f59e0b" />
            </View>
            <Text style={styles.confirmTitle}>Xóa bài viết?</Text>
            <Text style={styles.confirmMessage}>Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.</Text>
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowDeleteConfirmModal(false);
                  setPostToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={confirmDeletePost}
              >
                <Text style={styles.deleteButtonText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5'
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  profileHeader: {
    backgroundColor: '#fff',
    paddingBottom: 12
  },
  userCard: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#fff'
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#1877f2'
  },
  avatarPlaceholder: {
    backgroundColor: '#1877f2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold'
  },
  fullName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 6
  },
  chatButton: {
    backgroundColor: '#1877f2'
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  followButton: {
    backgroundColor: '#1877f2'
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  followingButton: {
    backgroundColor: '#e4e6eb',
    borderWidth: 1,
    borderColor: '#ccd0d5'
  },
  followingButtonText: {
    color: '#1877f2',
    fontSize: 14,
    fontWeight: '600'
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    padding: 16,
    width: '100%'
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#65676b'
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#dadde1'
  },
  postsHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e4e6eb',
    gap: 8
  },
  postsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a'
  },
  emptyContainer: {
    flexGrow: 1
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#050505',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#65676b',
    textAlign: 'center',
  },
  confirmModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    minWidth: 320,
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmIconContainer: {
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#050505',
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 15,
    color: '#65676b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#050505',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
