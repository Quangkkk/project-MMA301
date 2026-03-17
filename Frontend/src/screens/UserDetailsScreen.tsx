import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserDetails {
  user: {
    UserID: number;
    Email: string;
    FullName: string;
    PhoneNumber: string;
    Bio: string;
    UserStatus: number;
    CreatedAt: string;
  };
  stats: {
    totalPosts: number;
    totalComments: number;
    totalReactions: number;
    totalReports: number;
    totalWarnings: number;
    activeBans: number;
  };
  recentPosts: Array<{
    PostID: number;
    Title: string;
    Content: string;
    CreatedAt: string;
    HasReports: boolean;
    ReportCount: number;
  }>;
  reports: Array<{
    ReportID: number;
    Reason: string;
    Status: number;
    CreatedAt: string;
    TargetType: string;
    TargetContent: string;
  }>;
  warnings: Array<{
    WarningID: number;
    WarningReason: string;
    Severity: number;
    IsActive: boolean;
    CreatedAt: string;
  }>;
  bans: Array<{
    BanID: number;
    BanReason: string;
    BanType: string;
    StartDate: string;
    EndDate: string;
    IsActive: boolean;
  }>;
}

export default function UserDetailsScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/admin/users/${userId}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('User details response:', JSON.stringify(response.data, null, 2));
      setDetails(response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserDetails();
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1: return '#fbbf24'; // Nhẹ - Yellow
      case 2: return '#f97316'; // Trung bình - Orange
      case 3: return '#ef4444'; // Nghiêm trọng - Red
      default: return '#6b7280';
    }
  };

  const getSeverityText = (severity: number) => {
    switch (severity) {
      case 1: return 'Nhẹ';
      case 2: return 'Trung bình';
      case 3: return 'Nghiêm trọng';
      default: return 'N/A';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Chờ xử lý';
      case 1: return 'Đã xử lý';
      case 2: return 'Từ chối';
      default: return 'N/A';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return '#fbbf24';
      case 1: return '#10b981';
      case 2: return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getBanTypeText = (banType: string) => {
    switch (banType) {
      case 'POST': return 'Cấm đăng bài';
      case 'COMMENT': return 'Cấm bình luận';
      case 'REPORT': return 'Cấm báo cáo';
      case 'FULL': return 'Cấm toàn bộ';
      default: return banType;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  if (!details) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Không tải được thông tin người dùng</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserDetails}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết người dùng</Text>
      </View>

      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={48} color="#9ca3af" />
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: details.user.UserStatus === 1 ? '#10b981' : '#ef4444' }
          ]}>
            <Text style={styles.statusText}>
              {details.user.UserStatus === 1 ? 'Hoạt động' : 'Bị cấm'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.userName}>{details.user.FullName}</Text>
        <Text style={styles.userEmail}>{details.user.Email}</Text>
        {details.user.PhoneNumber && details.user.PhoneNumber !== '' && (
          <Text style={styles.userPhone}>{details.user.PhoneNumber}</Text>
        )}
        {details.user.Bio && details.user.Bio !== '' && (
          <Text style={styles.userBio}>{details.user.Bio}</Text>
        )}
        <Text style={styles.joinDate}>
          Tham gia: {new Date(details.user.CreatedAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="newspaper-outline" size={28} color="#3b82f6" />
          <Text style={styles.statValue}>{details.stats?.totalPosts || 0}</Text>
          <Text style={styles.statLabel}>Bài đăng</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="chatbox-outline" size={28} color="#10b981" />
          <Text style={styles.statValue}>{details.stats?.totalComments || 0}</Text>
          <Text style={styles.statLabel}>Bình luận</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="heart-outline" size={28} color="#ec4899" />
          <Text style={styles.statValue}>{details.stats?.totalReactions || 0}</Text>
          <Text style={styles.statLabel}>Lượt thích</Text>
        </View>
      </View>

      {/* Violation Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.warningCard]}>
          <Ionicons name="warning-outline" size={28} color="#f59e0b" />
          <Text style={styles.statValue}>{details.stats?.totalWarnings || 0}</Text>
          <Text style={styles.statLabel}>Cảnh báo</Text>
        </View>
        <View style={[styles.statCard, styles.reportCard]}>
          <Ionicons name="flag-outline" size={28} color="#ef4444" />
          <Text style={styles.statValue}>{details.stats?.totalReports || 0}</Text>
          <Text style={styles.statLabel}>Báo cáo</Text>
        </View>
        <View style={[styles.statCard, styles.banCard]}>
          <Ionicons name="ban-outline" size={28} color="#dc2626" />
          <Text style={styles.statValue}>{details.stats?.activeBans || 0}</Text>
          <Text style={styles.statLabel}>Đang cấm</Text>
        </View>
      </View>

      {/* Active Bans */}
      {details.bans && details.bans.filter(b => b.IsActive).length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="ban" size={20} color="#ef4444" />
            <Text style={styles.sectionTitle}>Lệnh cấm hiện tại</Text>
          </View>
          {details.bans.filter(b => b.IsActive).map((ban) => (
            <View key={ban.BanID} style={styles.banItem}>
              <View style={styles.banHeader}>
                <Text style={styles.banType}>{getBanTypeText(ban.BanType)}</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Đang cấm</Text>
                </View>
              </View>
              <Text style={styles.banReason}>{ban.BanReason}</Text>
              <View style={styles.banDates}>
                <Text style={styles.banDate}>
                  Từ: {new Date(ban.StartDate).toLocaleDateString('vi-VN')}
                </Text>
                <Text style={styles.banDate}>
                  Đến: {new Date(ban.EndDate).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Warnings */}
      {details.warnings && details.warnings.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Lịch sử cảnh báo</Text>
          </View>
          {details.warnings.slice(0, 5).map((warning) => (
            <View key={warning.WarningID} style={styles.warningItem}>
              <View style={styles.warningHeader}>
                <View style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityColor(warning.Severity) }
                ]}>
                  <Text style={styles.severityText}>{getSeverityText(warning.Severity)}</Text>
                </View>
                {warning.IsActive && (
                  <View style={styles.activeWarningBadge}>
                    <Text style={styles.activeWarningText}>Còn hiệu lực</Text>
                  </View>
                )}
              </View>
              <Text style={styles.warningReason}>{warning.WarningReason}</Text>
              <Text style={styles.warningDate}>
                {new Date(warning.CreatedAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Posts */}
      {details.recentPosts && details.recentPosts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="newspaper" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Bài đăng gần đây</Text>
          </View>
          {details.recentPosts.map((post) => (
            <View key={post.PostID} style={styles.postItem}>
              <View style={styles.postContent}>
                <View style={styles.postText}>
                  <Text style={styles.postTitle} numberOfLines={1}>
                    {post.Title || 'Không có tiêu đề'}
                  </Text>
                  <Text style={styles.postCaption} numberOfLines={2}>
                    {post.Content || 'Không có nội dung'}
                  </Text>
                  <Text style={styles.postDate}>
                    {new Date(post.CreatedAt).toLocaleDateString('vi-VN')}
                  </Text>
                  {post.HasReports && (
                    <View style={styles.reportAlert}>
                      <Ionicons name="flag" size={14} color="#ef4444" />
                      <Text style={styles.reportAlertText}>
                        {post.ReportCount} báo cáo
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Reports Against User */}
      {details.reports && details.reports.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="flag" size={20} color="#ef4444" />
            <Text style={styles.sectionTitle}>Báo cáo vi phạm</Text>
          </View>
          {details.reports.map((report) => (
            <View key={report.ReportID} style={styles.reportItem}>
              <View style={styles.reportHeader}>
                <View style={[
                  styles.statusBadgeSmall,
                  { backgroundColor: getStatusColor(report.Status) }
                ]}>
                  <Text style={styles.statusBadgeText}>{getStatusText(report.Status)}</Text>
                </View>
                <Text style={styles.reportDate}>
                  {new Date(report.CreatedAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
              <Text style={styles.reportReason}>{report.Reason}</Text>
              {report.TargetContent && (
                <Text style={styles.reportContent} numberOfLines={2}>
                  "{report.TargetContent}"
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ef4444',
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  userCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  userBio: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  joinDate: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  warningCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  reportCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  banCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  banItem: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  banHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  banType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },
  activeBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  banReason: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  banDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  banDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  warningItem: {
    backgroundColor: '#fffbeb',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  warningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  activeWarningBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeWarningText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  warningReason: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  warningDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  postItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  postContent: {
    flexDirection: 'row',
    gap: 12,
  },
  postImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  postText: {
    flex: 1,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  postCaption: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  postDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  reportAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  reportAlertText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  reportItem: {
    backgroundColor: '#fef2f2',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  reportDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  reportReason: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  reportContent: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});
