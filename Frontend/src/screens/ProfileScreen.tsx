import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [avatarURL, setAvatarURL] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvatarURL(response.data.data?.AvatarURL || '');
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    { icon: 'account-circle', label: 'Thông tin cá nhân', route: 'EditProfile', params: undefined },
    { 
      icon: 'file-document-outline', 
      label: 'Bài viết của tôi', 
      route: 'UserProfile', 
      params: { 
        userId: user?.userId || 0,
        fullName: user?.fullName || 'User',
        avatarURL: avatarURL || undefined
      } 
    },
    { icon: 'bell-outline', label: 'Thông báo', route: 'Notifications', params: undefined },
    { icon: 'lock-reset', label: 'Thay đổi mật khẩu', route: 'ChangePassword', params: undefined },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {avatarURL ? (
            <Image source={{ uri: avatarURL }} style={styles.avatarLarge} />
          ) : (
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <Text style={styles.fullName}>{user?.fullName || 'User Name'}</Text>
          <Text style={styles.username}>@{user?.username || 'username'}</Text>
          <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || 'User'}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => item.params ? navigation.navigate(item.route, item.params) : navigation.navigate(item.route)}
            >
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color="#6b7280" />
                <Text style={styles.menuItemText}>{item.label}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  fullName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  reputationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  roleBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#e8f1ff',
    borderRadius: 16,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A90E2',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
});
