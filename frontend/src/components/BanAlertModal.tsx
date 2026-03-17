import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface BanInfo {
  BanID: number;
  BanType: string;
  BanReason: string;
  StartDate: string;
  EndDate: string | null;
  AdminName: string;
}

interface BanAlertModalProps {
  visible: boolean;
  bans: BanInfo[];
  onClose: () => void;
}

const BanAlertModal: React.FC<BanAlertModalProps> = ({ visible, bans, onClose }) => {
  console.log('[BanAlertModal] Render - visible:', visible, 'bans:', bans);
  
  if (!bans || bans.length === 0) {
    console.log('[BanAlertModal] No bans, returning null');
    return null;
  }

  const getBanTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'POST': 'Đăng bài',
      'COMMENT': 'Bình luận',
      'REPORT': 'Báo cáo vi phạm',
      'FULL': 'Toàn bộ hệ thống',
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Vĩnh viễn';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = (endDate: string | null) => {
    if (!endDate) return 'Vĩnh viễn';
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Đã hết hạn';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `Còn ${days} ngày ${hours} giờ`;
    } else {
      return `Còn ${hours} giờ`;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerIcon}>⚠️</Text>
            <Text style={styles.headerTitle}>Tài khoản bị hạn chế</Text>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.description}>
              Tài khoản của bạn đã bị quản trị viên hạn chế do vi phạm quy định của diễn đàn.
            </Text>

            {bans.map((ban, index) => (
              <View key={ban.BanID} style={styles.banCard}>
                <View style={styles.banHeader}>
                  <Text style={styles.banType}>
                    🚫 {getBanTypeText(ban.BanType)}
                  </Text>
                  <Text style={styles.banDuration}>
                    {getDuration(ban.EndDate)}
                  </Text>
                </View>

                <View style={styles.banDetail}>
                  <Text style={styles.label}>Lý do:</Text>
                  <Text style={styles.value}>{ban.BanReason}</Text>
                </View>

                <View style={styles.banDetail}>
                  <Text style={styles.label}>Bắt đầu:</Text>
                  <Text style={styles.value}>{formatDate(ban.StartDate)}</Text>
                </View>

                <View style={styles.banDetail}>
                  <Text style={styles.label}>Kết thúc:</Text>
                  <Text style={styles.value}>{formatDate(ban.EndDate)}</Text>
                </View>

                <View style={styles.banDetail}>
                  <Text style={styles.label}>Người thực hiện:</Text>
                  <Text style={styles.value}>{ban.AdminName}</Text>
                </View>
              </View>
            ))}

            <Text style={styles.footer}>
              Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ với quản trị viên để được hỗ trợ.
            </Text>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Đã hiểu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  banCard: {
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  banHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  banType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  banDuration: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#fee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  banDetail: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  footer: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  closeButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BanAlertModal;
