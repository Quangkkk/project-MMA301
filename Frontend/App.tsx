import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import TrendingScreen from './src/screens/TrendingScreen';
import SavedScreen from './src/screens/SavedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import EditPostScreen from './src/screens/EditPostScreen';
import CommentScreen from './src/screens/CommentScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import AboutScreen from './src/screens/AboutScreen';
import HelpScreen from './src/screens/HelpScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SettingsDetailScreen from './src/screens/SettingsDetailScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import VerifyOTPScreen from './src/screens/VerifyOTPScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import ReportHistoryScreen from './src/screens/ReportHistoryScreen';
import AdminDashboard from './src/screens/AdminDashboard';
import ManageUsersScreen from './src/screens/ManageUsersScreen';
import UserDetailsScreen from './src/screens/UserDetailsScreen';
import ManageReportsScreen from './src/screens/ManageReportsScreen';
import ManageBansScreen from './src/screens/ManageBansScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      ) : isAdmin ? (
        // Admin Stack
        <>
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
          <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
          <Stack.Screen name="ManageReports" component={ManageReportsScreen} />
          <Stack.Screen name="ManageBans" component={ManageBansScreen} />
        </>
      ) : (
        // User Stack
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Trending" component={TrendingScreen} />
          <Stack.Screen name="Saved" component={SavedScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="ChatList" component={ChatListScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="CreatePost" component={CreatePostScreen} />
          <Stack.Screen name="EditPost" component={EditPostScreen} />
          <Stack.Screen name="Comment" component={CommentScreen} />
          <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Help" component={HelpScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsDetailScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="MyPosts" component={ProfileScreen} />
          <Stack.Screen name="MyComments" component={ProfileScreen} />
          <Stack.Screen name="ReportHistory" component={ReportHistoryScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
