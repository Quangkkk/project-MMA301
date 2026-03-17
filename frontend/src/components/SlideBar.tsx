import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';

interface SidebarModalProps {
  visible: boolean;
  onClose: () => void;
  currentRoute: string;
  userStats?: {
    totalPosts: number;
    totalComments: number;
    totalReactions: number;
  };
}

const SidebarModal: React.FC<SidebarModalProps> = ({
  visible,
  onClose,
  currentRoute,
  userStats,
}) => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [avatarURL, setAvatarURL] = useState<string>('');

  useEffect(() => {
    if (visible) {
      loadAvatar();
    }
  }, [visible]);

  const loadAvatar = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvatarURL(response.data.data?.AvatarURL || '');
    } catch (error: any) {
      // Ignore 404 errors for admin users who may not have profile endpoint
      if (error?.response?.status !== 404) {
        console.error('Load avatar error:', error);
      }
      setAvatarURL('');
    }
  };

  const menuItems = [
    { icon: 'home-outline', label: 'Trang chủ', route: 'Home' },
    { icon: 'account-outline', label: 'Hồ sơ', route: 'Profile' },
    { icon: 'chat-outline', label: 'Tin nhắn', route: 'ChatList' },
    { icon: 'bell-outline', label: 'Thông báo', route: 'Notifications' },
    { icon: 'flag-outline', label: 'Báo cáo của tôi', route: 'ReportHistory' },
  ];

  const settingsItems = [
    { icon: 'file-document-outline', label: 'Điều khoản sử dụng', route: 'TermsOfService' },
    { icon: 'shield-check-outline', label: 'Chính sách bảo mật', route: 'PrivacyPolicy' },
    { icon: 'information-outline', label: 'Giới thiệu', route: 'About' },
    { icon: 'help-circle-outline', label: 'Trợ giúp', route: 'Help' },
  ];

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(route);
    }, 100);
  };

  const handleSettingPress = (item: typeof settingsItems[0]) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(item.route);
    }, 100);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.sidebar}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* User Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                {avatarURL ? (
                  <Image source={{ uri: avatarURL }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
              
              <View style={styles.badgeContainer}>
                <View style={[styles.roleBadge, { backgroundColor: user?.role === 'Admin' ? '#ef4444' : '#3b82f6' }]}>
                  <Text style={styles.roleText}>{user?.role || 'User'}</Text>
                </View>
              </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    currentRoute === item.route && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigate(item.route)}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={20}
                    color={currentRoute === item.route ? '#3b82f6' : '#6b7280'}
                  />
                  <Text
                    style={[
                      styles.menuLabel,
                      currentRoute === item.route && styles.menuLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Settings Dropdown */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setSettingsExpanded(!settingsExpanded)}
              >
                <MaterialCommunityIcons
                  name="cog-outline"
                  size={20}
                  color="#6b7280"
                />
                <Text style={styles.menuLabel}>Cài đặt</Text>
                <MaterialCommunityIcons
                  name={settingsExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#6b7280"
                />
              </TouchableOpacity>

              {settingsExpanded && (
                <View style={styles.dropdownContainer}>
                  {settingsItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => handleSettingPress(item)}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={18}
                        color="#9ca3af"
                      />
                      <Text style={styles.dropdownLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Logout */}
            <View style={styles.logoutSection}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
               
                <Text style={styles.logoutText}>Đăng xuất</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Student Forum v1.0.0</Text>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  sidebar: {
    width: 240,
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  profileSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  reputationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  reputationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  menuSection: {
    paddingVertical: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  menuItemActive: {
    backgroundColor: '#e8f1ff',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  menuLabelActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  dropdownContainer: {
    backgroundColor: '#f9fafb',
    paddingVertical: 6,
    paddingLeft: 46,
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
    marginLeft: 16,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 16,
    gap: 8,
  },
  dropdownLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  logoutSection: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  logoutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoutText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 11,
    color: '#9ca3af',
  },
});

export default SidebarModal;
