import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';

export default function ChangePasswordScreen({ navigation }: any) {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [saving, setSaving] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });

  const handleChangePassword = async () => {
    // Validation
    if (!passwords.currentPassword.trim()) {
      setErrorModal({ visible: true, message: 'Vui lòng nhập mật khẩu hiện tại' });
      return;
    }

    if (!passwords.newPassword.trim()) {
      setErrorModal({ visible: true, message: 'Vui lòng nhập mật khẩu mới' });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setErrorModal({ visible: true, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrorModal({ visible: true, message: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    if (passwords.currentPassword === passwords.newPassword) {
      setErrorModal({ visible: true, message: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('authToken');
      
      await axios.put(
        `${API_URL}/auth/change-password`,
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccessModal(true);
      setTimeout(() => {
        setSuccessModal(false);
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      console.error('Change password error:', error);
      setErrorModal({ 
        visible: true, 
        message: error.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại.' 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thay đổi mật khẩu</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu hiện tại *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={passwords.currentPassword}
                onChangeText={(text) => setPasswords({ ...passwords, currentPassword: text })}
                placeholder="Nhập mật khẩu hiện tại"
                secureTextEntry={!showPasswords.current}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              >
                <MaterialCommunityIcons 
                  name={showPasswords.current ? "eye-off" : "eye"} 
                  size={22} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu mới *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={passwords.newPassword}
                onChangeText={(text) => setPasswords({ ...passwords, newPassword: text })}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                secureTextEntry={!showPasswords.new}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              >
                <MaterialCommunityIcons 
                  name={showPasswords.new ? "eye-off" : "eye"} 
                  size={22} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Xác nhận mật khẩu mới *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={passwords.confirmPassword}
                onChangeText={(text) => setPasswords({ ...passwords, confirmPassword: text })}
                placeholder="Nhập lại mật khẩu mới"
                secureTextEntry={!showPasswords.confirm}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              >
                <MaterialCommunityIcons 
                  name={showPasswords.confirm ? "eye-off" : "eye"} 
                  size={22} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Security Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Lưu ý bảo mật:</Text>
            <Text style={styles.tipText}>• Mật khẩu nên có ít nhất 6 ký tự</Text>
            <Text style={styles.tipText}>• Kết hợp chữ hoa, chữ thường và số</Text>
            <Text style={styles.tipText}>• Không chia sẻ mật khẩu với ai</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={handleChangePassword}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Đổi mật khẩu</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={successModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIcon, styles.successIcon]}>
              <MaterialCommunityIcons name="check-circle" size={60} color="#10b981" />
            </View>
            <Text style={styles.modalTitle}>Thành công!</Text>
            <Text style={styles.modalMessage}>Đã thay đổi mật khẩu</Text>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={errorModal.visible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIcon, styles.errorIcon]}>
              <MaterialCommunityIcons name="close-circle" size={60} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Lỗi!</Text>
            <Text style={styles.modalMessage}>{errorModal.message}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setErrorModal({ visible: false, message: '' })}
            >
              <Text style={styles.modalButtonText}>Đóng</Text>
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
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
    backgroundColor: '#fff'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000'
  },
  content: {
    flex: 1
  },
  formSection: {
    padding: 16
  },
  inputGroup: {
    marginBottom: 24
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4e6eb',
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937'
  },
  eyeIcon: {
    padding: 10
  },
  tipsContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#1877f2'
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8
  },
  tipText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4
  },
  submitButton: {
    backgroundColor: '#1877f2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320
  },
  modalIcon: {
    marginBottom: 16
  },
  successIcon: {},
  errorIcon: {},
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8
  },
  modalMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16
  },
  modalButton: {
    backgroundColor: '#1877f2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  }
});
