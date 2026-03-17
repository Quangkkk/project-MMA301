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
  Modal,
  Animated
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authService } from '../services/authService';

export default function RegisterScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
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

  const handleRegister = async () => {
    const { username, email, password, confirmPassword, fullName } = formData;

    if (!username || !email || !password || !fullName) {
      showModal('error', 'Thiếu thông tin', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      showModal('error', 'Mật khẩu không khớp', 'Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      showModal('error', 'Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register({
        username,
        email,
        password,
        fullName
      });

      if (response.success) {
        showModal(
          'success',
          'Đăng ký thành công!',
          'Vui lòng kiểm tra email để xác thực tài khoản.'
        );
      } else {
        showModal('error', 'Đăng ký thất bại', response.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      showModal('error', 'Lỗi', error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              <MaterialCommunityIcons name="account-plus" size={60} color="#4A90E2" />
            </View>
            <Text style={styles.logoText}>Student Forum</Text>
            <Text style={styles.logoSubtext}>Tạo tài khoản mới</Text>
          </View>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Đăng ký tài khoản</Text>
          <Text style={styles.welcomeSubtext}>Điền thông tin để bắt đầu</Text>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập tên đăng nhập"
                placeholderTextColor="#999"
                value={formData.username}
                onChangeText={(value) => updateField('username', value)}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Họ và tên</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account-circle-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#999"
                value={formData.fullName}
                onChangeText={(value) => updateField('fullName', value)}
                editable={!loading}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập email"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-check-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor="#999"
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons 
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
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
                {modalType === 'success' ? 'Đến trang đăng nhập' : 'Đóng'}
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
  eyeIcon: {
    padding: 8,
  },
  registerButton: {
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
  registerButtonDisabled: {
    opacity: 0.6,
    elevation: 0,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 20,
  },
  loginText: {
    fontSize: 15,
    color: '#6b7280',
  },
  loginLink: {
    fontSize: 15,
    color: '#4A90E2',
    fontWeight: '700',
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
