import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: any;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose, navigation }) => {
  const { logout, user } = useAuth();

  const menuItems = [
    { icon: 'view-dashboard', title: 'Dashboard', screen: 'AdminDashboard' },
    { icon: 'account-group', title: 'Quản lý User', screen: 'ManageUsers' },
    { icon: 'flag', title: 'Quản lý Report', screen: 'ManageReports' },
    { icon: 'cancel', title: 'Quản lý Ban', screen: 'ManageBans' },
    { icon: 'bell-ring', title: 'Thông báo', screen: 'AdminNotifications' },
  ];

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      // AuthContext.logout() sẽ tự động navigate về Login screen
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.sidebar}>
        <LinearGradient
          colors={['#ef4444', '#dc2626', '#b91c1c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Profile Section */}
          <View style={styles.profile}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="shield-account" size={60} color="#fff" />
            </View>
            <Text style={styles.profileName}>{user?.fullName || 'Admin'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'admin@studentforum.vn'}</Text>
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons name="shield-crown" size={14} color="#fbbf24" />
              <Text style={styles.roleText}>ADMIN</Text>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  navigation.navigate(item.screen);
                }}
              >
                <MaterialCommunityIcons name={item.icon as any} size={24} color="#fecaca" />
                <Text style={styles.menuItemText}>{item.title}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#fca5a5" />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={24} color="#fff" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
    maxWidth: 300,
    zIndex: 999,
  },
  gradient: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profile: {
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fbbf24',
    marginLeft: 4,
  },
  menu: {
    flex: 1,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: '#fef2f2',
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
  },
});

export default AdminSidebar;
