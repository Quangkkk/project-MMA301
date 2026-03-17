import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  Modal,
  Pressable
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ProfileData {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  bio: string;
  dateOfBirth: string;
  avatarURL: string;
}

export default function EditProfileScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    bio: '',
    dateOfBirth: '',
    avatarURL: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data.data;
      setProfileData({
        fullName: data.FullName || '',
        email: data.Email || '',
        phoneNumber: data.PhoneNumber || '',
        address: data.Address || '',
        bio: data.Bio || '',
        dateOfBirth: data.DateOfBirth ? new Date(data.DateOfBirth).toISOString().split('T')[0] : '',
        avatarURL: data.AvatarURL || ''
      });
    } catch (error: any) {
      console.error('Load profile error:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profileData.fullName.trim()) {
      setErrorModal({ visible: true, message: 'Họ tên không được để trống' });
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('authToken');
      await axios.put(
        `${API_URL}/users/profile`,
        {
          fullName: profileData.fullName.trim(),
          email: profileData.email,
          phoneNumber: profileData.phoneNumber.trim() || null,
          address: profileData.address.trim() || null,
          bio: profileData.bio.trim() || null,
          dateOfBirth: profileData.dateOfBirth || null
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
      console.error('Update profile error:', error);
      setErrorModal({ 
        visible: true, 
        message: error.response?.data?.message || 'Không thể cập nhật hồ sơ' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Pick avatar error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('authToken');

      // Create form data
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await axios.post(
        `${API_URL}/users/profile/avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Update local state
      setProfileData(prev => ({
        ...prev,
        avatarURL: response.data.data.avatarURL
      }));

      setSuccessModal(true);
      setTimeout(() => setSuccessModal(false), 1500);
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      setErrorModal({ 
        visible: true, 
        message: error.response?.data?.message || 'Không thể tải lên ảnh' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setProfileData({ ...profileData, dateOfBirth: formattedDate });
    }
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1877f2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#1877f2" />
          ) : (
            <MaterialCommunityIcons name="check" size={24} color="#1877f2" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          {profileData.avatarURL ? (
            <Image 
              source={{ uri: profileData.avatarURL }} 
              style={styles.avatarImage}
            />
          ) : (
            <View style={[styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {profileData.fullName ? getInitials(profileData.fullName) : 'U'}
              </Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.changeAvatarButton}
            onPress={handlePickAvatar}
            disabled={saving}
          >
            <Text style={styles.changeAvatarText}>Đổi ảnh đại diện</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên *</Text>
            <TextInput
              style={styles.input}
              value={profileData.fullName}
              onChangeText={(text) => setProfileData({ ...profileData, fullName: text })}
              placeholder="Nhập họ và tên"
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profileData.email}
              editable={false}
              placeholder="Nhập email"
            />
            <Text style={styles.helperText}>Email không thể thay đổi</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={profileData.phoneNumber}
              onChangeText={(text) => setProfileData({ ...profileData, phoneNumber: text })}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              maxLength={20}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput
              style={styles.input}
              value={profileData.address}
              onChangeText={(text) => setProfileData({ ...profileData, address: text })}
              placeholder="Nhập địa chỉ"
              maxLength={255}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày sinh</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={profileData.dateOfBirth ? styles.dateText : styles.datePlaceholder}>
                {profileData.dateOfBirth || 'Chọn ngày sinh'}
              </Text>
              <MaterialCommunityIcons name="calendar" size={20} color="#65676b" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giới thiệu bản thân</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={profileData.bio}
              onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
              placeholder="Viết một vài dòng về bạn..."
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{profileData.bio.length}/500</Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
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
            <Text style={styles.modalMessage}>Đã cập nhật thông tin</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 6,
    borderBottomColor: '#f0f2f5'
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1877f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  changeAvatarButton: {
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  changeAvatarText: {
    color: '#1877f2',
    fontSize: 15,
    fontWeight: '600'
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
  input: {
    borderWidth: 1,
    borderColor: '#e4e6eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#fff'
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280'
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e4e6eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  dateText: {
    fontSize: 15,
    color: '#1f2937'
  },
  datePlaceholder: {
    fontSize: 15,
    color: '#9ca3af'
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  charCount: {
    fontSize: 12,
    color: '#65676b',
    textAlign: 'right',
    marginTop: 4
  },
  bottomSpacing: {
    height: 40
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
