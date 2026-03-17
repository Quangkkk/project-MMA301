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

const TermsOfServiceScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#3b82f6', '#2563eb']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Điều khoản sử dụng</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color="#3b82f6" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📜 Chào mừng bạn đến với Student Forum!</Text>
          <Text style={styles.sectionText}>Bằng việc sử dụng dịch vụ của chúng tôi, bạn đồng ý với các điều khoản sau:</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#10b981" />
            <Text style={styles.cardTitle}>1. Điều khoản chung</Text>
          </View>
          <Text style={styles.cardText}>• Người dùng phải từ 18 tuổi trở lên</Text>
          <Text style={styles.cardText}>• Tuân thủ quy tắc cộng đồng</Text>
          <Text style={styles.cardText}>• Không spam, quấy rối người khác</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account-check" size={24} color="#3b82f6" />
            <Text style={styles.cardTitle}>2. Quyền và trách nhiệm</Text>
          </View>
          <Text style={styles.cardText}>• Bạn sở hữu nội dung của mình</Text>
          <Text style={styles.cardText}>• Chúng tôi có quyền xóa nội dung vi phạm</Text>
          <Text style={styles.cardText}>• Bảo vệ thông tin cá nhân</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#ef4444" />
            <Text style={styles.cardTitle}>3. Hành vi cấm</Text>
          </View>
          <Text style={styles.cardText}>• Chia sẻ nội dung bất hợp pháp</Text>
          <Text style={styles.cardText}>• Mạo danh người khác</Text>
          <Text style={styles.cardText}>• Sử dụng bot hoặc tự động hóa</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Cập nhật lần cuối: 31/01/2026</Text>
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
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
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
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default TermsOfServiceScreen;
