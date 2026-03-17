import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chính sách bảo mật</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-lock" size={48} color="#10b981" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Chính sách bảo mật thông tin</Text>
          <Text style={styles.sectionText}>Chúng tôi cam kết bảo vệ quyền riêng tư và thông tin của bạn.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="database" size={24} color="#3b82f6" />
            <Text style={styles.cardTitle}>1. Thu thập dữ liệu</Text>
          </View>
          <Text style={styles.cardText}>• Email, tên, ảnh đại diện</Text>
          <Text style={styles.cardText}>• Hoạt động trên nền tảng</Text>
          <Text style={styles.cardText}>• Cookie và dữ liệu thiết bị</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="chart-line" size={24} color="#8b5cf6" />
            <Text style={styles.cardTitle}>2. Sử dụng dữ liệu</Text>
          </View>
          <Text style={styles.cardText}>• Cải thiện trải nghiệm người dùng</Text>
          <Text style={styles.cardText}>• Gửi thông báo quan trọng</Text>
          <Text style={styles.cardText}>• Phân tích và thống kê</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#10b981" />
            <Text style={styles.cardTitle}>3. Bảo vệ dữ liệu</Text>
          </View>
          <Text style={styles.cardText}>• Mã hóa thông tin nhạy cảm</Text>
          <Text style={styles.cardText}>• Không chia sẻ cho bên thứ ba</Text>
          <Text style={styles.cardText}>• Backup định kỳ</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account-key" size={24} color="#f59e0b" />
            <Text style={styles.cardTitle}>4. Quyền của bạn</Text>
          </View>
          <Text style={styles.cardText}>• Xem, sửa, xóa dữ liệu cá nhân</Text>
          <Text style={styles.cardText}>• Từ chối nhận email marketing</Text>
          <Text style={styles.cardText}>• Yêu cầu xuất dữ liệu</Text>
        </View>

        <View style={styles.footer}>
          <MaterialCommunityIcons name="lock-check" size={20} color="#10b981" />
          <Text style={styles.footerText}>Thông tin của bạn luôn an toàn với chúng tôi</Text>
        </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4b5563',
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },
});

export default PrivacyPolicyScreen;
