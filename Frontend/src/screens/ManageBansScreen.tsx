import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';

interface UserBan {
  BanID: number;
  UserID: number;
  UserName: string;
  UserFullName: string;
  AdminName: string;
  BanReason: string;
  BanType: string;
  StartDate: string;
  EndDate: string | null;
  IsActive: boolean;
  CreatedAt: string;
}

export default function ManageBansScreen({ navigation }: any) {
  const [bans, setBans] = useState<UserBan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBan, setSelectedBan] = useState<UserBan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDuration, setEditDuration] = useState<string>('');
  const [editBanTypes, setEditBanTypes] = useState<string[]>(['POST']);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    type: 'success' as 'success' | 'error' | 'warning',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadBans();
  }, []);

  const loadBans = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/admin/bans`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setBans(response.data.data);
      }
    } catch (error: any) {
      setAlertModal({
        visible: true,
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể tải danh sách ban',
        onConfirm: () => setAlertModal({ ...alertModal, visible: false }),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBans();
  };

  const handleUnban = async (banId: number) => {
    try {
      setUpdateLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await axios.put(
        `${API_URL}/admin/bans/${banId}/revoke`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setAlertModal({
          visible: true,
          type: 'success',
          title: 'Thành công',
          message: 'Đã gỡ ban thành công',
          onConfirm: () => {
            setAlertModal({ ...alertModal, visible: false });
            setModalVisible(false);
            loadBans();
          },
        });
      }
    } catch (error: any) {
      setAlertModal({
        visible: true,
        type: 'error',
        title: 'Lỗi',
        message: error.response?.data?.message || 'Không thể gỡ ban',
        onConfirm: () => setAlertModal({ ...alertModal, visible: false }),
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateBan = async () => {
    if (!selectedBan) return;
    
    if (!editDuration || isNaN(Number(editDuration)) || Number(editDuration) <= 0) {
      setAlertModal({
        visible: true,
        type: 'warning',
        title: 'Cảnh báo',
        message: 'Vui lòng nhập số ngày hợp lệ (> 0)',
        onConfirm: () => setAlertModal({ ...alertModal, visible: false }),
      });
      return;
    }

    if (editBanTypes.length === 0) {
      setAlertModal({
        visible: true,
        type: 'warning',
        title: 'Cảnh báo',
        message: 'Vui lòng chọn ít nhất một loại ban',
        onConfirm: () => setAlertModal({ ...alertModal, visible: false }),
      });
      return;
    }

    try {
      setUpdateLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      // Nếu chỉ có 1 ban type, update ban hiện tại
      if (editBanTypes.length === 1) {
        const response = await axios.put(
          `${API_URL}/admin/bans/${selectedBan.BanID}`,
          {
            durationHours: Number(editDuration) * 24,
            banType: editBanTypes[0]
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          setAlertModal({
            visible: true,
            type: 'success',
            title: 'Thành công',
            message: 'Cập nhật ban thành công',
            onConfirm: () => {
              setAlertModal({ ...alertModal, visible: false });
              setEditModalVisible(false);
              setModalVisible(false);
              loadBans();
            },
          });
        }
      } else {
        // Nếu có nhiều ban types, revoke ban cũ và tạo nhiều ban mới
        await axios.put(
          `${API_URL}/admin/bans/${selectedBan.BanID}/revoke`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Tạo ban mới cho mỗi type
        const banPromises = editBanTypes.map(type =>
          axios.post(
            `${API_URL}/admin/bans`,
            {
              UserID: selectedBan.UserID,
              BanReason: selectedBan.BanReason,
              BanType: type,
              DurationHours: Number(editDuration) * 24
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );

        await Promise.all(banPromises);

        setAlertModal({
          visible: true,
          type: 'success',
          title: 'Thành công',
          message: `Đã tạo ${editBanTypes.length} lệnh ban mới`,
          onConfirm: () => {
            setAlertModal({ ...alertModal, visible: false });
            setEditModalVisible(false);
            setModalVisible(false);
            loadBans();
          },
        });
      }
    } catch (error: any) {
      setAlertModal({
        visible: true,
        type: 'error',
        title: 'Lỗi',
        message: error.response?.data?.message || 'Không thể cập nhật ban',
        onConfirm: () => setAlertModal({ ...alertModal, visible: false }),
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const openEditModal = (ban: UserBan) => {
    const duration = ban.EndDate 
      ? Math.ceil((new Date(ban.EndDate).getTime() - new Date(ban.StartDate).getTime()) / (1000 * 60 * 60 * 24))
      : 7;
    setEditDuration(duration.toString());
    setEditBanTypes([ban.BanType]);
    setSelectedBan(ban);
    setEditModalVisible(true);
  };

  const toggleBanType = (type: string) => {
    if (type === 'FULL') {
      // Nếu chọn FULL, chỉ giữ FULL và bỏ các option khác
      setEditBanTypes(['FULL']);
    } else {
      // Nếu chọn option khác
      if (editBanTypes.includes('FULL')) {
        // Nếu đang có FULL, bỏ FULL và chọn option mới
        setEditBanTypes([type]);
      } else {
        // Toggle option trong list
        if (editBanTypes.includes(type)) {
          setEditBanTypes(editBanTypes.filter(t => t !== type));
        } else {
          setEditBanTypes([...editBanTypes, type]);
        }
      }
    }
  };

  const handleReban = async (ban: UserBan) => {
    try {
      setUpdateLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      // Tính duration từ ban cũ
      const duration = ban.EndDate 
        ? Math.ceil((new Date(ban.EndDate).getTime() - new Date(ban.StartDate).getTime()) / (1000 * 60 * 60 * 24))
        : 7;
      
      const response = await axios.post(
        `${API_URL}/admin/bans`,
        {
          UserID: ban.UserID,
          BanReason: ban.BanReason,
          BanType: ban.BanType,
          DurationHours: duration * 24
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setAlertModal({
          visible: true,
          type: 'success',
          title: 'Thành công',
          message: 'Đã ban lại thành công',
          onConfirm: () => {
            setAlertModal({ ...alertModal, visible: false });
            setModalVisible(false);
            loadBans();
          },
        });
      }
    } catch (error: any) {
      setAlertModal({
        visible: true,
        type: 'error',
        title: 'Lỗi',
        message: error.response?.data?.message || 'Không thể ban lại',
        onConfirm: () => setAlertModal({ ...alertModal, visible: false }),
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const openDetailModal = (ban: UserBan) => {
    setSelectedBan(ban);
    setModalVisible(true);
  };

  const getBanTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      POST: '#ef4444',
      COMMENT: '#f59e0b',
      REPORT: '#8b5cf6',
      FULL: '#dc2626',
    };
    return colors[type] || '#6b7280';
  };

  const getBanTypeText = (type: string) => {
    const texts: { [key: string]: string } = {
      POST: 'Đăng bài',
      COMMENT: 'Bình luận',
      REPORT: 'Báo cáo',
      FULL: 'Toàn bộ',
    };
    return texts[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) return 'Vĩnh viễn';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return `${days} ngày`;
  };

  const getFilteredBans = () => {
    if (filterType === 'ALL') return bans;
    return bans.filter(ban => ban.BanType === filterType);
  };

  const renderBanItem = ({ item }: { item: UserBan }) => (
    <TouchableOpacity
      style={styles.banCard}
      onPress={() => openDetailModal(item)}
    >
      <View style={styles.banHeader}>
        <View style={styles.userInfo}>
          <MaterialCommunityIcons name="account-cancel" size={40} color="#ef4444" />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.UserFullName}</Text>
            <Text style={styles.userSubtext}>@{item.UserName}</Text>
          </View>
        </View>
        <View style={[styles.banTypeBadge, { backgroundColor: getBanTypeColor(item.BanType) }]}>
          <Text style={styles.banTypeText}>{getBanTypeText(item.BanType)}</Text>
        </View>
      </View>

      <View style={styles.banInfo}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
          <Text style={styles.infoText}>Thời hạn: {getDuration(item.StartDate, item.EndDate)}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={16} color="#6b7280" />
          <Text style={styles.infoText}>Bắt đầu: {formatDate(item.StartDate)}</Text>
        </View>
        {item.EndDate && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar-check" size={16} color="#6b7280" />
            <Text style={styles.infoText}>Kết thúc: {formatDate(item.EndDate)}</Text>
          </View>
        )}
      </View>

      <View style={styles.reasonBox}>
        <Text style={styles.reasonLabel}>Lý do:</Text>
        <Text style={styles.reasonText} numberOfLines={2}>{item.BanReason}</Text>
      </View>

      <View style={styles.banFooter}>
        <View style={styles.adminInfo}>
          <MaterialCommunityIcons name="shield-account" size={14} color="#6b7280" />
          <Text style={styles.adminText}>By {item.AdminName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.IsActive ? '#fef3c7' : '#d1fae5' }]}>
          <Text style={[styles.statusText, { color: item.IsActive ? '#d97706' : '#059669' }]}>
            {item.IsActive ? 'Đang ban' : 'Đã gỡ'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (type: string, label: string, icon: string) => (
    <TouchableOpacity
      style={[styles.filterButton, filterType === type && styles.filterButtonActive]}
      onPress={() => setFilterType(type)}
    >
      <MaterialCommunityIcons 
        name={icon as any} 
        size={20} 
        color={filterType === type ? '#fff' : '#6b7280'} 
      />
      <Text style={[styles.filterButtonText, filterType === type && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>Đang tải danh sách ban...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Ban</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('ALL', 'Tất cả', 'filter-variant')}
        {renderFilterButton('POST', 'Đăng bài', 'file-document')}
        {renderFilterButton('COMMENT', 'Bình luận', 'comment')}
        {renderFilterButton('REPORT', 'Báo cáo', 'flag')}
        {renderFilterButton('FULL', 'Toàn bộ', 'cancel')}
      </View>

      <FlatList
        data={getFilteredBans()}
        renderItem={renderBanItem}
        keyExtractor={(item) => item.BanID.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ef4444']} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="shield-check" size={80} color="#d1d5db" />
            <Text style={styles.emptyText}>Không có ban nào</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết Ban</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            {selectedBan && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Người dùng:</Text>
                  <Text style={styles.detailValue}>{selectedBan.UserFullName} (@{selectedBan.UserName})</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Loại ban:</Text>
                  <View style={[styles.banTypeBadge, { backgroundColor: getBanTypeColor(selectedBan.BanType) }]}>
                    <Text style={styles.banTypeText}>{getBanTypeText(selectedBan.BanType)}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Thời hạn:</Text>
                  <Text style={styles.detailValue}>{getDuration(selectedBan.StartDate, selectedBan.EndDate)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bắt đầu:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedBan.StartDate)}</Text>
                </View>

                {selectedBan.EndDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Kết thúc:</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedBan.EndDate)}</Text>
                  </View>
                )}

                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Lý do:</Text>
                  <Text style={styles.detailValueMultiline}>{selectedBan.BanReason}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Admin:</Text>
                  <Text style={styles.detailValue}>{selectedBan.AdminName}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: selectedBan.IsActive ? '#fef3c7' : '#d1fae5' }]}>
                    <Text style={[styles.statusText, { color: selectedBan.IsActive ? '#d97706' : '#059669' }]}>
                      {selectedBan.IsActive ? 'Đang ban' : 'Đã gỡ'}
                    </Text>
                  </View>
                </View>

                {selectedBan.IsActive ? (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        setModalVisible(false);
                        openEditModal(selectedBan);
                      }}
                    >
                      <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                      <Text style={styles.editButtonText}>Chỉnh sửa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.unbanButton}
                      onPress={() => handleUnban(selectedBan.BanID)}
                      disabled={updateLoading}
                    >
                      {updateLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="shield-off" size={20} color="#fff" />
                          <Text style={styles.unbanButtonText}>Gỡ ban</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.rebanButton}
                    onPress={() => handleReban(selectedBan)}
                    disabled={updateLoading}
                  >
                    {updateLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="shield-alert" size={20} color="#fff" />
                        <Text style={styles.rebanButtonText}>Ban lại</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa Ban</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            {selectedBan && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Người dùng:</Text>
                  <Text style={styles.detailValue}>{selectedBan.UserFullName}</Text>
                </View>

                <View style={styles.editSection}>
                  <Text style={styles.editLabel}>Loại ban:</Text>
                  <View style={styles.banTypeOptions}>
                    {['POST', 'COMMENT', 'REPORT', 'FULL'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.banTypeOption,
                          editBanTypes.includes(type) && styles.banTypeOptionSelected
                        ]}
                        onPress={() => toggleBanType(type)}
                      >
                        <Text style={[
                          styles.banTypeOptionText,
                          editBanTypes.includes(type) && styles.banTypeOptionTextSelected
                        ]}>
                          {getBanTypeText(type)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {editBanTypes.length > 1 && (
                    <Text style={styles.multiSelectHint}>
                      Đã chọn {editBanTypes.length} loại ban
                    </Text>
                  )}
                </View>

                <View style={styles.editSection}>
                  <Text style={styles.editLabel}>Số ngày ban:</Text>
                  <TextInput
                    style={styles.durationInput}
                    value={editDuration}
                    onChangeText={setEditDuration}
                    keyboardType="number-pad"
                    placeholder="Nhập số ngày"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleUpdateBan}
                    disabled={updateLoading}
                  >
                    {updateLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Alert Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={alertModal.visible}
        onRequestClose={() => setAlertModal({ ...alertModal, visible: false })}
      >
        <View style={styles.alertModalOverlay}>
          <View style={[
            styles.alertModal,
            alertModal.type === 'success' && styles.alertModalSuccess,
            alertModal.type === 'error' && styles.alertModalError,
            alertModal.type === 'warning' && styles.alertModalWarning,
          ]}>
            <View style={styles.alertIconContainer}>
              <MaterialCommunityIcons
                name={
                  alertModal.type === 'success' ? 'check-circle' :
                  alertModal.type === 'error' ? 'alert-circle' :
                  'alert'
                }
                size={64}
                color={
                  alertModal.type === 'success' ? '#10b981' :
                  alertModal.type === 'error' ? '#ef4444' :
                  '#f59e0b'
                }
              />
            </View>
            <Text style={styles.alertTitle}>{alertModal.title}</Text>
            <Text style={styles.alertMessage}>{alertModal.message}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={alertModal.onConfirm}>
              <Text style={styles.alertButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: '#ef4444',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  banCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  banHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userDetails: {
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  userSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },
  banTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  banTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  banInfo: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
  },
  reasonBox: {
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#dc2626',
  },
  banFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adminText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailColumn: {
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  detailValueMultiline: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  unbanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  unbanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  rebanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  rebanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  editSection: {
    gap: 8,
    marginTop: 8,
  },
  editLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  banTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  banTypeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  banTypeOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  banTypeOptionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  banTypeOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  multiSelectHint: {
    fontSize: 13,
    color: '#3b82f6',
    marginTop: 8,
    fontWeight: '500',
  },
  durationInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  alertModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertModal: {
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
  alertModalSuccess: {
    borderTopWidth: 4,
    borderTopColor: '#10b981',
  },
  alertModalError: {
    borderTopWidth: 4,
    borderTopColor: '#ef4444',
  },
  alertModalWarning: {
    borderTopWidth: 4,
    borderTopColor: '#f59e0b',
  },
  alertIconContainer: {
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  alertButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 120,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
