import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { notificationService, Notification } from '../services/notificationService';

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState('all'); // all, unread
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(50);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      await notificationService.markAllAsRead();
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.IsRead) {
      try {
        await notificationService.markAsRead(notification.NotificationID);
        fetchNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type
    switch (notification.Type) {
      case 'NewReaction':
      case 'NewComment':
      case 'CommentReply':
        // Navigate to the post (SourceID is PostID for these types)
        navigation.navigate('Comment', { 
          postId: notification.SourceID 
        });
        break;
      
      case 'NewFollower':
        // Navigate to the follower's profile (SourceID is UserID for this type)
        navigation.navigate('UserProfile', { 
          userId: notification.SourceID 
        });
        break;
      
      default:
        // For other notification types, do nothing or navigate to a general screen
        break;
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.IsRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.IsRead).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={handleMarkAllAsRead}
          disabled={markingAllRead || unreadCount === 0}
        >
          {markingAllRead ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <MaterialCommunityIcons 
              name="check-all" 
              size={24} 
              color={unreadCount > 0 ? '#3b82f6' : '#d1d5db'} 
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            Chưa đọc ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.notificationList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
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
                <View style={[
                  styles.notificationIcon,
                  { backgroundColor: getIconColor(notification.Type) }
                ]}>
                  <MaterialCommunityIcons
                    name={getIcon(notification.Type) as any}
                    size={24}
                    color="#fff"
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationText}>
                    {notification.Message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    <MaterialCommunityIcons name="clock-outline" size={12} color="#9ca3af" />
                    {' '}{getTimeAgo(notification.CreatedAt)}
                  </Text>
                </View>
                {!notification.IsRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  headerAction: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#dbeafe',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  notificationList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'flex-start',
  },
  notificationItemUnread: {
    backgroundColor: '#eff6ff',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconLike: {
    backgroundColor: '#ef4444',
  },
  iconComment: {
    backgroundColor: '#3b82f6',
  },
  iconFollow: {
    backgroundColor: '#10b981',
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
    fontWeight: '700',
    color: '#1f2937',
  },
  contentBox: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  notificationContentText: {
    fontSize: 13,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
});

export default NotificationsScreen;
