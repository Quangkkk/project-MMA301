import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

interface Report {
  ReportID: number;
  ReporterID: number;
  TargetID: number;
  TargetType: string;
  Reason: string;
  Status: number;
  CreatedAt: string;
  ReporterName?: string;
  ReporterUsername?: string;
  ReporterFullName?: string;
  TargetUsername?: string;
  TargetFullName?: string;
}

export default function ManageReportsScreen({ navigation }: any) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'none' | 'warning' | 'ban'>('none');
  const [targetUser, setTargetUser] = useState<'reporter' | 'target'>('target');
  const [warningSeverity, setWarningSeverity] = useState<1 | 2 | 3>(1);
  const [banType, setBanType] = useState<'POST' | 'COMMENT' | 'REPORT' | 'FULL'>('POST');
  const [banDuration, setBanDuration] = useState<number>(7);
  const [reason, setReason] = useState('');
  
  // Custom modal states
  const [alertModal, setAlertModal] = useState({
    visible: false,
    type: 'success' as 'success' | 'error' | 'warning',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadReports();
  }, [filter]);

  const loadReports = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filter !== 'all' ? { status: filter === 'pending' ? 0 : 1 } : {}
      });

      if (response.data.success) {
        setReports(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error loading reports:', error);
      setAlertModal({
        visible: true,
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể tải danh sách báo cáo',
        onConfirm: () => setAlertModal({ ...alertModal, visible: false }),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleUpdateStatus = async (reportId: number, newStatus: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('Updating report:', { reportId, status: newStatus });
      const response = await axios.put(
        `${API_URL}/admin/reports/${reportId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setAlertModal({
          visible: true,
          type: 'success',
          title: 'Thành công',
          message: 'Đã cập nhật trạng thái báo cáo',
          onConfirm: () => {
            setAlertModal({ ...alertModal, visible: false });
            loadReports();
          },
        });
      }
    } catch (error: any) {
      setAlertModal({
        visible: true,
        type: 'error',
        title: 'Lỗi',
        message: error.response?.data?.message || 'Không thể cập nhật báo cáo',
        onConfirm: () => setAlertModal({ ...alertModal, visible: false }),
      });
    }
  };

  const openActionModal = (report: Report) => {
    setSelectedReport(report);
    setModalVisible(true);
    setActionType('none');
    setTargetUser('target');
    setReason('');
    setWarningSeverity(1);
    setBanType('POST');
    setBanDuration(7);
  };

  const handleProcessReport = async () => {
    if (!selectedReport) return;

    if (!reason.trim()) {
      setAlertModal({
        visible: true,
        type: 'error',
        title: 'Lỗi',
        message: 'Vui lòng nhập lý do xử lý',
        onConfirm: () => setAlertModal({ ...alertModal, visible: false }),
      });
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const userId = targetUser === 'reporter' ? selectedReport.ReporterID : selectedReport.TargetID;

      // Nếu chọn cảnh báo
      if (actionType === 'warning') {
        await axios.post(
          `${API_URL}/admin/warnings`,
          {
            UserID: userId,
            ReportID: selectedReport.ReportID,
            WarningReason: reason,
            ActionTaken: 'Warning',
            Severity: warningSeverity,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Nếu chọn cấm
      if (actionType === 'ban') {
        // Tính số giờ cấm (NULL = vĩnh viễn)
        const durationHours = banDuration === 365 ? undefined : banDuration * 24;

        await axios.post(
          `${API_URL}/admin/bans`,
          {
            UserID: userId,
            BanReason: reason,
            BanType: banType,
            DurationHours: durationHours,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setAlertModal({
        visible: true,
        type: 'success',
        title: 'Thành công',
        message: 'Đã xử lý báo cáo thành công',
        onConfirm: () => {
          setAlertModal({ ...alertModal, visible: false });
          setModalVisible(false);
          loadReports();
        },
      });
    } catch (error: any) {
      setAlertModal({
        visible: true,
        type: 'error',
        title: 'Lỗi',
        message: error.response?.data?.message || 'Không thể xử lý báo cáo',
        onConfirm: () => setAlertModal({ ...alertModal, visible: false }),
      });
    }
  };

  const confirmUpdateStatus = (report: Report) => {
    if (report.Status === 0) {
      // Nếu đang chờ xử lý -> mở modal xử lý
      openActionModal(report);
    } else {
      // Nếu đã xử lý -> không cho phép quay lại
      setAlertModal({
        visible: true,
        type: 'warning',
        title: 'Thông báo',
        message: 'Báo cáo đã xử lý không thể quay lại trạng thái chờ xử lý',
        onConfirm: () => setAlertModal({ ...alertModal, visible: false }),
      });
    }
  };

  const getStatusColor = (status: number) => {
    return status === 0 ? '#fbbf24' : '#10b981';
  };

  const getStatusText = (status: number) => {
    return status === 0 ? 'Chờ xử lý' : 'Đã xử lý';
  };

  const getTargetTypeIcon = (type: string) => {
    switch (type) {
      case 'Post': return 'newspaper';
      case 'Comment': return 'chatbox';
      case 'User': return 'person';
      default: return 'help-circle';
    }
  };

  const getTargetTypeText = (type: string) => {
    switch (type) {
      case 'Post': return 'Bài viết';
      case 'Comment': return 'Bình luận';
      case 'User': return 'Người dùng';
      default: return type;
    }
  };

  const renderReport = ({ item }: { item: Report }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportTypeContainer}>
          <Ionicons 
            name={getTargetTypeIcon(item.TargetType) as any} 
            size={20} 
            color="#ef4444" 
          />
          <Text style={styles.reportType}>{getTargetTypeText(item.TargetType)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.Status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.Status)}</Text>
        </View>
      </View>

      <View style={styles.reportContent}>
        <Text style={styles.reportLabel}>Lý do:</Text>
        <Text style={styles.reportReason}>{item.Reason}</Text>
      </View>

      <View style={styles.reportInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
          <Text style={styles.infoText}>
            {new Date(item.CreatedAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="flag-outline" size={14} color="#9ca3af" />
          <Text style={styles.infoText}>ID: {item.TargetID}</Text>
        </View>
      </View>

      {item.Status === 0 && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.toggleButton]}
            onPress={() => confirmUpdateStatus(item)}
          >
            <Ionicons 
              name="checkmark-circle" 
              size={18} 
              color="#fff" 
            />
            <Text style={styles.actionButtonText}>
              Xử lý báo cáo
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="flag" size={24} color="#fff" />
            <Text style={styles.headerTitle}>Quản lý Report</Text>
          </View>
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
            style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
              Chờ xử lý
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'resolved' && styles.filterTabActive]}
            onPress={() => setFilter('resolved')}
          >
            <Text style={[styles.filterText, filter === 'resolved' && styles.filterTextActive]}>
              Đã xử lý
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item.ReportID.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>Không có báo cáo nào</Text>
          </View>
        }
      />

      {/* Action Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Xử lý báo cáo</Text>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Thông tin báo cáo */}
              <View style={styles.reportInfoBox}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Người gửi báo cáo:</Text>
                  <Text style={styles.infoValue}>
                    {selectedReport?.ReporterFullName || selectedReport?.ReporterUsername || `ID: ${selectedReport?.ReporterID}`}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Người bị báo cáo:</Text>
                  <Text style={styles.infoValue}>
                    {selectedReport?.TargetFullName || selectedReport?.TargetUsername || `${selectedReport?.TargetType} ID: ${selectedReport?.TargetID}`}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Loại:</Text>
                  <Text style={styles.infoValue}>{selectedReport?.TargetType}</Text>
                </View>
              </View>

              {/* Action Type */}
              <Text style={styles.sectionLabel}>Hành động</Text>
              <View style={styles.optionGroup}>
                <TouchableOpacity
                  style={[styles.optionButton, actionType === 'none' && styles.optionButtonActive]}
                  onPress={() => setActionType('none')}
                >
                  <Ionicons name="checkmark-circle" size={20} color={actionType === 'none' ? '#fff' : '#6b7280'} />
                  <Text style={[styles.optionText, actionType === 'none' && styles.optionTextActive]}>
                    Chỉ đánh dấu đã xử lý
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionButton, actionType === 'warning' && styles.optionButtonActive]}
                  onPress={() => setActionType('warning')}
                >
                  <Ionicons name="warning" size={20} color={actionType === 'warning' ? '#fff' : '#6b7280'} />
                  <Text style={[styles.optionText, actionType === 'warning' && styles.optionTextActive]}>
                    Gửi cảnh báo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionButton, actionType === 'ban' && styles.optionButtonActive]}
                  onPress={() => setActionType('ban')}
                >
                  <Ionicons name="ban" size={20} color={actionType === 'ban' ? '#fff' : '#6b7280'} />
                  <Text style={[styles.optionText, actionType === 'ban' && styles.optionTextActive]}>
                    Cấm người dùng
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Target User Selection */}
              {(actionType === 'warning' || actionType === 'ban') && (
                <>
                  <Text style={styles.sectionLabel}>Cảnh báo/Cấm ai?</Text>
                  <View style={styles.userSelectGroup}>
                    <TouchableOpacity
                      style={[styles.userSelectButton, targetUser === 'target' && styles.userSelectButtonActive]}
                      onPress={() => setTargetUser('target')}
                    >
                      <Ionicons 
                        name="person-circle" 
                        size={20} 
                        color={targetUser === 'target' ? '#fff' : '#6b7280'} 
                      />
                      <View style={styles.userSelectContent}>
                        <Text style={[styles.userSelectTitle, targetUser === 'target' && styles.userSelectTitleActive]}>
                          Người bị báo cáo
                        </Text>
                        <Text style={[styles.userSelectSubtitle, targetUser === 'target' && styles.userSelectSubtitleActive]}>
                          {selectedReport?.TargetFullName || selectedReport?.TargetUsername || `${selectedReport?.TargetType} ID: ${selectedReport?.TargetID}`}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.userSelectButton, targetUser === 'reporter' && styles.userSelectButtonActive]}
                      onPress={() => setTargetUser('reporter')}
                    >
                      <Ionicons 
                        name="flag" 
                        size={20} 
                        color={targetUser === 'reporter' ? '#fff' : '#6b7280'} 
                      />
                      <View style={styles.userSelectContent}>
                        <Text style={[styles.userSelectTitle, targetUser === 'reporter' && styles.userSelectTitleActive]}>
                          Người gửi báo cáo
                        </Text>
                        <Text style={[styles.userSelectSubtitle, targetUser === 'reporter' && styles.userSelectSubtitleActive]}>
                          {selectedReport?.ReporterFullName || selectedReport?.ReporterUsername || `ID: ${selectedReport?.ReporterID}`} (báo cáo sai/spam)
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Warning Severity */}
              {actionType === 'warning' && (
                <>
                  <Text style={styles.sectionLabel}>Mức độ vi phạm</Text>
                  <View style={styles.severityGroup}>
                    <TouchableOpacity
                      style={[styles.severityButton, warningSeverity === 1 && styles.severityButton1Active]}
                      onPress={() => setWarningSeverity(1)}
                    >
                      <Text style={[styles.severityText, warningSeverity === 1 && styles.severityTextActive]}>
                        Nhẹ
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.severityButton, warningSeverity === 2 && styles.severityButton2Active]}
                      onPress={() => setWarningSeverity(2)}
                    >
                      <Text style={[styles.severityText, warningSeverity === 2 && styles.severityTextActive]}>
                        Trung bình
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.severityButton, warningSeverity === 3 && styles.severityButton3Active]}
                      onPress={() => setWarningSeverity(3)}
                    >
                      <Text style={[styles.severityText, warningSeverity === 3 && styles.severityTextActive]}>
                        Nghiêm trọng
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Ban Type */}
              {actionType === 'ban' && (
                <>
                  <Text style={styles.sectionLabel}>Loại cấm</Text>
                  <View style={styles.banTypeGroup}>
                    {[
                      { value: 'POST', label: 'Cấm đăng bài', icon: 'newspaper' },
                      { value: 'COMMENT', label: 'Cấm bình luận', icon: 'chatbox' },
                      { value: 'REPORT', label: 'Cấm báo cáo', icon: 'flag' },
                      { value: 'FULL', label: 'Cấm toàn bộ', icon: 'ban' },
                    ].map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[styles.banTypeButton, banType === type.value && styles.banTypeButtonActive]}
                        onPress={() => setBanType(type.value as any)}
                      >
                        <Ionicons 
                          name={type.icon as any} 
                          size={18} 
                          color={banType === type.value ? '#fff' : '#6b7280'} 
                        />
                        <Text style={[styles.banTypeText, banType === type.value && styles.banTypeTextActive]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>Thời gian cấm (ngày)</Text>
                  <View style={styles.durationGroup}>
                    {[3, 7, 14, 30, 365].map((days) => (
                      <TouchableOpacity
                        key={days}
                        style={[styles.durationButton, banDuration === days && styles.durationButtonActive]}
                        onPress={() => setBanDuration(days)}
                      >
                        <Text style={[styles.durationText, banDuration === days && styles.durationTextActive]}>
                          {days === 365 ? 'Vĩnh viễn' : `${days} ngày`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Reason */}
              <Text style={styles.sectionLabel}>Lý do xử lý *</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Nhập lý do xử lý báo cáo này..."
                multiline
                numberOfLines={4}
                value={reason}
                onChangeText={setReason}
                textAlignVertical="top"
              />

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleProcessReport}
                >
                  <Text style={styles.confirmButtonText}>Xác nhận</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal
        visible={alertModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertModal({ ...alertModal, visible: false })}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <View style={[
              styles.alertIconContainer,
              alertModal.type === 'success' && styles.alertSuccessBg,
              alertModal.type === 'error' && styles.alertErrorBg,
              alertModal.type === 'warning' && styles.alertWarningBg,
            ]}>
              <Ionicons
                name={
                  alertModal.type === 'success' ? 'checkmark-circle' :
                  alertModal.type === 'error' ? 'close-circle' :
                  'alert-circle'
                }
                size={48}
                color="#fff"
              />
            </View>
            
            <Text style={styles.alertTitle}>{alertModal.title}</Text>
            <Text style={styles.alertMessage}>{alertModal.message}</Text>
            
            <TouchableOpacity
              style={[
                styles.alertButton,
                alertModal.type === 'success' && styles.alertButtonSuccess,
                alertModal.type === 'error' && styles.alertButtonError,
                alertModal.type === 'warning' && styles.alertButtonWarning,
              ]}
              onPress={alertModal.onConfirm}
            >
              <Text style={styles.alertButtonText}>OK</Text>
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    maxHeight: '85%',
  },
  modalScrollView: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    marginTop: 12,
  },
  reportInfoBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  userSelectGroup: {
    gap: 8,
  },
  userSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    gap: 12,
  },
  userSelectButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  userSelectContent: {
    flex: 1,
  },
  userSelectTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userSelectTitleActive: {
    color: '#fff',
  },
  userSelectSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  userSelectSubtitleActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  optionGroup: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  optionButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  optionTextActive: {
    color: '#fff',
  },
  severityGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  severityButton1Active: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  severityButton2Active: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  severityButton3Active: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  severityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  severityTextActive: {
    color: '#fff',
  },
  banTypeGroup: {
    gap: 8,
  },
  banTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  banTypeButtonActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  banTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  banTypeTextActive: {
    color: '#fff',
  },
  durationGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  durationButtonActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  durationTextActive: {
    color: '#fff',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#fff',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  filterTextActive: {
    color: '#ef4444',
  },
  listContainer: {
    padding: 16,
  },
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  reportContent: {
    marginBottom: 12,
  },
  reportLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  reportReason: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  reportInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  toggleButton: {
    backgroundColor: '#3b82f6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
  // Custom Alert Modal Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  alertIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  alertSuccessBg: {
    backgroundColor: '#10b981',
  },
  alertErrorBg: {
    backgroundColor: '#ef4444',
  },
  alertWarningBg: {
    backgroundColor: '#f59e0b',
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  alertButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  alertButtonSuccess: {
    backgroundColor: '#10b981',
  },
  alertButtonError: {
    backgroundColor: '#ef4444',
  },
  alertButtonWarning: {
    backgroundColor: '#f59e0b',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
