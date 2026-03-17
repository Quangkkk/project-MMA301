import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { postService } from '../services/postService';
import { mediaService } from '../services/mediaService';

const PREDEFINED_TAGS = [
  'JavaScript', 'React', 'NodeJS', 'Python', 'Java',
  'CSS', 'HTML', 'TypeScript', 'Docker', 'Git',
  'MongoDB', 'SQL', 'AWS', 'Azure', 'DevOps',
  'AI', 'MachineLearning', 'DataScience', 'Mobile', 'Backend'
];

interface EditPostScreenProps {
  navigation: any;
  route: {
    params: {
      postId: number;
      initialTitle: string;
      initialContent: string;
      initialTags: string[];
      fromScreen?: string;
      userId?: number;
    };
  };
}

interface SelectedImage {
  uri: string;
  fileName: string;
  type: string;
  fileSize: number;
}

interface ExistingImage {
  mediaId: number;
  mediaUrl: string;
}

export default function EditPostScreen({ navigation, route }: EditPostScreenProps) {
  const { postId, initialTitle, initialContent, initialTags, fromScreen } = route.params;
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialTags.map(tag => tag.replace('#', ''))
  );
  const [loading, setLoading] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadExistingImages();
  }, []);

  const loadExistingImages = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const images = await mediaService.getMediaByEntity('Post', postId, token);
      setExistingImages(images);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
        return;
      }

      const totalImages = existingImages.length - removedImageIds.length + selectedImages.length;
      if (totalImages >= 10) {
        Alert.alert('Lỗi', 'Chỉ có thể upload tối đa 10 ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10 - totalImages,
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

  const removeExistingImage = (mediaId: number) => {
    setRemovedImageIds([...removedImageIds, mediaId]);
  };

  const removeNewImage = (index: number) => {
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

  const handleUpdatePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        navigation.replace('Login');
        return;
      }

      // Upload new images
      let newMediaIds: number[] = [];
      if (selectedImages.length > 0) {
        const formData = new FormData();
        
        selectedImages.forEach((image) => {
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
          newMediaIds = uploadedMedia.map(m => m.mediaId);
        } catch (uploadError: any) {
          console.error('Upload images error:', uploadError);
          Alert.alert('Lỗi', 'Không thể upload ảnh. Vui lòng thử lại.');
          setLoading(false);
          return;
        }
      }

      // Delete removed images
      if (removedImageIds.length > 0) {
        for (const mediaId of removedImageIds) {
          try {
            await mediaService.deleteMedia(mediaId, token);
          } catch (error) {
            console.error('Error deleting image:', error);
          }
        }
      }

      const tagArray = selectedTags.map(tag => `#${tag}`);

      await postService.updatePost(
        postId,
        {
          title: title.trim(),
          content: content.trim(),
          tags: tagArray,
          mediaIds: newMediaIds,
        },
        token
      );

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        if (fromScreen === 'UserProfile' && route.params.userId) {
          navigation.navigate('UserProfile', { 
            userId: route.params.userId,
            fullName: '',
            refresh: Date.now() 
          });
        } else {
          navigation.navigate('Home', { refresh: Date.now() });
        }
      }, 1500);
    } catch (error: any) {
      console.error('Update post error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật bài viết');
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
        <Text style={styles.headerTitle}>Chỉnh sửa bài viết</Text>
        <TouchableOpacity
          onPress={handleUpdatePost}
          disabled={loading}
          style={[styles.headerButton, styles.saveButton]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#1877f2" />
          ) : (
            <Text style={styles.saveButtonText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
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
            placeholder="Nội dung của bạn..."
            placeholderTextColor="#65676b"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

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
        </View>

        <View style={styles.addToPostCard}>
          <Text style={styles.addToPostTitle}>Thêm vào bài viết</Text>
          <View style={styles.addToPostButtons}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={pickImages}
              disabled={existingImages.length - removedImageIds.length + selectedImages.length >= 10}
            >
              <MaterialCommunityIcons name="image-multiple" size={24} color="#45bd62" />
              <Text style={styles.addButtonText}>Ảnh</Text>
              {(existingImages.length - removedImageIds.length + selectedImages.length) > 0 && (
                <Text style={styles.imageCount}>
                  {existingImages.length - removedImageIds.length + selectedImages.length}
                </Text>
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

        {/* Existing Images */}
        {existingImages.filter(img => !removedImageIds.includes(img.mediaId)).length > 0 && (
          <View style={styles.imagesCard}>
            <Text style={styles.imagesCardTitle}>Ảnh hiện tại</Text>
            <View style={styles.imageGrid}>
              {existingImages
                .filter(img => !removedImageIds.includes(img.mediaId))
                .map((image) => (
                  <View key={image.mediaId} style={styles.imageWrapper}>
                    <Image source={{ uri: image.mediaUrl }} style={styles.gridImage} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => removeExistingImage(image.mediaId)}
                    >
                      <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* New Images */}
        {selectedImages.length > 0 && (
          <View style={styles.imagesCard}>
            <Text style={styles.imagesCardTitle}>Ảnh mới</Text>
            <View style={styles.imageGrid}>
              {selectedImages.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: image.uri }} style={styles.gridImage} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => removeNewImage(index)}
                  >
                    <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

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
            <Text style={styles.successMessage}>Đã cập nhật bài viết</Text>
          </View>
        </View>
      </Modal>
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
  saveButton: {
    backgroundColor: '#1877f2',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
    fontSize: 15,
    fontWeight: '600',
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
    fontWeight: '500',
    color: '#050505',
  },
  tagCount: {
    fontSize: 12,
    color: '#65676b',
    fontWeight: '600',
  },
  imageCount: {
    fontSize: 12,
    color: '#65676b',
    fontWeight: '600',
  },
  imagesCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  imagesCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageWrapper: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  tagPickerCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#dadde1',
  },
  tagChipSelected: {
    backgroundColor: '#1877f2',
    borderColor: '#1877f2',
  },
  tagChipText: {
    fontSize: 14,
    color: '#050505',
    fontWeight: '500',
  },
  tagChipTextSelected: {
    color: '#fff',
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
  tagCount: {
    fontSize: 12,
    color: '#65676b',
    fontWeight: '600',
  },
  imageCount: {
    fontSize: 12,
    color: '#65676b',
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
});
