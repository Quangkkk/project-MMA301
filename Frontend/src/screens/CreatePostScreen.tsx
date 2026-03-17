import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { postService } from '../services/postService';
import BanAlertModal from '../components/BanAlertModal';
import { useBanCheck } from '../hooks/useBanCheck';

interface SelectedImage {
  uri: string;
  fileName: string;
  type: string;
  fileSize: number;
}

const PREDEFINED_TAGS = [
  'JavaScript', 'React', 'NodeJS', 'Python', 'Java',
  'CSS', 'HTML', 'TypeScript', 'Docker', 'Git',
  'MongoDB', 'SQL', 'AWS', 'Azure', 'DevOps',
  'AI', 'MachineLearning', 'DataScience', 'Mobile', 'Backend'
];

export default function CreatePostScreen({ navigation }: any) {
  const { banStatus, showBanModal, closeBanModal, recheckBanStatus } = useBanCheck();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

  const pickImages = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
        return;
      }

      // Pick images/videos (max 10)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10 - selectedImages.length,
      });

      if (!result.canceled && result.assets) {
        const newImages: SelectedImage[] = result.assets.map((asset) => ({
          uri: asset.uri,
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          fileSize: asset.fileSize || 0,
        }));

        setSelectedImages([...selectedImages, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmedTag = customTag.trim();
    if (!trimmedTag) return;

    if (selectedTags.includes(trimmedTag)) {
      Alert.alert('Thông báo', 'Tag này đã được chọn');
      return;
    }

    setSelectedTags([...selectedTags, trimmedTag]);
    setCustomTag('');
  };

  const handleCreatePost = async () => {
    if (!title.trim() || !content.trim()) {
      setErrorModal({ visible: true, title: 'Lỗi', message: 'Vui lòng nhập tiêu đề và nội dung' });
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setErrorModal({ visible: true, title: 'Lỗi', message: 'Vui lòng đăng nhập lại' });
        setTimeout(() => navigation.replace('Login'), 1500);
        return;
      }

      let mediaIds: number[] = [];

      // Upload images if any
      if (selectedImages.length > 0) {
        const formData = new FormData();
        
        selectedImages.forEach((image) => {
          // Extract file extension from uri or fileName
          const uriParts = image.uri.split('.');
          const fileType = uriParts[uriParts.length - 1];
          
          formData.append('images', {
            uri: image.uri,
            name: image.fileName || `photo_${Date.now()}.${fileType}`,
            type: `image/${fileType}`,
          } as any);
        });

        try {
          const uploadedMedia = await postService.uploadImages(formData, token);
          mediaIds = uploadedMedia.map(m => m.mediaId);
        } catch (uploadError: any) {
          setErrorModal({ visible: true, title: 'Lỗi', message: 'Không thể upload ảnh. Vui lòng thử lại.' });
          setLoading(false);
          return;
        }
      }

      // Parse tags
      const tagArray = selectedTags.map(tag => `#${tag}`);

      // Create post
      await postService.createPost(
        {
          title: title.trim(),
          content: content.trim(),
          tags: tagArray,
          mediaIds: mediaIds,
        },
        token
      );

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        navigation.navigate('Home', { refresh: Date.now() });
      }, 1500);
    } catch (error: any) {
      if (error.response?.status === 403) {
        await recheckBanStatus();
      } else {
        const errorMsg = error.response?.data?.message || error.message || 'Không thể đăng bài viết';
        setErrorModal({ visible: true, title: 'Lỗi', message: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <MaterialCommunityIcons name="close" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo bài viết</Text>
        <TouchableOpacity
          onPress={handleCreatePost}
          disabled={loading}
          style={[styles.headerButton, styles.postButton]}
        >
          <Text style={[styles.postButtonText, loading && styles.postButtonTextDisabled]}>
            {loading ? 'Đang đăng...' : 'Đăng'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Main Input Area - Facebook Style */}
        <View style={styles.mainInputCard}>
          <TextInput
            style={styles.titleInput}
            placeholder="Tiêu đề bài viết"
            placeholderTextColor="#65676b"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
          
          <TextInput
            style={styles.contentInput}
            placeholder="Bạn đang nghĩ gì?"
            placeholderTextColor="#65676b"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <View style={styles.selectedTagsContainer}>
              {selectedTags.map((tag) => (
                <View key={tag} style={styles.selectedTagChip}>
                  <Text style={styles.selectedTagText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => toggleTag(tag)}>
                    <MaterialCommunityIcons name="close-circle" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Image/Video Preview */}
          {selectedImages.length > 0 && (
            <View style={styles.imageGrid}>
              {selectedImages.map((image, index) => {
                const isVideo = image.type?.startsWith('video/');
                return (
                  <View key={index} style={styles.imageWrapper}>
                    {isVideo ? (
                      <>
                        <Video
                          source={{ uri: image.uri }}
                          style={styles.gridImage}
                          useNativeControls
                          resizeMode={ResizeMode.CONTAIN}
                          isLooping
                        />
                        <View style={styles.videoIndicator}>
                          <MaterialCommunityIcons name="play-circle" size={32} color="#fff" />
                        </View>
                      </>
                    ) : (
                      <Image source={{ uri: image.uri }} style={styles.gridImage} />
                    )}
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => removeImage(index)}
                    >
                      <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Add to Post Section */}
        <View style={styles.addToPostCard}>
          <Text style={styles.addToPostTitle}>Thêm vào bài viết của bạn</Text>
          <View style={styles.addToPostButtons}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={pickImages}
              disabled={selectedImages.length >= 10}
            >
              <MaterialCommunityIcons name="image-multiple" size={24} color="#45bd62" />
              <Text style={styles.addButtonText}>Ảnh/Video</Text>
              {selectedImages.length > 0 && (
                <Text style={styles.imageCount}>{selectedImages.length}</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowTagPicker(!showTagPicker)}
            >
              <MaterialCommunityIcons name="tag-multiple" size={24} color="#f3425f" />
              <Text style={styles.addButtonText}>Tags</Text>
              {selectedTags.length > 0 && (
                <Text style={styles.tagCount}>{selectedTags.length}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Tag Picker */}
        {showTagPicker && (
          <View style={styles.tagPickerCard}>
            <Text style={styles.tagPickerTitle}>Chọn hoặc nhập tag mới</Text>
            
            {/* Custom Tag Input */}
            <View style={styles.customTagInput}>
              <TextInput
                style={styles.tagInput}
                placeholder="Nhập tag mới..."
                placeholderTextColor="#65676b"
                value={customTag}
                onChangeText={setCustomTag}
                onSubmitEditing={addCustomTag}
              />
              <TouchableOpacity 
                style={styles.addTagButton}
                onPress={addCustomTag}
              >
                <MaterialCommunityIcons name="plus-circle" size={28} color="#1877f2" />
              </TouchableOpacity>
            </View>

            <Text style={styles.predefinedTagsTitle}>Tags có sẵn</Text>
            <View style={styles.tagGrid}>
              {PREDEFINED_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    selectedTags.includes(tag) && styles.tagChipSelected
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[
                    styles.tagChipText,
                    selectedTags.includes(tag) && styles.tagChipTextSelected
                  ]}>
                    #{tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Success Modal */}
      <Modal
        transparent
        visible={showSuccessModal}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIconContainer}>
              <MaterialCommunityIcons name="check-circle" size={64} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>Thành công!</Text>
            <Text style={styles.successMessage}>Đã đăng bài viết</Text>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={errorModal.visible}
        onRequestClose={() => setErrorModal({ visible: false, title: '', message: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.errorModal}>
            <View style={styles.errorIconContainer}>
              <MaterialCommunityIcons name="alert-circle" size={64} color="#ef4444" />
            </View>
            <Text style={styles.errorTitle}>{errorModal.title}</Text>
            <Text style={styles.errorMessage}>{errorModal.message}</Text>
            <TouchableOpacity
              style={styles.errorButton}
              onPress={() => setErrorModal({ visible: false, title: '', message: '' })}
            >
              <Text style={styles.errorButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Ban Alert Modal */}
      <BanAlertModal
        visible={showBanModal}
        bans={banStatus?.activeBans || []}
        onClose={closeBanModal}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#dadde1',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#050505',
  },
  postButton: {
    backgroundColor: '#1877f2',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  postButtonTextDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  mainInputCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#050505',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
    marginBottom: 12,
  },
  contentInput: {
    fontSize: 16,
    color: '#050505',
    minHeight: 150,
    lineHeight: 22,
    paddingVertical: 8,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e4e6eb',
  },
  selectedTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1877f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  selectedTagText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e4e6eb',
  },
  imageWrapper: {
    position: 'relative',
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f2f5',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 2,
  },
  videoIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    pointerEvents: 'none',
  },
  addToPostCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dadde1',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  addToPostTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#050505',
    marginBottom: 12,
  },
  addToPostButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    color: '#050505',
    fontWeight: '500',
  },
  imageCount: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#45bd62',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '600',
    overflow: 'hidden',
  },
  tagCount: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#f3425f',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '600',
    overflow: 'hidden',
  },
  tagPickerCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  tagPickerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
    marginBottom: 12,
  },
  customTagInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#050505',
  },
  addTagButton: {
    padding: 4,
  },
  predefinedTagsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#65676b',
    marginBottom: 8,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#dadde1',
  },
  tagChipSelected: {
    backgroundColor: '#e7f3ff',
    borderColor: '#1877f2',
  },
  tagChipText: {
    fontSize: 14,
    color: '#65676b',
    fontWeight: '500',
  },
  tagChipTextSelected: {
    color: '#1877f2',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#050505',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#65676b',
    textAlign: 'center',
  },
  errorModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#65676b',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 120,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
