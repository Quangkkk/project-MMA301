import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getMessages, sendMessage, markMessagesAsRead } from '../services/chatService';

interface Message {
  MessageID: number;
  ConversationID: number;
  SenderID: number;
  Content: string;
  AttachmentURL: string | null;
  IsRead: boolean;
  CreatedAt: string;
}

interface ChatScreenProps {
  navigation: any;
  route: {
    params: {
      conversationId: number;
      otherUser: {
        userId: number;
        username: string;
        fullName: string;
        avatarURL: string | null;
      };
    };
  };
}

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
  const { conversationId, otherUser } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    markMessagesAsRead(conversationId);
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await getMessages(conversationId, 100);
      setMessages(data.reverse()); // Reverse để tin nhắn mới nhất ở dưới
    } catch (error) {
      console.error('Load messages error:', error);
      Alert.alert('Lỗi', 'Không thể tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      setSending(true);
      const sentMessage = await sendMessage(conversationId, messageContent);
      setMessages(prev => [...prev, sentMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn');
      setNewMessage(messageContent); // Restore message
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 0) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return `Hôm qua ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (fullName: string) => {
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return fullName.substring(0, 2);
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.SenderID === user?.userId;
    const showAvatar = !isMyMessage && (index === messages.length - 1 || messages[index + 1]?.SenderID !== item.SenderID);
    const showTime = index === messages.length - 1 || 
      new Date(messages[index + 1]?.CreatedAt).getTime() - new Date(item.CreatedAt).getTime() > 300000; // 5 phút

    return (
      <View style={[styles.messageRow, isMyMessage && styles.myMessageRow]}>
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            {showAvatar ? (
              otherUser.avatarURL ? (
                <Image source={{ uri: otherUser.avatarURL }} style={styles.messageAvatar} />
              ) : (
                <View style={[styles.messageAvatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>{getInitials(otherUser.fullName)}</Text>
                </View>
              )
            ) : (
              <View style={styles.messageAvatar} />
            )}
          </View>
        )}

        <View style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}>
          <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
            <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
              {item.Content}
            </Text>
          </View>
          {showTime && (
            <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
              {formatTime(item.CreatedAt)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerUserInfo}
          onPress={() => {
            navigation.navigate('UserProfile', {
              userId: otherUser.userId,
              fullName: otherUser.fullName,
              avatarURL: otherUser.avatarURL
            });
          }}
        >
          {otherUser.avatarURL ? (
            <Image source={{ uri: otherUser.avatarURL }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.headerAvatarText}>{getInitials(otherUser.fullName)}</Text>
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName}>{otherUser.fullName}</Text>
            <Text style={styles.headerStatus}>Đang hoạt động</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerButton}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1877f2" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.MessageID.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <MaterialCommunityIcons name="plus-circle" size={28} color="#1877f2" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Aa"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={2000}
        />

        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#1877f2" />
          ) : (
            <MaterialCommunityIcons 
              name="send" 
              size={20} 
              color={newMessage.trim() ? "#1877f2" : "#bcc0c4"} 
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb'
  },
  backButton: {
    padding: 8
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e1e4e8'
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  avatarPlaceholder: {
    backgroundColor: '#1877f2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTextContainer: {
    marginLeft: 10,
    flex: 1
  },
  headerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a'
  },
  headerStatus: {
    fontSize: 12,
    color: '#65676b',
    marginTop: 2
  },
  headerButton: {
    padding: 8
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end'
  },
  myMessageRow: {
    justifyContent: 'flex-end'
  },
  avatarContainer: {
    width: 28,
    marginRight: 8
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent'
  },
  avatarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600'
  },
  messageContainer: {
    maxWidth: '70%'
  },
  myMessageContainer: {
    alignItems: 'flex-end'
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18
  },
  otherMessageBubble: {
    backgroundColor: '#f0f2f5'
  },
  myMessageBubble: {
    backgroundColor: '#1877f2'
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1a1a1a'
  },
  myMessageText: {
    color: '#fff'
  },
  messageTime: {
    fontSize: 11,
    color: '#65676b',
    marginTop: 4,
    marginLeft: 12
  },
  myMessageTime: {
    marginRight: 12,
    marginLeft: 0
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e4e6eb'
  },
  attachButton: {
    padding: 6,
    marginRight: 8
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: '#f0f2f5',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    marginRight: 8
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    opacity: 0.5
  }
});
