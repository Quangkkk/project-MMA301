import React, { useState, useRef } from 'react';
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

export default function VerifyOTPScreen({ route, navigation }: any) {
  const { email } = route.params;
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const showModal = (type: 'success' | 'error', title: string, message: string, onSuccess?: () => void) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
    if (type === 'success' && onSuccess) {
      setTimeout(() => {
        setModalVisible(false);
        onSuccess();
      }, 1500);
    }
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  const handleOTPChange = (value: string, index: number) => {
    if (value.length > 1) return; // Chỉ cho phép 1 ký tự

    const newOTP = [...otp];
    newOTP[index] = value;
    setOTP(newOTP);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      showModal('error', 'OTP không hợp lệ', 'Vui lòng nhập đầy đủ 6 số OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, {
        email,
        otp: otpCode
      });

      if (response.data.success) {
        showModal(
          'success',
          'Xác thực thành công!',
          'OTP đã được xác thực',
          () => navigation.navigate('ResetPassword', { email, otp: otpCode })
        );
      } else {
        showModal('error', 'Xác thực thất bại', response.data.message);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Không thể xác thực OTP';
      showModal('error', 'Lỗi', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    showModal('error', 'Thông báo', 'Chức năng gửi lại OTP đang được phát triển');
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
              <MaterialCommunityIcons name="shield-check" size={60} color="#4A90E2" />
            </View>
            <Text style={styles.logoText}>Xác thực OTP</Text>
            <Text style={styles.logoSubtext}>Nhập mã OTP đã gửi đến email</Text>
          </View>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Nhập mã OTP</Text>
          <Text style={styles.welcomeSubtext}>
            Mã xác thực đã được gửi đến{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          {/* OTP Input Boxes */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOTPChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                editable={!loading}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Xác nhận</Text>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Không nhận được mã? </Text>
            <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
              <Text style={styles.resendLink}>Gửi lại</Text>
            </TouchableOpacity>
          </View>

          {/* Back Button */}
          <View style={styles.backContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.backText}>
                <MaterialCommunityIcons name="arrow-left" size={16} color="#4A90E2" />
                {' '}Quay lại
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
                name={modalType === 'success' ? 'shield-check' : 'close-circle'} 
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
    textAlign: 'center',
  },
  emailText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  verifyButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
    elevation: 0,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  resendText: {
    fontSize: 15,
    color: '#6b7280',
  },
  resendLink: {
    fontSize: 15,
    color: '#4A90E2',
    fontWeight: '700',
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
