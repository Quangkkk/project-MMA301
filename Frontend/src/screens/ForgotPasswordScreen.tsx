import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config/api';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const showModal = (type: 'success' | 'error', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    if (modalType === 'success') {
      navigation.navigate('VerifyOTP', { email: email.trim() });
    }
  };

  const handleSendOTP = async () => {
    if (!email || !username) {
      showModal('error', 'Thiếu thông tin', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showModal('error', 'Email không hợp lệ', 'Vui lòng nhập đúng định dạng email');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, {
        email: email.trim(),
        username: username.trim()
      });

      if (response.data.success) {
        showModal('success', 'Gửi OTP thành công!', response.data.message);
      } else {
        showModal('error', 'Gửi OTP thất bại', response.data.message);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Không thể kết nối đến server';
      showModal('error', 'Lỗi', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="lock-reset" size={60} color="#4A90E2" />
            </View>
            <Text style={styles.logoText}>Quên mật khẩu</Text>
            <Text style={styles.logoSubtext}>Nhập thông tin để nhận mã OTP</Text>
          </View>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Đặt lại mật khẩu</Text>
          <Text style={styles.welcomeSubtext}>
            Nhập email và tên đăng nhập của bạn để nhận mã OTP
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập email của bạn"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập tên đăng nhập"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          {/* Send OTP Button */}
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Gửi mã OTP</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <View style={styles.backContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.backText}>
                <MaterialCommunityIcons name="arrow-left" size={16} color="#4A90E2" />
                {' '}Quay lại đăng nhập
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Custom Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={hideModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[
              styles.modalIconContainer,
              modalType === 'success' ? styles.successIcon : styles.errorIcon
            ]}>
              <MaterialCommunityIcons 
                name={modalType === 'success' ? 'check-circle' : 'close-circle'} 
                size={60} 
                color="#fff" 
              />
            </View>
            
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            
            <TouchableOpacity
              style={[
                styles.modalButton,
                modalType === 'success' ? styles.successButton : styles.errorButton
              ]}
              onPress={hideModal}
            >
              <Text style={styles.modalButtonText}>
                {modalType === 'success' ? 'Tiếp tục' : 'Đóng'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 70,
    paddingBottom: 50,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 6,
    letterSpacing: 1,
  },
  logoSubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  formContainer: {
    padding: 28,
    paddingTop: 32,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  welcomeSubtext: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 28,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#1a1a1a',
  },
  sendButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  sendButtonDisabled: {
    opacity: 0.6,
    elevation: 0,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  backContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 20,
  },
  backText: {
    fontSize: 15,
    color: '#4A90E2',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    backgroundColor: '#10b981',
  },
  errorIcon: {
    backgroundColor: '#ef4444',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  successButton: {
    backgroundColor: '#10b981',
  },
  errorButton: {
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
