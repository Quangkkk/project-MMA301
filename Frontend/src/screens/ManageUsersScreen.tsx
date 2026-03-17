import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

interface User {
  UserID: number;
  Username: string;
  Email: string;
  FullName: string;
  PhoneNumber?: string;
  Role: string;
  UserStatus: number; // 0: Banned, 1: Active
  IsVerify: boolean;
  CreatedAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export default function ManageUsersScreen({ navigation }: any) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>(undefined);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  });
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'ban' | 'unban'>('ban');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, [pagination.page, selectedRole, selectedStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (searchText) params.search = searchText;
      if (selectedRole) params.role = selectedRole;
      if (selectedStatus !== undefined) params.status = selectedStatus;

      const response = await axios.get(`${API_URL}/admin/users`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUsers(response.data.data);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (error: any) {
      console.error('Load users error:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    loadUsers();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPagination({ ...pagination, page: 1 });
    await loadUsers();
    setRefreshing(false);
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedRole('');
    setSelectedStatus(undefined);
    setPagination({ ...pagination, page: 1 });
  };

  const goToPage = (page: number) => {
    setPagination({ ...pagination, page });
  };

  const handleBanUser = async (user: User) => {
    setSelectedUser(user);
    setConfirmAction('ban');
    setActionModalVisible(false);
    setConfirmModalVisible(true);
  };

  const handleUnbanUser = async (user: User) => {
    setSelectedUser(user);
    setConfirmAction('unban');
    setActionModalVisible(false);
    setConfirmModalVisible(true);
  };

  const executeBanAction = async () => {
    if (!selectedUser) return;
    
    setConfirmModalVisible(false);
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      const endpoint = confirmAction === 'ban' ? 'ban' : 'unban';
      
      await axios.put(
        `${API_URL}/admin/users/${selectedUser.UserID}/${endpoint}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage(confirmAction === 'ban' ? 'Đã cấm tài khoản thành công' : 'Đã bỏ cấm tài khoản thành công');
      setSuccessModalVisible(true);
      loadUsers();
    } catch (error) {
      Alert.alert('Lỗi', `Không thể ${confirmAction === 'ban' ? 'cấm' : 'bỏ cấm'} tài khoản`);
    }
  };

  const viewUserDetails = (user: User) => {
    setActionModalVisible(false);
    navigation.navigate('UserDetails', { userId: user.UserID });
  };

  const openActionModal = (user: User) => {
    setSelectedUser(user);
    setActionModalVisible(true);
  };

  const getStatusColor = (status: number) => {
    return status === 1 ? '#10b981' : '#ef4444';
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient 
        colors={['#ef4444', '#dc2626']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý User</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo email, tên, SĐT..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); handleSearch(); }}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterChip, selectedStatus === 1 && styles.filterChipActive]}
            onPress={() => setSelectedStatus(selectedStatus === 1 ? undefined : 1)}
          >
            <Text style={[styles.filterChipText, selectedStatus === 1 && styles.filterChipTextActive]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedStatus === 0 && styles.filterChipActive]}
            onPress={() => setSelectedStatus(selectedStatus === 0 ? undefined : 0)}
          >
            <Text style={[styles.filterChipText, selectedStatus === 0 && styles.filterChipTextActive]}>
              Banned
            </Text>
          </TouchableOpacity>
          {(selectedRole || selectedStatus !== undefined) && (
            <TouchableOpacity style={styles.clearFilterButton} onPress={clearFilters}>
              <Text style={styles.clearFilterText}>Xóa bộ lọc</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>Tổng: {pagination.totalItems} người dùng</Text>
          <Text style={styles.statsText}>Trang {pagination.page}/{pagination.totalPages}</Text>
        </View>

        {/* Users List */}
        <ScrollView
          style={styles.usersList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ef4444" />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : users.length > 0 ? (
            users.map((user) => (
              <View key={user.UserID} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.avatarContainer}>
                    <MaterialCommunityIcons name="account-circle" size={60} color="#d1d5db" />
                    {!user.IsVerify && (
                      <View style={styles.unverifiedBadge}>
                        <MaterialCommunityIcons name="alert-circle" size={14} color="#fff" />
                      </View>
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>{user.FullName}</Text>
                    <Text style={styles.userEmail} numberOfLines={1}>{user.Email}</Text>
                    <Text style={styles.userUsername}>@{user.Username}</Text>
                    {user.PhoneNumber && (
                      <View style={styles.phoneRow}>
                        <MaterialCommunityIcons name="phone" size={14} color="#9ca3af" />
                        <Text style={styles.userPhone}>{user.PhoneNumber}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.moreButton}
                    onPress={() => openActionModal(user)}
                  >
                    <MaterialCommunityIcons name="dots-vertical" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.userFooter}>
                  <View style={styles.userBadges}>
                    <View style={[
                      styles.badge, 
                      { 
                        backgroundColor: getStatusColor(user.UserStatus) + '15', 
                        borderColor: getStatusColor(user.UserStatus) 
                      }
                    ]}>
                      <MaterialCommunityIcons 
                        name={user.UserStatus === 1 ? 'check-circle' : 'close-circle'} 
                        size={12} 
                        color={getStatusColor(user.UserStatus)} 
                      />
                      <Text style={[styles.badgeText, { color: getStatusColor(user.UserStatus) }]}>
                        {user.UserStatus === 1 ? 'ACTIVE' : 'BANNED'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.userDate}>
                    <MaterialCommunityIcons name="calendar" size={12} color="#9ca3af" />
                    {' '}{new Date(user.CreatedAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-off" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>Không tìm thấy người dùng</Text>
            </View>
          )}
        </ScrollView>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.pageButton, pagination.page === 1 && styles.pageButtonDisabled]}
              onPress={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <MaterialCommunityIcons 
                name="chevron-left" 
                size={24} 
                color={pagination.page === 1 ? '#d1d5db' : '#ef4444'} 
              />
            </TouchableOpacity>

            <View style={styles.pageNumbers}>
              {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = index + 1;
                } else if (pagination.page <= 3) {
                  pageNum = index + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + index;
                } else {
                  pageNum = pagination.page - 2 + index;
                }

                return (
                  <TouchableOpacity
                    key={pageNum}
                    style={[
                      styles.pageNumber, 
                      pagination.page === pageNum && styles.pageNumberActive
                    ]}
                    onPress={() => goToPage(pageNum)}
                  >
                    <Text style={[
                      styles.pageNumberText, 
                      pagination.page === pageNum && styles.pageNumberTextActive
                    ]}>
                      {pageNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.pageButton, 
                pagination.page === pagination.totalPages && styles.pageButtonDisabled
              ]}
              onPress={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={pagination.page === pagination.totalPages ? '#d1d5db' : '#ef4444'}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name="account-cog" size={28} color="#ef4444" />
                <Text style={styles.modalTitle}>Quản lý tài khoản</Text>
              </View>
              
              <View style={styles.modalUserInfo}>
                <Text style={styles.modalUserName}>{selectedUser?.FullName}</Text>
                <Text style={styles.modalUserEmail}>{selectedUser?.Email}</Text>
              </View>

              <View style={styles.modalActions}>
                {selectedUser?.UserStatus === 1 ? (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.banButton]}
                    onPress={() => {
                      setActionModalVisible(false);
                      if (selectedUser) handleBanUser(selectedUser);
                    }}
                  >
                    <MaterialCommunityIcons name="cancel" size={24} color="#fff" />
                    <Text style={styles.modalButtonText}>Cấm tài khoản</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.unbanButton]}
                    onPress={() => {
                      setActionModalVisible(false);
                      if (selectedUser) handleUnbanUser(selectedUser);
                    }}
                  >
                    <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
                    <Text style={styles.modalButtonText}>Bỏ cấm tài khoản</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.modalButton, styles.detailButton]}
                  onPress={() => {
                    if (selectedUser) viewUserDetails(selectedUser);
                  }}
                >
                  <MaterialCommunityIcons name="account-details" size={24} color="#fff" />
                  <Text style={styles.modalButtonText}>Xem chi tiết</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setActionModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContent}>
            <View style={styles.confirmIcon}>
              <MaterialCommunityIcons 
                name={confirmAction === 'ban' ? 'alert-circle' : 'check-circle'} 
                size={56} 
                color={confirmAction === 'ban' ? '#ef4444' : '#10b981'} 
              />
            </View>
            <Text style={styles.confirmTitle}>Xác nhận hành động</Text>
            <Text style={styles.confirmMessage}>
              {confirmAction === 'ban' 
                ? `Bạn có chắc muốn cấm tài khoản "${selectedUser?.FullName}"?`
                : `Bạn có chắc muốn bỏ cấm tài khoản "${selectedUser?.FullName}"?`
              }
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.confirmCancelButton}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.confirmCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.confirmActionButton,
                  { backgroundColor: confirmAction === 'ban' ? '#ef4444' : '#10b981' }
                ]}
                onPress={executeBanAction}
              >
                <Text style={styles.confirmActionText}>
                  {confirmAction === 'ban' ? 'Cấm' : 'Bỏ cấm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successContent}>
            <View style={styles.successIcon}>
              <MaterialCommunityIcons name="check-circle" size={72} color="#10b981" />
            </View>
            <Text style={styles.successTitle}>Thành công!</Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
            <TouchableOpacity 
              style={styles.successButton}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.successButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1, paddingHorizontal: 20 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    marginTop: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1f2937' },
  filtersContainer: { marginTop: 12, maxHeight: 50 },
  filterChip: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    marginRight: 8, 
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
  },
  filterChipActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  filterChipText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },
  clearFilterButton: { backgroundColor: '#6b7280', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  clearFilterText: { fontSize: 14, color: '#fff', fontWeight: '500' },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 16, 
    marginBottom: 12 
  },
  statsText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  usersList: { flex: 1 },
  userCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2 
  },
  userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarContainer: { position: 'relative', marginRight: 12 },
  unverifiedBadge: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    backgroundColor: '#f59e0b', 
    borderRadius: 10, 
    width: 20, 
    height: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#fff' 
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
  userUsername: { fontSize: 13, color: '#9ca3af', marginBottom: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userPhone: { fontSize: 13, color: '#9ca3af' },
  moreButton: { padding: 8 },
  userFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#f3f4f6' 
  },
  userBadges: { flexDirection: 'row', gap: 8 },
  badge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 16, 
    borderWidth: 1 
  },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  userDate: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#9ca3af' },
  paginationContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    marginTop: 12, 
    marginBottom: 12 
  },
  pageButton: { padding: 8 },
  pageButtonDisabled: { opacity: 0.3 },
  pageNumbers: { flexDirection: 'row', marginHorizontal: 16 },
  pageNumber: { 
    width: 36, 
    height: 36, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginHorizontal: 4, 
    backgroundColor: '#f3f4f6' 
  },
  pageNumberActive: { backgroundColor: '#ef4444' },
  pageNumberText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  pageNumberTextActive: { color: '#fff' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  modalUserInfo: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  modalUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  modalUserEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalActions: {
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  banButton: {
    backgroundColor: '#ef4444',
  },
  unbanButton: {
    backgroundColor: '#10b981',
  },
  detailButton: {
    backgroundColor: '#3b82f6',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalCancelButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  
  // Confirm Modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  confirmIcon: {
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Success Modal
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  successButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
