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

const HelpScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#f59e0b', '#d97706']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trợ giúp</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="help-circle" size={48} color="#f59e0b" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❓ Câu hỏi thường gặp</Text>
          <Text style={styles.sectionText}>Tìm kiếm câu trả lời cho các vấn đề phổ biến</Text>
        </View>

        <View style={styles.faqCard}>
          <View style={styles.questionHeader}>
            <MaterialCommunityIcons name="message-question" size={20} color="#3b82f6" />
            <Text style={styles.questionText}>Làm sao để đăng bài?</Text>
          </View>
          <Text style={styles.answerText}>Nhấn nút + ở màn hình chính, viết nội dung và chọn Đăng.</Text>
        </View>

        <View style={styles.faqCard}>
          <View style={styles.questionHeader}>
            <MaterialCommunityIcons name="message-question" size={20} color="#3b82f6" />
            <Text style={styles.questionText}>Tôi quên mật khẩu?</Text>
          </View>
          <Text style={styles.answerText}>Nhấn "Quên mật khẩu" ở màn hình đăng nhập, làm theo hướng dẫn.</Text>
        </View>

        <View style={styles.faqCard}>
          <View style={styles.questionHeader}>
            <MaterialCommunityIcons name="message-question" size={20} color="#3b82f6" />
            <Text style={styles.questionText}>Cách xóa bài viết?</Text>
          </View>
          <Text style={styles.answerText}>Nhấn 3 chấm trên bài viết của bạn, chọn Xóa.</Text>
        </View>

        <View style={styles.faqCard}>
          <View style={styles.questionHeader}>
            <MaterialCommunityIcons name="message-question" size={20} color="#3b82f6" />
            <Text style={styles.questionText}>Làm sao tăng điểm uy tín?</Text>
          </View>
          <Text style={styles.answerText}>Đăng bài chất lượng, bình luận hữu ích, nhận được reactions từ người khác.</Text>
        </View>

        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <MaterialCommunityIcons name="headset" size={24} color="#f59e0b" />
            <Text style={styles.contactTitle}>Hỗ trợ thêm</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="email" size={20} color="#6b7280" />
            <Text style={styles.contactText}>help@studentforum.edu</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="phone" size={20} color="#6b7280" />
            <Text style={styles.contactText}>1900-xxxx</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="clock" size={20} color="#6b7280" />
            <Text style={styles.contactText}>8h-17h (T2-T6)</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <MaterialCommunityIcons name="chat-processing" size={20} color="#f59e0b" />
          <Text style={styles.footerText}>Chúng tôi sẵn sàng hỗ trợ bạn!</Text>
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
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
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
  faqCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
    paddingLeft: 28,
  },
  contactCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#4b5563',
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
    color: '#f59e0b',
    fontWeight: '600',
  },
});

export default HelpScreen;
