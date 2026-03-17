import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { postService, Post, UserStats } from '../services/postService';
import { notificationService, Notification } from '../services/notificationService';
import SidebarModal from '../components/SidebarModal';
import { PostCard } from '../components/PostCard';
import BanAlertModal from '../components/BanAlertModal';
import { useBanCheck } from '../hooks/useBanCheck';

interface StatsCard {
  icon: string;
  value: number;
  label: string;
  color: string;
}

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { banStatus, showBanModal, closeBanModal } = useBanCheck();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [popularTags, setPopularTags] = useState<string[]>(['#All']);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState<string | undefined>();
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const data = await notificationService.getNotifications(10);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.IsRead) {
      try {
        await notificationService.markAsRead(notification.NotificationID);
        fetchUnreadCount();
        fetchNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    setNotificationModalVisible(false);
  };

  // Stats từ API
  const stats: StatsCard[] = userStats ? [
    { icon: 'file-document-outline', value: userStats.totalPosts, label: 'Posts', color: '#4A90E2' },
    { icon: 'comment-text-outline', value: userStats.totalComments, label: 'Comments', color: '#10b981' },
    { icon: 'heart-outline', value: userStats.totalReactions, label: 'Likes', color: '#ef4444' },
  ] : [
    { icon: 'file-document-outline', value: 0, label: 'Posts', color: '#4A90E2' },
    { icon: 'comment-text-outline', value: 0, label: 'Comments', color: '#10b981' },
    { icon: 'heart-outline', value: 0, label: 'Likes', color: '#ef4444' },
  ];

  const tabs = [
    { key: 'home', label: 'Trang chủ', icon: 'home' },
    { key: 'following', label: 'Following', icon: 'account-group' },
  ];

  useEffect(() => {
    loadInitialData();
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [activeTab, selectedTag]);

  useEffect(() => {
    // Listen for refresh from edit screen
    const unsubscribe = navigation.addListener('focus', () => {
      const params = navigation.getState()?.routes?.find((r: any) => r.name === 'Home')?.params;
      if (params?.refresh) {
        loadPosts();
        fetchNotifications();
        fetchUnreadCount();
        loadInitialData();
      }
    });

    return unsubscribe;
  }, [navigation]);

  const loadInitialData = async () => {
    try {
      if (!user?.userId) return;

      // Load user stats
      const userToken = await AsyncStorage.getItem('authToken');
      setToken(userToken || undefined);
      
      if (userToken) {
        const statsData = await postService.getUserStats(user.userId, userToken);
        setUserStats(statsData);
      }

      // Load popular tags
      const tagsData = await postService.getPopularTags();
      setPopularTags(tagsData.map(tag => tag.tagName));
    } catch (error) {
      console.error('Load initial data error:', error);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      let postsData: Post[];
      
      if (activeTab === 'trending') {
        postsData = await postService.getTrendingPosts();
      } else if (activeTab === 'following') {
        // Lấy posts từ người đang follow
        if (!user?.userId || !token) {
          postsData = [];
        } else {
          const result = await postService.getFollowingPosts(user.userId, token, 1, 20);
          postsData = result.posts;
        }
      } else if (activeTab === 'saved') {
        // Lấy posts đã lưu
        if (!user?.userId || !token) {
          postsData = [];
        } else {
          const result = await postService.getSavedPosts(user.userId, token, 1, 20);
          postsData = result.posts;
        }
      } else {
        // Tab home - tất cả posts
        const result = await postService.getPosts(1, 20, selectedTag ? parseInt(selectedTag) : undefined);
        postsData = result.posts;
      }

      setPosts(postsData);
    } catch (error) {
      console.error('Load posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadInitialData(), loadPosts()]);
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
      await loadInitialData(); // Reload stats
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
      fromScreen: 'Home'
    });
  };

  const renderHeader = () => (
    <>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setSidebarVisible(true)}
          >
            <MaterialCommunityIcons name="menu" size={28} color="#1a1a1a" />
          </TouchableOpacity>
          <View>
            <Text style={styles.welcomeText}>Student Forum</Text>
            <Text style={styles.userName}>Xin chào, {user?.fullName || 'User'}!</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              setNotificationModalVisible(true);
              fetchNotifications();
            }}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#1a1a1a" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Sidebar Modal */}
      <SidebarModal
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        currentRoute="Home"
        userStats={userStats}
      />


      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? '#4A90E2' : '#6b7280'}
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.tabTextActive,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Bài viết mới nhất</Text>
    </>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={user?.userId}
      onPress={() => {
        navigation.navigate('Comment', {
          postId: item.postId,
          postTitle: item.title
        });
      }}
      onDelete={handleDeletePost}
      onEdit={handleEditPost}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.postId.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

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

      {/* Notification Modal */}
      <Modal
        transparent
        visible={notificationModalVisible}
        animationType="slide"
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.notificationModalOverlay}>
          <View style={styles.notificationModalContent}>
            {/* Header */}
            <View style={styles.notificationModalHeader}>
              <Text style={styles.notificationModalTitle}>Thông báo</Text>
              <TouchableOpacity onPress={() => setNotificationModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            {/* Notification List */}
            <ScrollView style={styles.notificationList} showsVerticalScrollIndicator={false}>
              {loadingNotifications ? (
                <View style={styles.notificationLoading}>
                  <ActivityIndicator size="large" color="#4A90E2" />
                  <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
              ) : notifications.length === 0 ? (
                <View style={styles.notificationEmpty}>
                  <MaterialCommunityIcons name="bell-off-outline" size={64} color="#d1d5db" />
                  <Text style={styles.emptyText}>Chưa có thông báo</Text>
                </View>
              ) : (
                notifications.slice(0, 4).map((notification) => {
                  const getIcon = (type: string) => {
                    switch (type) {
                      case 'NewReaction': return 'heart';
                      case 'NewComment': return 'comment';
                      case 'CommentReply': return 'comment-reply';
                      case 'NewFollower': return 'account-plus';
                      default: return 'bell';
                    }
                  };

                  const getIconColor = (type: string) => {
                    switch (type) {
                      case 'NewReaction': return '#ef4444';
                      case 'NewComment': return '#3b82f6';
                      case 'CommentReply': return '#3b82f6';
                      case 'NewFollower': return '#10b981';
                      default: return '#6b7280';
                    }
                  };

                  const getTimeAgo = (dateString: string) => {
                    const now = new Date();
                    const created = new Date(dateString);
                    const diffMs = now.getTime() - created.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);

                    if (diffMins < 1) return 'Vừa xong';
                    if (diffMins < 60) return `${diffMins} phút trước`;
                    if (diffHours < 24) return `${diffHours} giờ trước`;
                    if (diffDays < 7) return `${diffDays} ngày trước`;
                    return created.toLocaleDateString('vi-VN');
                  };

                  return (
                    <TouchableOpacity
                      key={notification.NotificationID}
                      style={[
                        styles.notificationItem,
                        !notification.IsRead && styles.notificationItemUnread,
                      ]}
                      onPress={() => handleNotificationPress(notification)}
                    >
                      <View style={styles.notificationIcon}>
                        <MaterialCommunityIcons
                          name={getIcon(notification.Type) as any}
                          size={24}
                          color={getIconColor(notification.Type)}
                        />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationText}>
                          {notification.Message}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {getTimeAgo(notification.CreatedAt)}
                        </Text>
                      </View>
                      {!notification.IsRead && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Footer */}
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => {
                setNotificationModalVisible(false);
                navigation.navigate('Notifications');
              }}
            >
              <Text style={styles.viewAllButtonText}>Xem tất cả</Text>
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  userName: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
    marginTop: 2,
  },
  reputationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reputationText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
  },
  statsContent: {
    paddingHorizontal: 16,
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  tabActive: {
    backgroundColor: '#e8f1ff',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  tagContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  tagContent: {
    paddingHorizontal: 16,
  },
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  tagChipActive: {
    backgroundColor: '#4A90E2',
  },
  tagText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  tagTextActive: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  postAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  postUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  postTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  postTag: {
    backgroundColor: '#e8f1ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  postTagText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  resolvedText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
    marginLeft: 4,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  postStatText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
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
  notificationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  notificationModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  notificationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  notificationModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  notificationList: {
    maxHeight: 500,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'flex-start',
  },
  notificationItemUnread: {
    backgroundColor: '#eff6ff',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  notificationUser: {
    fontWeight: '600',
    color: '#1f2937',
  },
  notificationContentText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
    marginTop: 6,
  },
  viewAllButton: {
    margin: 16,
    marginTop: 8,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    alignItems: 'center',
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  notificationLoading: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  notificationEmpty: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
});
