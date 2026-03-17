import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import reportService, { Report } from '../services/reportService';

export default function ReportHistoryScreen() {
  const navigation = useNavigation();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await reportService.getMyReports();
      if (response.success) {
        setReports(response.data);
      }
    } catch (error: any) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'Post':
        return 'Bài viết';
      case 'Comment':
        return 'Bình luận';
      case 'User':
        return 'Người dùng';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: 0 | 1) => {
    if (status === 0) {
      return (
        <View style={styles.statusBadgePending}>
          <Text style={styles.statusTextPending}>Đang chờ</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.statusBadgeResolved}>
          <Text style={styles.statusTextResolved}>Đã xử lý</Text>
        </View>
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReportPress = (item: Report) => {
    if (item.TargetDeleted) {
      const targetTypeText = getTargetTypeLabel(item.TargetType).toLowerCase();
      Alert.alert(
        'Nội dung đã bị xóa',
        `${getTargetTypeLabel(item.TargetType)} này đã bị xóa.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (item.TargetType === 'Post') {
      (navigation as any).navigate('Comment', { 
        postId: item.TargetID,
        postTitle: item.TargetTitle || 'Bài viết'
      });
    } else if (item.TargetType === 'Comment') {
      console.log('Navigate to comment:', item.TargetID);
    } else if (item.TargetType === 'User') {
      (navigation as any).navigate('UserProfile', { userId: item.TargetID });
    }
  };

  const renderReportItem = ({ item }: { item: Report }) => (
    <TouchableOpacity 
      style={styles.reportCard}
      onPress={() => handleReportPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportTypeContainer}>
          <MaterialCommunityIcons 
            name={item.TargetType === 'Post' ? 'post-outline' : item.TargetType === 'Comment' ? 'comment-outline' : 'account-outline'} 
            size={20} 
            color="#6b7280" 
          />
          <Text style={styles.reportType}>{getTargetTypeLabel(item.TargetType)}</Text>
        </View>
        {getStatusBadge(item.Status)}
      </View>

      {item.TargetDeleted && (
        <View style={styles.deletedBanner}>
          <MaterialCommunityIcons name="delete" size={16} color="#dc2626" />
          <Text style={styles.deletedText}>Nội dung đã bị xóa</Text>
        </View>
      )}

      {item.TargetTitle && (
        <View style={styles.targetTitleContainer}>
          <Text style={styles.targetTitle} numberOfLines={2}>
            {item.TargetTitle}
          </Text>
        </View>
      )}

      {item.TargetContent && !item.TargetTitle && (
        <View style={styles.targetContentContainer}>
          <Text style={styles.targetContentPreview} numberOfLines={3}>
            {item.TargetContent}
          </Text>
        </View>
      )}

      <View style={styles.reportBody}>
        <Text style={styles.reasonLabel}>Lý do báo cáo:</Text>
        <Text style={styles.reasonText}>{item.Reason}</Text>
      </View>

      <View style={styles.reportFooter}>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="identifier" size={14} color="#9ca3af" />
          <Text style={styles.footerText}>ID: {item.TargetID}</Text>
        </View>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#9ca3af" />
          <Text style={styles.footerText}>{formatDate(item.CreatedAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="flag-outline" size={24} color="#1f2937" />
        <Text style={styles.headerTitle}>Lịch sử báo cáo</Text>
      </View>

      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="flag-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Bạn chưa có báo cáo nào</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.ReportID.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  listContainer: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadgePending: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextPending: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
  statusBadgeResolved: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextResolved: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  deletedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  deletedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  targetTitleContainer: {
    marginBottom: 8,
  },
  targetTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 22,
  },
  targetContentContainer: {
    marginBottom: 8,
  },
  targetContentPreview: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  reportBody: {
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
});
