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

const AboutScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giới thiệu</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="information" size={48} color="#8b5cf6" />
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.appName}>Student Forum</Text>
          <Text style={styles.appVersion}>Phiên bản 1.0.0</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="book-open-variant" size={24} color="#3b82f6" />
            <Text style={styles.cardTitle}>Sứ mệnh</Text>
          </View>
          <Text style={styles.cardText}>Kết nối sinh viên, chia sẻ kiến thức và xây dựng cộng đồng học tập tích cực.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="star-circle" size={24} color="#f59e0b" />
            <Text style={styles.cardTitle}>Tính năng nổi bật</Text>
          </View>
          <Text style={styles.featureText}>• Đăng bài, bình luận, tương tác</Text>
          <Text style={styles.featureText}>• Hệ thống thông báo thời gian thực</Text>
          <Text style={styles.featureText}>• Chat riêng tư an toàn</Text>
          <Text style={styles.featureText}>• Theo dõi người dùng khác</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="code-braces" size={24} color="#10b981" />
            <Text style={styles.cardTitle}>Đội ngũ phát triển</Text>
          </View>
          <View style={styles.techStack}>
            <View style={styles.techItem}>
              <MaterialCommunityIcons name="react" size={20} color="#61dafb" />
              <Text style={styles.techText}>React Native + TypeScript</Text>
            </View>
            <View style={styles.techItem}>
              <MaterialCommunityIcons name="nodejs" size={20} color="#68a063" />
              <Text style={styles.techText}>Node.js + SQL Server</Text>
            </View>
            <View style={styles.techItem}>
              <MaterialCommunityIcons name="cloud" size={20} color="#3b82f6" />
              <Text style={styles.techText}>Cloudinary, Azure</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar" size={20} color="#6b7280" />
            <Text style={styles.infoText}>Ra mắt: Tháng 1/2026</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="email" size={20} color="#6b7280" />
            <Text style={styles.infoText}>support@studentforum.edu</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Student Forum. All rights reserved.</Text>
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
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
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
  },
  featureText: {
    fontSize: 14,
    lineHeight: 24,
    color: '#4b5563',
    marginBottom: 4,
  },
  techStack: {
    gap: 12,
  },
  techItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  techText: {
    fontSize: 14,
    color: '#4b5563',
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default AboutScreen;
