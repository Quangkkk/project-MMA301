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

export default function ResetPasswordScreen({ route, navigation }: any) {
  const { email, otp } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      navigation.navigate('Login');
    }
  };

  const handleResetPassword = async () => {
    // Validation
    if (!password.trim() || !confirmPassword.trim()) {
      showModal('error', 'Thiếu thông tin', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (password.length < 6) {
      showModal('error', 'Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      showModal('error', 'Mật khẩu không khớp', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        otp,
        newPassword: password
      });

      if (response.data.success) {
        showModal(
          'success',
          'Đổi mật khẩu thành công!',
          'Vui lòng đăng nhập lại với mật khẩu mới'
        );
      } else {
        showModal('error', 'Đổi mật khẩu thất bại', response.data.message);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Không thể đổi mật khẩu';
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
            <Text style={styles.logoText}>Đặt lại mật khẩu</Text>
            <Text style={styles.logoSubtext}>Tạo mật khẩu mới cho tài khoản</Text>
          </View>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Mật khẩu mới</Text>
          <Text style={styles.welcomeSubtext}>
            Vui lòng nhập mật khẩu mới cho tài khoản của bạn
          </Text>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={22}
              color="#6b7280"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu mới"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="lock-check-outline"
              size={22}
              color="#6b7280"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu mới"
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <MaterialCommunityIcons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Yêu cầu mật khẩu:</Text>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={password.length >= 6 ? 'check-circle' : 'circle-outline'}
                size={18}
                color={password.length >= 6 ? '#10b981' : '#9ca3af'}
              />
              <Text style={[
                styles.requirementText,
                password.length >= 6 && styles.requirementTextValid
              ]}>
                Ít nhất 6 ký tự
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={password === confirmPassword && password ? 'check-circle' : 'circle-outline'}
                size={18}
                color={password === confirmPassword && password ? '#10b981' : '#9ca3af'}
              />
              <Text style={[
                styles.requirementText,
                password === confirmPassword && password && styles.requirementTextValid
              ]}>
                Mật khẩu xác nhận khớp
              </Text>
            </View>
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={[styles.resetButton, loading && styles.resetButtonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                <Text style={styles.resetButtonText}>  Đặt lại mật khẩu</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <View style={styles.loginContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.loginText}>
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
                {modalType === 'success' ? 'Đăng nhập ngay' : 'Đóng'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>    </KeyboardAvoidingView>
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
    fontSize: 34,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 6,
    letterSpacing: 1,
  },
  logoSubtext: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  formContainer: {
    padding: 28,
    paddingTop: 32,
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    color: '#1a1a1a',
  },
  eyeIcon: {
    padding: 8,
  },
  requirementsContainer: {
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A90E2',
    marginBottom: 10,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  requirementTextValid: {
    color: '#10b981',
  },
  resetButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  resetButtonDisabled: {
    opacity: 0.6,
    elevation: 0,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 20,
  },
  loginText: {
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
